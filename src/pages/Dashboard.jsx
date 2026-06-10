import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, FileText, CheckCircle, XCircle, Clock, Plus, ExternalLink, ChevronDown, ChevronUp, Users, MessageCircle, AlertCircle, User, MapPin, Award, Languages, Star, LayoutDashboard, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import GuestView from '@/lib/GuestView';
import useLanguage from '@/lib/useLanguage';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import moment from 'moment';

const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800', reviewed: 'bg-blue-100 text-blue-800',
    accepted: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800',
    withdrawn: 'bg-gray-100 text-gray-800', active: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800', draft: 'bg-yellow-100 text-yellow-800',
};

function StatCard({ icon: Icon, label, value, color }) {
    return (
        <div className="bg-card rounded-2xl border border-border/50 p-5">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}><Icon className="w-5 h-5" /></div>
                <div><p className="text-2xl font-bold text-foreground">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const { t, lang } = useLanguage();
    const { me, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [favorites, setFavorites] = useState(new Set()); // set of applicant_emails
    const [loading, setLoading] = useState(true);
    const [expandedJobIds, setExpandedJobIds] = useState(new Set());
    const [profileModal, setProfileModal] = useState(null); // { loading, data }
    const [editModal, setEditModal] = useState(null); // { job, form, saving }
    const [deleteConfirm, setDeleteConfirm] = useState(null); // jobId

    useEffect(() => {
        if (!me) return;
        const load = async () => {
            if (me.role === 'hotel') {
                const [myJobs, allApps, convs, favs] = await Promise.all([
                    api.getMyJobs(),
                    api.getApplications(),
                    api.getConversations(),
                    api.getFavorites(),
                ]);
                setJobs(myJobs || []);
                setApplications(allApps || []);
                setConversations(convs || []);
                setFavorites(new Set((favs || []).map(f => f.applicant_email)));
            } else {
                const myApps = await api.getApplications();
                setApplications(myApps || []);
            }
            setLoading(false);
        };
        load();
    }, [me]);

    if (authLoading) return <div className="flex justify-center py-32" style={{ background: '#eef4fd', minHeight: '100vh' }}><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
    if (!me) return <GuestView icon={LayoutDashboard} titleEl="Το Dashboard σας" titleEn="Your Dashboard" descEl="Συνδεθείτε για να δείτε τις αγγελίες και αιτήσεις σας." descEn="Sign in to view your jobs and applications." />;
    if (loading) return <div className="flex justify-center py-32" style={{ background: '#eef4fd', minHeight: '100vh' }}><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

    const isHotel = me?.role === 'hotel';
    const pendingApps = applications.filter(a => a.status === 'pending').length;
    const acceptedApps = applications.filter(a => a.status === 'accepted').length;
    const activeJobs = jobs.filter(j => j.status === 'active').length;

    const handleAppStatus = async (appId, newStatus) => {
        await api.updateApplicationStatus(appId, newStatus);
        setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
    };

    const hasConversation = (app) =>
        conversations.some(c => c.job_id === app.job_id && (
            (c.participant_1 === app.applicant_email || c.participant_2 === app.applicant_email)
        ));

    const handleToggleFavorite = async (app) => {
        const { favorited } = await api.toggleFavorite(app.applicant_email, app.applicant_name);
        setFavorites(prev => {
            const next = new Set(prev);
            favorited ? next.add(app.applicant_email) : next.delete(app.applicant_email);
            return next;
        });
    };

    const handleViewProfile = async (email) => {
        setProfileModal({ loading: true, data: null });
        try {
            const data = await api.getPublicProfile(email);
            setProfileModal({ loading: false, data });
        } catch {
            setProfileModal(null);
        }
    };

    const handleOpenEdit = (job) => {
        setEditModal({ job, saving: false, form: {
            title: job.title || '',
            location: job.location || '',
            description: job.description || '',
            requirements: job.requirements || '',
            employment_type: job.employment_type || '',
            salary_range: job.salary_range || '',
            positions_available: job.positions_available || 1,
            start_date: job.start_date || '',
            category: job.category || '',
            benefits: job.benefits || '',
            status: job.status || 'active',
        }});
    };

    const handleSaveEdit = async () => {
        if (!editModal) return;
        setEditModal(m => ({ ...m, saving: true }));
        const updated = await api.updateJob(editModal.job.id, editModal.form);
        setJobs(prev => prev.map(j => j.id === updated.id ? updated : j));
        setEditModal(null);
    };

    const handleDeleteJob = async () => {
        if (!deleteConfirm) return;
        await api.deleteJob(deleteConfirm);
        setJobs(prev => prev.filter(j => j.id !== deleteConfirm));
        setApplications(prev => prev.filter(a => a.job_id !== deleteConfirm));
        setDeleteConfirm(null);
    };

    const handleSendMessage = async (app) => {
        const conv = await api.startConversation({
            other_email: app.applicant_email,
            other_name: app.applicant_name,
            job_id: app.job_id,
            job_title: app.job_title,
        });
        setConversations(prev => prev.some(c => c.id === conv.id) ? prev : [...prev, conv]);
        navigate('/messages');
    };

    return (
        <>
        <div style={{ background: '#eef4fd', minHeight: '100vh' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="font-display text-3xl font-bold text-foreground">{t('dash_welcome')}, {me?.full_name}</h1>
                        <p className="text-muted-foreground mt-1">{isHotel ? (lang === 'el' ? 'Διαχείριση θέσεων & αιτήσεων' : 'Manage your jobs & applications') : (lang === 'el' ? 'Παρακολουθήστε τις αιτήσεις σας' : 'Track your applications')}</p>
                    </div>
                    {isHotel && <Link to="/post-job"><Button className="rounded-xl gap-2"><Plus className="w-4 h-4" />{t('nav_post_job')}</Button></Link>}
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard icon={FileText} label={t('dash_total_apps')} value={applications.length} color="bg-primary/10 text-primary" />
                    <StatCard icon={Clock} label={t('dash_pending')} value={pendingApps} color="bg-yellow-50 text-yellow-600" />
                    <StatCard icon={CheckCircle} label={t('dash_accepted')} value={acceptedApps} color="bg-green-50 text-green-600" />
                    {isHotel ? <StatCard icon={Briefcase} label={t('dash_active_jobs')} value={activeJobs} color="bg-blue-50 text-blue-600" /> : <StatCard icon={XCircle} label={t('dash_rejected')} value={applications.filter(a => a.status === 'rejected').length} color="bg-red-50 text-red-600" />}
                </div>

                {isHotel && (
                    <div className="mb-8">
                        <h2 className="font-display text-xl font-bold text-foreground mb-4">{t('dash_my_jobs')}</h2>
                        <div className="space-y-3">
                            {jobs.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">{t('common_no_data')}</p>
                            ) : jobs.map(job => {
                                const jobApps = applications.filter(a => a.job_id === job.id);
                                const isExpanded = expandedJobIds.has(job.id);
                                return (
                                    <div key={job.id} className="bg-card rounded-xl border border-border/50 overflow-hidden">
                                        {/* Job header row — click to expand */}
                                        <button
                                            className="w-full p-4 flex items-center justify-between gap-4 hover:bg-accent/30 transition-colors text-left"
                                            onClick={() => setExpandedJobIds(prev => {
                                                const next = new Set(prev);
                                                next.has(job.id) ? next.delete(job.id) : next.add(job.id);
                                                return next;
                                            })}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-foreground">{job.title}</p>
                                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                    <span>{job.location}</span>
                                                    <span>·</span>
                                                    <Users className="w-3 h-3" />
                                                    <span>{jobApps.length} {lang === 'el' ? 'αιτήσεις' : 'applications'}</span>
                                                    {jobApps.filter(a => a.status === 'pending').length > 0 && (
                                                        <span className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-md text-xs font-medium">
                                                            {jobApps.filter(a => a.status === 'pending').length} {lang === 'el' ? 'νέες' : 'new'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <Badge className={`${statusColors[job.status]} border-0 rounded-lg`}>{t(`status_${job.status}`)}</Badge>
                                                <button
                                                    onClick={e => { e.stopPropagation(); handleOpenEdit(job); }}
                                                    className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                                                    title={lang === 'el' ? 'Επεξεργασία' : 'Edit'}
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={e => { e.stopPropagation(); setDeleteConfirm(job.id); }}
                                                    className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                                                    title={lang === 'el' ? 'Διαγραφή' : 'Delete'}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                                            </div>
                                        </button>

                                        {/* Expanded applications */}
                                        {isExpanded && (
                                            <div className="border-t border-border/50 divide-y divide-border/30">
                                                {jobApps.length === 0 ? (
                                                    <p className="text-sm text-muted-foreground text-center py-6">
                                                        {lang === 'el' ? 'Δεν υπάρχουν αιτήσεις ακόμα' : 'No applications yet'}
                                                    </p>
                                                ) : jobApps.map(app => (
                                                    <div key={app.id} className="p-4 flex items-start justify-between gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <button
                                                                    onClick={() => handleViewProfile(app.applicant_email)}
                                                                    className="font-medium text-sm text-foreground hover:text-primary hover:underline transition-colors text-left"
                                                                >
                                                                    {app.applicant_name}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleToggleFavorite(app)}
                                                                    className="flex-shrink-0 transition-colors"
                                                                    title={favorites.has(app.applicant_email) ? (lang === 'el' ? 'Αφαίρεση από αγαπημένα' : 'Remove from favourites') : (lang === 'el' ? 'Προσθήκη στα αγαπημένα' : 'Add to favourites')}
                                                                >
                                                                    <Star className={`w-3.5 h-3.5 ${favorites.has(app.applicant_email) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/40 hover:text-yellow-400'}`} />
                                                                </button>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">{app.applicant_email}</p>
                                                            {app.cover_letter && (
                                                                <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">"{app.cover_letter}"</p>
                                                            )}
                                                            <div className="flex items-center gap-3 mt-2">
                                                                <span className="text-xs text-muted-foreground">{moment(app.created_at).fromNow()}</span>
                                                                {app.resume_url && (
                                                                    <a href={app.resume_url} target="_blank" rel="noopener noreferrer"
                                                                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                                                                        <FileText className="w-3 h-3" />
                                                                        {lang === 'el' ? 'Βιογραφικό' : 'Resume'}
                                                                        <ExternalLink className="w-3 h-3" />
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                            <Select value={app.status} onValueChange={val => handleAppStatus(app.id, val)}>
                                                                <SelectTrigger className={`h-7 text-xs font-medium rounded-xl border-0 px-2.5 w-auto gap-1.5 ${statusColors[app.status]}`}>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent className="rounded-xl">
                                                                    <SelectItem value="pending" className="rounded-lg text-xs">{lang === 'el' ? 'Νέα' : 'Pending'}</SelectItem>
                                                                    <SelectItem value="reviewed" className="rounded-lg text-xs">{lang === 'el' ? 'Σε εξέταση' : 'Reviewed'}</SelectItem>
                                                                    <SelectItem value="accepted" className="rounded-lg text-xs">{lang === 'el' ? 'Αποδεκτή' : 'Accepted'}</SelectItem>
                                                                    <SelectItem value="rejected" className="rounded-lg text-xs">{lang === 'el' ? 'Απορρίφθηκε' : 'Rejected'}</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            {app.status === 'accepted' && (
                                                                <button
                                                                    onClick={() => handleSendMessage(app)}
                                                                    className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl font-medium transition-colors ${
                                                                        hasConversation(app)
                                                                            ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                                                            : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                                                    }`}
                                                                >
                                                                    {hasConversation(app) ? (
                                                                        <><MessageCircle className="w-3.5 h-3.5" />{lang === 'el' ? 'Μηνύματα' : 'Messages'}</>
                                                                    ) : (
                                                                        <><AlertCircle className="w-3.5 h-3.5" />{lang === 'el' ? 'Στείλτου μήνυμα' : 'Send message'}</>
                                                                    )}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Server: my applications */}
                {!isHotel && (
                    <div>
                        <h2 className="font-display text-xl font-bold text-foreground mb-4">{t('dash_my_applications')}</h2>
                        <div className="space-y-3">
                            {applications.length === 0 ? <p className="text-muted-foreground text-center py-8">{t('common_no_data')}</p> : applications.map(app => (
                                <div key={app.id} className="bg-card rounded-xl border border-border/50 p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <Link to={`/jobs/${app.job_id}`} className="font-medium text-foreground hover:text-primary transition-colors">{app.job_title}</Link>
                                            <p className="text-sm text-muted-foreground mt-0.5">{app.hotel_name}</p>
                                            {app.cover_letter && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{app.cover_letter}</p>}
                                            <p className="text-xs text-muted-foreground mt-2">{moment(app.created_at).fromNow()}</p>
                                        </div>
                                        <Badge className={`${statusColors[app.status]} border-0 rounded-lg`}>{t(`status_${app.status}`)}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Edit job modal */}
        <Dialog open={!!editModal} onOpenChange={open => !open && setEditModal(null)}>
            <DialogContent className="rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="font-display">{lang === 'el' ? 'Επεξεργασία Αγγελίας' : 'Edit Job'}</DialogTitle>
                </DialogHeader>
                {editModal && (
                    <div className="space-y-4 mt-2">
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">{lang === 'el' ? 'Τίτλος *' : 'Title *'}</label>
                            <Input className="rounded-xl" value={editModal.form.title} onChange={e => setEditModal(m => ({ ...m, form: { ...m.form, title: e.target.value } }))} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1.5 block">{lang === 'el' ? 'Τοποθεσία' : 'Location'}</label>
                                <Input className="rounded-xl" value={editModal.form.location} onChange={e => setEditModal(m => ({ ...m, form: { ...m.form, location: e.target.value } }))} />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1.5 block">{lang === 'el' ? 'Μισθός' : 'Salary'}</label>
                                <Input className="rounded-xl" value={editModal.form.salary_range} onChange={e => setEditModal(m => ({ ...m, form: { ...m.form, salary_range: e.target.value } }))} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1.5 block">{lang === 'el' ? 'Θέσεις' : 'Positions'}</label>
                                <Input type="number" className="rounded-xl" value={editModal.form.positions_available} onChange={e => setEditModal(m => ({ ...m, form: { ...m.form, positions_available: Number(e.target.value) } }))} />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1.5 block">{lang === 'el' ? 'Ημ/νία Έναρξης' : 'Start Date'}</label>
                                <Input className="rounded-xl" value={editModal.form.start_date} onChange={e => setEditModal(m => ({ ...m, form: { ...m.form, start_date: e.target.value } }))} />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">{lang === 'el' ? 'Κατάσταση' : 'Status'}</label>
                            <Select value={editModal.form.status} onValueChange={v => setEditModal(m => ({ ...m, form: { ...m.form, status: v } }))}>
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="active" className="rounded-lg">{lang === 'el' ? 'Ενεργή' : 'Active'}</SelectItem>
                                    <SelectItem value="closed" className="rounded-lg">{lang === 'el' ? 'Κλειστή' : 'Closed'}</SelectItem>
                                    <SelectItem value="draft" className="rounded-lg">{lang === 'el' ? 'Πρόχειρο' : 'Draft'}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">{lang === 'el' ? 'Περιγραφή' : 'Description'}</label>
                            <Textarea className="rounded-xl min-h-[100px]" value={editModal.form.description} onChange={e => setEditModal(m => ({ ...m, form: { ...m.form, description: e.target.value } }))} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">{lang === 'el' ? 'Απαιτήσεις' : 'Requirements'}</label>
                            <Textarea className="rounded-xl min-h-[80px]" value={editModal.form.requirements} onChange={e => setEditModal(m => ({ ...m, form: { ...m.form, requirements: e.target.value } }))} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">{lang === 'el' ? 'Παροχές' : 'Benefits'}</label>
                            <Textarea className="rounded-xl min-h-[60px]" value={editModal.form.benefits} onChange={e => setEditModal(m => ({ ...m, form: { ...m.form, benefits: e.target.value } }))} />
                        </div>
                        <DialogFooter className="gap-2 pt-2">
                            <Button variant="outline" className="rounded-xl" onClick={() => setEditModal(null)}>{lang === 'el' ? 'Ακύρωση' : 'Cancel'}</Button>
                            <Button className="rounded-xl" disabled={editModal.saving} onClick={handleSaveEdit}>
                                {editModal.saving ? (lang === 'el' ? 'Αποθήκευση...' : 'Saving...') : (lang === 'el' ? 'Αποθήκευση' : 'Save')}
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>

        {/* Delete confirmation */}
        <Dialog open={!!deleteConfirm} onOpenChange={open => !open && setDeleteConfirm(null)}>
            <DialogContent className="rounded-2xl max-w-sm">
                <DialogHeader>
                    <DialogTitle className="font-display">{lang === 'el' ? 'Διαγραφή αγγελίας;' : 'Delete this job?'}</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground mt-1">
                    {lang === 'el'
                        ? 'Η αγγελία και όλες οι αιτήσεις θα διαγραφούν οριστικά. Αυτή η ενέργεια δεν αναιρείται.'
                        : 'The job and all its applications will be permanently deleted. This cannot be undone.'}
                </p>
                <DialogFooter className="gap-2 mt-4">
                    <Button variant="outline" className="rounded-xl" onClick={() => setDeleteConfirm(null)}>{lang === 'el' ? 'Ακύρωση' : 'Cancel'}</Button>
                    <Button variant="destructive" className="rounded-xl" onClick={handleDeleteJob}>{lang === 'el' ? 'Διαγραφή' : 'Delete'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Applicant profile modal */}
        <Dialog open={!!profileModal} onOpenChange={open => !open && setProfileModal(null)}>
            <DialogContent className="rounded-2xl max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-display">{lang === 'el' ? 'Προφίλ Υποψηφίου' : 'Applicant Profile'}</DialogTitle>
                </DialogHeader>
                {profileModal?.loading ? (
                    <div className="flex justify-center py-10">
                        <div className="w-7 h-7 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    </div>
                ) : profileModal?.data && (
                    <div className="space-y-4 mt-2">
                        <div className="flex items-center gap-4">
                            {profileModal.data.avatar_url ? (
                                <img src={profileModal.data.avatar_url} alt="" className="w-16 h-16 rounded-2xl object-cover" />
                            ) : (
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <User className="w-7 h-7 text-primary" />
                                </div>
                            )}
                            <div>
                                <p className="font-semibold text-foreground text-lg">{profileModal.data.full_name}</p>
                                <p className="text-sm text-muted-foreground">{profileModal.data.email}</p>
                            </div>
                        </div>
                        <div className="space-y-2.5">
                            {profileModal.data.location && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin className="w-4 h-4 flex-shrink-0" />
                                    <span>{profileModal.data.location}</span>
                                </div>
                            )}
                            {profileModal.data.experience_years > 0 && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Award className="w-4 h-4 flex-shrink-0" />
                                    <span>{profileModal.data.experience_years} {lang === 'el' ? 'χρόνια εμπειρία' : 'years experience'}</span>
                                </div>
                            )}
                            {profileModal.data.languages_spoken && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Languages className="w-4 h-4 flex-shrink-0" />
                                    <span>{profileModal.data.languages_spoken}</span>
                                </div>
                            )}
                            {profileModal.data.skills && (
                                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <Briefcase className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <span>{profileModal.data.skills}</span>
                                </div>
                            )}
                            {profileModal.data.bio && (
                                <div className="pt-2 border-t border-border/50">
                                    <p className="text-sm text-muted-foreground leading-relaxed">{profileModal.data.bio}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
        </>
    );
}
