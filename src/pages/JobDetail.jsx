import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Users, Briefcase, Calendar, DollarSign, CheckCircle, Award, FileText, ExternalLink, Pencil } from 'lucide-react';
import { formatSalary } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import useLanguage from '@/lib/useLanguage';
import { api } from '@/lib/api';
import { useEmploymentTypes, useIslands } from '@/lib/queries';
import JobImage from '@/components/JobImage';
import FavoriteButton from '@/components/FavoriteButton';
import { useAuth } from '@/lib/AuthContext';
import moment from 'moment';

export default function JobDetail() {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const goBack = () => (window.history.length > 1 && location.key !== 'default') ? navigate(-1) : navigate('/dashboard');
    const { t, lang } = useLanguage();
    const { isAuthenticated, me } = useAuth();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [applyOpen, setApplyOpen] = useState(false);
    const [coverLetter, setCoverLetter] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [alreadyApplied, setAlreadyApplied] = useState(false);
    const [attachResume, setAttachResume] = useState(true);
    const { data: empsData } = useEmploymentTypes();
    const { data: islands } = useIslands();
    const empMap = useMemo(() => Object.fromEntries((empsData || []).map(e => [e.key, { en: e.label_en, el: e.label_el }])), [empsData]);

    useEffect(() => {
        const load = async () => {
            const jobData = await api.getJob(jobId);
            setJob(jobData);
            if (isAuthenticated && me) {
                const { applied } = await api.checkApplied(jobId);
                setAlreadyApplied(applied);
            }
            setLoading(false);
        };
        load();
    }, [jobId, isAuthenticated, me]);

    const handleApply = () => {
        if (!isAuthenticated) { navigate('/login'); return; }
        setApplyOpen(true);
    };

    const submitApplication = async () => {
        setSubmitting(true);
        await api.apply({
            job_id: jobId,
            cover_letter: coverLetter,
            resume_url: attachResume && me?.resume_url ? me.resume_url : null,
        });
        setSubmitting(false);
        setApplyOpen(false);
        setAlreadyApplied(true);
        toast.success(t('apply_success'));
    };

    if (loading) return <div className="flex justify-center py-32"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
    if (!job) return <div className="max-w-3xl mx-auto px-4 py-20 text-center"><p className="text-muted-foreground">Job not found</p><Link to="/jobs"><Button variant="outline" className="mt-4">{t('common_back')}</Button></Link></div>;

    const empLabel = key => empMap[key]?.[lang] ?? empMap[key]?.en ?? key;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
            <button onClick={goBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" />{t('common_back')}
            </button>

            <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
                <div className="relative h-48 sm:h-64">
                    <JobImage job={job} islands={islands} />
                    <FavoriteButton kind="job" id={job.id} className="absolute top-3 right-3" />
                    {job.hotel_logo ? (
                        <img src={job.hotel_logo} alt="" className="absolute bottom-0 left-6 sm:left-8 translate-y-1/2 w-16 h-16 rounded-2xl object-cover border-2 border-card shadow-md" />
                    ) : (
                        <div className="absolute bottom-0 left-6 sm:left-8 translate-y-1/2 w-16 h-16 rounded-2xl bg-primary border-2 border-card shadow-md flex items-center justify-center">
                            <Briefcase className="w-7 h-7 text-primary-foreground" />
                        </div>
                    )}
                </div>
                <div className="p-6 sm:p-8 pt-12 sm:pt-14">
                <div className="flex items-start gap-4 mb-6">
                    <div className="flex-1">
                        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{lang === 'el' && job.title_el ? job.title_el : job.title}</h1>
                        <Link to={`/hotels/${job.hotel_user_id}`} className="text-lg text-muted-foreground hover:text-primary transition-colors mt-1 inline-block">
                            {job.hotel_name}
                        </Link>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-8">
                    <Badge variant="secondary" className="gap-1 rounded-lg py-1.5 px-3"><MapPin className="w-3.5 h-3.5" />{job.location}</Badge>
                    <Badge variant="outline" className="gap-1 rounded-lg py-1.5 px-3"><Clock className="w-3.5 h-3.5" />{empLabel(job.employment_type)}</Badge>
                    {job.positions_available && <Badge variant="outline" className="gap-1 rounded-lg py-1.5 px-3"><Users className="w-3.5 h-3.5" />{job.positions_available} {t('jobs_positions')}</Badge>}
                    {job.salary_amount && <Badge variant="secondary" className="gap-1 rounded-lg py-1.5 px-3 bg-primary/10 text-primary border-0"><DollarSign className="w-3.5 h-3.5" />{formatSalary(job.salary_amount, job.salary_period, lang)}</Badge>}
                    {job.start_date && <Badge variant="outline" className="gap-1 rounded-lg py-1.5 px-3"><Calendar className="w-3.5 h-3.5" />{job.start_date}</Badge>}
                </div>

                <div className="space-y-6">
                    <div>
                        <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Briefcase className="w-4 h-4 text-primary" />{lang === 'el' ? 'Περιγραφή Θέσης' : 'Job Description'}</h2>
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{(lang === 'el' && job.description_el) ? job.description_el : job.description}</p>
                    </div>
                    {(job.requirements || job.requirements_el) && (
                        <div>
                            <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-primary" />{lang === 'el' ? 'Απαιτήσεις' : 'Requirements'}</h2>
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{(lang === 'el' && job.requirements_el) ? job.requirements_el : job.requirements}</p>
                        </div>
                    )}
                    {(job.benefits || job.benefits_el) && (
                        <div>
                            <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" />{lang === 'el' ? 'Παροχές' : 'Benefits'}</h2>
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{(lang === 'el' && job.benefits_el) ? job.benefits_el : job.benefits}</p>
                        </div>
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-border/50 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{t('jobs_posted')} {moment(job.created_at).fromNow()}</span>
                    {me?.role === 'hotel' ? (
                        job.hotel_user_id === me.id && (
                            <Link to="/dashboard">
                                <Button variant="outline" className="rounded-xl gap-2 px-6">
                                    <Pencil className="w-4 h-4" />{lang === 'el' ? 'Επεξεργασία' : 'Edit'}
                                </Button>
                            </Link>
                        )
                    ) : alreadyApplied ? (
                        <Badge variant="secondary" className="gap-1 rounded-lg py-2 px-4"><CheckCircle className="w-4 h-4" />{t('apply_already')}</Badge>
                    ) : job.status === 'active' ? (
                        <Button onClick={handleApply} className="rounded-xl px-6">{isAuthenticated ? t('jobs_apply') : t('jobs_login_to_apply')}</Button>
                    ) : (
                        <Badge variant="secondary">{t('status_closed')}</Badge>
                    )}
                </div>
                </div>
            </div>

            <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
                <DialogContent className="rounded-2xl">
                    <DialogHeader><DialogTitle className="font-display">{t('apply_title')}</DialogTitle></DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">{t('apply_cover_letter')}</label>
                            <Textarea className="rounded-xl min-h-[120px]" value={coverLetter} onChange={e => setCoverLetter(e.target.value)}
                                placeholder={lang === 'el' ? 'Γράψτε μια σύντομη συνοδευτική επιστολή...' : 'Write a brief cover letter...'} />
                        </div>

                        {/* Resume attach */}
                        <div className="rounded-xl border border-border/50 p-3 bg-muted/30">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-foreground">
                                            {lang === 'el' ? 'Βιογραφικό (CV)' : 'Resume / CV'}
                                        </p>
                                        {me?.resume_url ? (
                                            <a href={me.resume_url} target="_blank" rel="noopener noreferrer"
                                                className="text-xs text-primary hover:underline flex items-center gap-1">
                                                {lang === 'el' ? 'Προβολή CV' : 'View CV'}
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        ) : (
                                            <p className="text-xs text-muted-foreground">
                                                {lang === 'el' ? 'Δεν έχετε ανεβάσει CV — ' : 'No CV uploaded — '}
                                                <Link to="/profile" className="text-primary hover:underline" onClick={() => setApplyOpen(false)}>
                                                    {lang === 'el' ? 'Ανεβάστε στο προφίλ σας' : 'Upload in your profile'}
                                                </Link>
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {me?.resume_url && (
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input type="checkbox" checked={attachResume} onChange={e => setAttachResume(e.target.checked)} className="rounded" />
                                        <span className="text-sm text-foreground">{lang === 'el' ? 'Επισύναψη' : 'Attach'}</span>
                                    </label>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <Button variant="outline" onClick={() => setApplyOpen(false)} className="rounded-xl">{t('common_cancel')}</Button>
                            <Button onClick={submitApplication} disabled={submitting} className="rounded-xl">{submitting ? t('common_loading') : t('apply_submit')}</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
