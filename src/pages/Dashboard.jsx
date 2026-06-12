import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Briefcase, FileText, CheckCircle, XCircle, Clock, Plus, ExternalLink, ArrowLeft, Users, MessageCircle, AlertCircle, User, MapPin, Award, Languages, Star, LayoutDashboard, Pencil, Trash2, NotebookPen } from 'lucide-react';
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
import toast from 'react-hot-toast';

const STATUS_COLORS = {
    pending:   { badge: 'bg-yellow-100 text-yellow-800', icon: 'bg-yellow-50 text-yellow-600' },
    reviewed:  { badge: 'bg-blue-100 text-blue-800',     icon: 'bg-blue-50 text-blue-600' },
    accepted:  { badge: 'bg-green-100 text-green-800',   icon: 'bg-green-50 text-green-600' },
    rejected:  { badge: 'bg-red-100 text-red-800',       icon: 'bg-red-50 text-red-600' },
    withdrawn: { badge: 'bg-gray-100 text-gray-600',     icon: 'bg-gray-100 text-gray-500' },
    active:    { badge: 'bg-green-100 text-green-800',   icon: 'bg-green-50 text-green-600' },
    closed:    { badge: 'bg-gray-100 text-gray-600',     icon: 'bg-gray-100 text-gray-500' },
    draft:     { badge: 'bg-yellow-100 text-yellow-800', icon: 'bg-yellow-50 text-yellow-600' },
};
const statusColors = Object.fromEntries(Object.entries(STATUS_COLORS).map(([k, v]) => [k, v.badge]));


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
    const location = useLocation();
    const [applications, setApplications] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [favorites, setFavorites] = useState(new Set()); // set of applicant_emails
    const [loading, setLoading] = useState(true);
    const [selectedJobId, setSelectedJobId] = useState(null);
    const [statusFilter, setStatusFilter] = useState(null); // null | 'pending' | 'accepted' | 'active'
    const [profileModal, setProfileModal] = useState(null); // { loading, data }
    const [editModal, setEditModal] = useState(null); // { job, form, saving }
    const [deleteConfirm, setDeleteConfirm] = useState(null); // jobId

    // Feature: Sorting
    const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'most_apps'

    // Feature: Unread badge — seen application IDs from localStorage
    const [seenAppIds, setSeenAppIds] = useState(() => {
        try {
            const stored = localStorage.getItem('seen_app_ids');
            return stored ? new Set(JSON.parse(stored)) : new Set();
        } catch {
            return new Set();
        }
    });

    // Feature: Applicant notes — { email: note } from localStorage
    const [applicantNotes, setApplicantNotes] = useState(() => {
        try {
            const stored = localStorage.getItem('applicant_notes');
            return stored ? JSON.parse(stored) : {};
        } catch {
            return {};
        }
    });

    // Feature: Note textarea open state per app id
    const [openNoteIds, setOpenNoteIds] = useState(new Set());

    // Accept confirmation dialog
    const [acceptConfirm, setAcceptConfirm] = useState(null); // appId | null

    useEffect(() => {
        const expandJobId = location.state?.expandJobId;
        if (expandJobId) {
            setSelectedJobId(expandJobId);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state]);

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
    const draftJobs = jobs.filter(j => j.status === 'draft').length;

    const jobsWithPending = new Set(applications.filter(a => a.status === 'pending').map(a => a.job_id));

    const baseFilteredJobs = statusFilter === 'pending'
        ? jobs.filter(j => jobsWithPending.has(j.id))
        : statusFilter
            ? jobs.filter(j => j.status === statusFilter)
            : jobs;

    const selectedJob = jobs.find(j => j.id === selectedJobId) || null;
    const selectedJobApps = selectedJob ? applications.filter(a => a.job_id === selectedJob.id) : [];

    // Feature: Sorting — sort filteredJobs
    const filteredJobs = [...baseFilteredJobs].sort((a, b) => {
        if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
        if (sortBy === 'most_apps') {
            const aCount = applications.filter(ap => ap.job_id === a.id).length;
            const bCount = applications.filter(ap => ap.job_id === b.id).length;
            return bCount - aCount;
        }
        // default: newest first
        return new Date(b.created_at) - new Date(a.created_at);
    });

    const handleJobStatus = async (jobId, newStatus) => {
        await api.updateJob(jobId, { status: newStatus });
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
    };

    const handleAppStatus = async (appId, newStatus) => {
        await api.updateApplicationStatus(appId, newStatus);
        setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
    };

    const handleConfirmAccept = async () => {
        const appId = acceptConfirm;
        const app = applications.find(a => a.id === appId);
        setAcceptConfirm(null);
        if (!app) return;

        // Accept this applicant
        await api.updateApplicationStatus(appId, 'accepted');

        // Reject all others for the same job (skip already rejected/withdrawn/accepted)
        const others = applications.filter(a =>
            a.job_id === app.job_id &&
            a.id !== appId &&
            !['rejected', 'withdrawn', 'accepted'].includes(a.status)
        );
        await Promise.all(others.map(a => api.updateApplicationStatus(a.id, 'rejected')));

        // Close the job
        await api.updateJob(app.job_id, { status: 'closed' });

        setApplications(prev => prev.map(a => {
            if (a.id === appId) return { ...a, status: 'accepted' };
            if (others.find(o => o.id === a.id)) return { ...a, status: 'rejected' };
            return a;
        }));
        setJobs(prev => prev.map(j => j.id === app.job_id ? { ...j, status: 'closed' } : j));

        toast.success(
            lang === 'el'
                ? `Αποδοχή επιτυχής — ${others.length > 0 ? `${others.length} υποψήφιοι απορρίφθηκαν` : 'κανείς άλλος δεν ήταν σε αναμονή'} — η αγγελία έκλεισε.`
                : `Accepted — ${others.length > 0 ? `${others.length} other applicant(s) rejected` : 'no others were pending'} — job closed.`
        );
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
            title_el: job.title_el || '',
            listing_lang: job.listing_lang || 'en',
            location: job.location || '',
            description: job.description || '',
            description_el: job.description_el || '',
            requirements: job.requirements || '',
            requirements_el: job.requirements_el || '',
            employment_type: job.employment_type || '',
            salary_amount: job.salary_amount || '',
            salary_period: job.salary_period || 'monthly',
            positions_available: job.positions_available || 1,
            start_date: job.start_date || '',
            category: job.category || '',
            benefits: job.benefits || '',
            benefits_el: job.benefits_el || '',
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
        if (selectedJobId === deleteConfirm) setSelectedJobId(null);
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

    // Feature: Unread badge — mark apps as seen when job is selected
    const handleSelectJob = (jobId) => {
        setSelectedJobId(jobId);
        const jobAppIds = applications.filter(a => a.job_id === jobId).map(a => a.id);
        setSeenAppIds(prevSeen => {
            const nextSeen = new Set(prevSeen);
            jobAppIds.forEach(id => nextSeen.add(id));
            try { localStorage.setItem('seen_app_ids', JSON.stringify([...nextSeen])); } catch {}
            return nextSeen;
        });
    };

    // Feature: Applicant notes — save note on change
    const handleNoteChange = (email, value) => {
        setApplicantNotes(prev => {
            const next = { ...prev, [email]: value };
            try { localStorage.setItem('applicant_notes', JSON.stringify(next)); } catch {}
            return next;
        });
    };

    const handleToggleNote = (appId) => {
        setOpenNoteIds(prev => {
            const next = new Set(prev);
            next.has(appId) ? next.delete(appId) : next.add(appId);
            return next;
        });
    };


    // Feature: Empty state per filter — friendly messages
    const emptyStateMessage = () => {
        if (statusFilter === 'draft') return lang === 'el' ? 'Δεν υπάρχουν πρόχειρα' : 'No draft jobs';
        if (statusFilter === 'pending') return lang === 'el' ? 'Δεν υπάρχουν αγγελίες με αιτήσεις σε αναμονή' : 'No jobs with pending applications';
        if (statusFilter === 'active') return lang === 'el' ? 'Δεν υπάρχουν ενεργές αγγελίες' : 'No active jobs';
        if (statusFilter === 'closed') return lang === 'el' ? 'Δεν υπάρχουν κλειστές αγγελίες' : 'No closed jobs';
        return t('common_no_data');
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

                {!isHotel && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <StatCard icon={FileText} label={lang === 'el' ? 'Σύνολο Αιτήσεων' : 'Total Applications'} value={applications.length} color="bg-primary/10 text-primary" />
                        <StatCard icon={Clock} label={lang === 'el' ? 'Σε Αναμονή' : 'Pending'} value={pendingApps} color={STATUS_COLORS.pending.icon} />
                        <StatCard icon={CheckCircle} label={lang === 'el' ? 'Αποδεκτές' : 'Accepted'} value={acceptedApps} color={STATUS_COLORS.accepted.icon} />
                        <StatCard icon={XCircle} label={lang === 'el' ? 'Απορρίφθηκαν' : 'Rejected'} value={applications.filter(a => a.status === 'rejected').length} color={STATUS_COLORS.rejected.icon} />
                    </div>
                )}

                {isHotel && (
                    <div className="mb-8">
                        <h2 className="font-display text-xl font-bold text-foreground mb-4">{t('dash_my_jobs')}</h2>

                        {/* Filter pills + Sort dropdown */}
                        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                            <div className="flex gap-2 flex-wrap">
                                {[
                                    { key: null,       label: lang === 'el' ? 'Όλες' : 'All',      count: jobs.length },
                                    { key: 'active',   label: lang === 'el' ? 'Ενεργές' : 'Active',  count: activeJobs },
                                    { key: 'closed',   label: lang === 'el' ? 'Κλειστές' : 'Closed', count: jobs.filter(j => j.status === 'closed').length },
                                    { key: 'draft',    label: lang === 'el' ? 'Πρόχειρα' : 'Drafts', count: draftJobs },
                                    { key: 'pending',  label: lang === 'el' ? 'Σε αναμονή' : 'Pending', count: jobsWithPending.size },
                                ].map(({ key, label, count }) => (
                                    <button
                                        key={String(key)}
                                        onClick={() => setStatusFilter(key)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                            statusFilter === key
                                                ? 'bg-primary text-primary-foreground shadow-sm'
                                                : 'bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-border'
                                        }`}
                                    >
                                        {label}
                                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusFilter === key ? 'bg-white/20' : 'bg-muted'}`}>{count}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Feature: Sort dropdown */}
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                className="text-xs border border-border/50 rounded-xl px-3 py-1.5 bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                            >
                                <option value="newest">{lang === 'el' ? 'Νεότερες πρώτα' : 'Newest first'}</option>
                                <option value="oldest">{lang === 'el' ? 'Παλαιότερες πρώτα' : 'Oldest first'}</option>
                                <option value="most_apps">{lang === 'el' ? 'Περισσότερες αιτήσεις' : 'Most applications'}</option>
                            </select>
                        </div>

                        <div className="lg:grid lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-4 lg:items-start">
                            {/* Left: job list */}
                            <div className={`space-y-2 ${selectedJobId ? 'hidden lg:block' : ''}`}>
                                {filteredJobs.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">{emptyStateMessage()}</p>
                                ) : filteredJobs.map(job => {
                                    const jobApps = applications.filter(a => a.job_id === job.id);
                                    const pendingCount = jobApps.filter(a => a.status === 'pending').length;
                                    const isSelected = job.id === selectedJobId;
                                    return (
                                        <button key={job.id} onClick={() => handleSelectJob(job.id)}
                                            className={`w-full text-left p-3.5 rounded-xl border transition-all ${isSelected
                                                ? 'bg-primary/5 border-primary/40 shadow-sm'
                                                : 'bg-card border-border/50 hover:border-border hover:bg-accent/30'}`}>
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-medium text-sm text-foreground truncate">{job.title}</span>
                                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md flex-shrink-0 ${statusColors[job.status]}`}>
                                                    {{ active: lang === 'el' ? 'Ενεργή' : 'Active', closed: lang === 'el' ? 'Κλειστή' : 'Closed', draft: lang === 'el' ? 'Πρόχειρο' : 'Draft' }[job.status] ?? job.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                <span className="truncate">{job.location}</span>
                                                <span>·</span>
                                                <Users className="w-3 h-3 flex-shrink-0" />
                                                <span>{jobApps.length} {lang === 'el' ? 'αιτήσεις' : 'applications'}</span>
                                                {pendingCount > 0 && (
                                                    <span className={`${STATUS_COLORS.pending.badge} px-1.5 py-0.5 rounded-md font-medium flex-shrink-0`}>
                                                        {pendingCount} {lang === 'el' ? 'νέες' : 'new'}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-1 text-[11px] text-muted-foreground/70">
                                                {lang === 'el' ? 'Δημοσιεύτηκε' : 'Posted'} {moment(job.created_at).fromNow()}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Right: selected job applications */}
                            <div className={`${selectedJob ? '' : 'hidden lg:block'} mt-4 lg:mt-0`}>
                                {!selectedJob ? (
                                    filteredJobs.length > 0 && (
                                        <div className="border border-dashed border-border rounded-xl py-24 text-center text-sm text-muted-foreground">
                                            {lang === 'el' ? 'Επίλεξε μια αγγελία για να δεις τις αιτήσεις της' : 'Select a job to view its applications'}
                                        </div>
                                    )
                                ) : (
                                    <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
                                        <div className="p-4 border-b border-border/50">
                                            <button onClick={() => setSelectedJobId(null)}
                                                className="lg:hidden flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2 transition-colors">
                                                <ArrowLeft className="w-3.5 h-3.5" />{lang === 'el' ? 'Πίσω στις αγγελίες' : 'Back to jobs'}
                                            </button>
                                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                                <div className="min-w-0">
                                                    <Link to={`/jobs/${selectedJob.id}`} target="_blank" rel="noopener noreferrer"
                                                        className="font-semibold text-foreground hover:text-primary hover:underline inline-flex items-center gap-1.5">
                                                        {selectedJob.title}
                                                        <ExternalLink className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />
                                                    </Link>
                                                    <p className="text-xs text-muted-foreground mt-0.5">{selectedJob.location} · {moment(selectedJob.created_at).fromNow()}</p>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <Select value={selectedJob.status} onValueChange={val => handleJobStatus(selectedJob.id, val)}>
                                                        <SelectTrigger className={`h-7 text-xs font-medium rounded-xl border-0 px-2.5 w-auto gap-1.5 ${statusColors[selectedJob.status]}`}>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl">
                                                            <SelectItem value="active" className="rounded-lg text-xs">{lang === 'el' ? 'Ενεργή' : 'Active'}</SelectItem>
                                                            <SelectItem value="closed" className="rounded-lg text-xs">{lang === 'el' ? 'Κλειστή' : 'Closed'}</SelectItem>
                                                            <SelectItem value="draft" className="rounded-lg text-xs">{lang === 'el' ? 'Πρόχειρο' : 'Draft'}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <button
                                                        onClick={() => handleOpenEdit(selectedJob)}
                                                        className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                                                        title={lang === 'el' ? 'Επεξεργασία' : 'Edit'}
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirm(selectedJob.id)}
                                                        className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                                                        title={lang === 'el' ? 'Διαγραφή' : 'Delete'}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                            <div className="divide-y divide-border/30">
                                                {selectedJobApps.length === 0 ? (
                                                    <p className="text-sm text-muted-foreground text-center py-6">
                                                        {lang === 'el' ? 'Δεν υπάρχουν αιτήσεις ακόμα' : 'No applications yet'}
                                                    </p>
                                                ) : selectedJobApps.map(app => {
                                                    const isUnseen = !seenAppIds.has(app.id);
                                                    const isNoteOpen = openNoteIds.has(app.id);
                                                    const noteValue = applicantNotes[app.applicant_email] || '';
                                                    return (
                                                        <div key={app.id} className="p-4">
                                                            <div className="flex items-start justify-between gap-4">
                                                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-1.5">
                                                                            {/* Feature: Unread NEW badge */}
                                                                            {isUnseen && (
                                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700 leading-none">
                                                                                    NEW
                                                                                </span>
                                                                            )}
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
                                                                            {/* Feature: Note icon button */}
                                                                            <button
                                                                                onClick={() => handleToggleNote(app.id)}
                                                                                className={`flex-shrink-0 transition-colors p-0.5 rounded ${isNoteOpen || noteValue ? 'text-amber-500 hover:text-amber-600' : 'text-muted-foreground/40 hover:text-amber-500'}`}
                                                                                title={lang === 'el' ? 'Σημειώσεις' : 'Notes'}
                                                                            >
                                                                                <NotebookPen className="w-3.5 h-3.5" />
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
                                                                        {/* Feature: Applicant notes textarea */}
                                                                        {isNoteOpen && (
                                                                            <div className="mt-2">
                                                                                <Textarea
                                                                                    className="rounded-xl text-xs min-h-[64px] resize-none border-amber-200 focus:border-amber-400"
                                                                                    placeholder={lang === 'el' ? 'Ιδιωτικές σημειώσεις για αυτόν τον υποψήφιο…' : 'Private notes about this applicant…'}
                                                                                    value={noteValue}
                                                                                    onChange={e => handleNoteChange(app.applicant_email, e.target.value)}
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                                    <Select value={app.status} onValueChange={val => val === 'accepted' ? setAcceptConfirm(app.id) : handleAppStatus(app.id, val)}>
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
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                    </div>
                                )}
                            </div>
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
                                <label className="text-sm font-medium text-foreground mb-1.5 block">{lang === 'el' ? 'Μισθός (€)' : 'Salary (€)'}</label>
                                <div className="flex gap-2">
                                    <Input type="number" min="0" className="rounded-xl" value={editModal.form.salary_amount} onChange={e => setEditModal(m => ({ ...m, form: { ...m.form, salary_amount: e.target.value } }))} />
                                    <Select value={editModal.form.salary_period} onValueChange={v => setEditModal(m => ({ ...m, form: { ...m.form, salary_period: v } }))}>
                                        <SelectTrigger className="rounded-xl w-28 flex-shrink-0"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="hourly">{lang === 'el' ? '/ώρα' : '/hour'}</SelectItem>
                                            <SelectItem value="daily">{lang === 'el' ? '/ημέρα' : '/day'}</SelectItem>
                                            <SelectItem value="monthly">{lang === 'el' ? '/μήνα' : '/month'}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
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
                        {/* Description */}
                        <div className={`grid gap-3 ${editModal.form.listing_lang === 'both' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            {(editModal.form.listing_lang === 'en' || editModal.form.listing_lang === 'both') && (
                                <div>
                                    <label className="text-sm font-medium text-foreground mb-1.5 block">{editModal.form.listing_lang === 'both' ? 'EN Description' : (lang === 'el' ? 'Περιγραφή' : 'Description')}</label>
                                    <Textarea className="rounded-xl min-h-[100px]" value={editModal.form.description} onChange={e => setEditModal(m => ({ ...m, form: { ...m.form, description: e.target.value } }))} />
                                </div>
                            )}
                            {(editModal.form.listing_lang === 'el' || editModal.form.listing_lang === 'both') && (
                                <div>
                                    <label className="text-sm font-medium text-foreground mb-1.5 block">{editModal.form.listing_lang === 'both' ? 'EL Περιγραφή' : 'Περιγραφή'}</label>
                                    <Textarea className="rounded-xl min-h-[100px]" value={editModal.form.description_el} onChange={e => setEditModal(m => ({ ...m, form: { ...m.form, description_el: e.target.value } }))} />
                                </div>
                            )}
                        </div>
                        {/* Requirements */}
                        <div className={`grid gap-3 ${editModal.form.listing_lang === 'both' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            {(editModal.form.listing_lang === 'en' || editModal.form.listing_lang === 'both') && (
                                <div>
                                    <label className="text-sm font-medium text-foreground mb-1.5 block">{editModal.form.listing_lang === 'both' ? 'EN Requirements' : (lang === 'el' ? 'Απαιτήσεις' : 'Requirements')}</label>
                                    <Textarea className="rounded-xl min-h-[80px]" value={editModal.form.requirements} onChange={e => setEditModal(m => ({ ...m, form: { ...m.form, requirements: e.target.value } }))} />
                                </div>
                            )}
                            {(editModal.form.listing_lang === 'el' || editModal.form.listing_lang === 'both') && (
                                <div>
                                    <label className="text-sm font-medium text-foreground mb-1.5 block">{editModal.form.listing_lang === 'both' ? 'EL Απαιτήσεις' : 'Απαιτήσεις'}</label>
                                    <Textarea className="rounded-xl min-h-[80px]" value={editModal.form.requirements_el} onChange={e => setEditModal(m => ({ ...m, form: { ...m.form, requirements_el: e.target.value } }))} />
                                </div>
                            )}
                        </div>
                        {/* Benefits */}
                        <div className={`grid gap-3 ${editModal.form.listing_lang === 'both' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            {(editModal.form.listing_lang === 'en' || editModal.form.listing_lang === 'both') && (
                                <div>
                                    <label className="text-sm font-medium text-foreground mb-1.5 block">{editModal.form.listing_lang === 'both' ? 'EN Benefits' : (lang === 'el' ? 'Παροχές' : 'Benefits')}</label>
                                    <Textarea className="rounded-xl min-h-[60px]" value={editModal.form.benefits} onChange={e => setEditModal(m => ({ ...m, form: { ...m.form, benefits: e.target.value } }))} />
                                </div>
                            )}
                            {(editModal.form.listing_lang === 'el' || editModal.form.listing_lang === 'both') && (
                                <div>
                                    <label className="text-sm font-medium text-foreground mb-1.5 block">{editModal.form.listing_lang === 'both' ? 'EL Παροχές' : 'Παροχές'}</label>
                                    <Textarea className="rounded-xl min-h-[60px]" value={editModal.form.benefits_el} onChange={e => setEditModal(m => ({ ...m, form: { ...m.form, benefits_el: e.target.value } }))} />
                                </div>
                            )}
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

        {/* Accept confirmation dialog */}
        <Dialog open={!!acceptConfirm} onOpenChange={open => !open && setAcceptConfirm(null)}>
            <DialogContent className="rounded-2xl max-w-sm">
                <DialogHeader>
                    <DialogTitle className="font-display">{lang === 'el' ? 'Αποδοχή υποψηφίου;' : 'Accept applicant?'}</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground mt-1">
                    {lang === 'el'
                        ? 'Αλλάζοντας την κατάσταση σε "Αποδεκτή", οι υπόλοιποι υποψήφιοι αυτής της αγγελίας απορρίπτονται αυτόματα και η αγγελία κλείνει.'
                        : 'Changing the status to "Accepted" will automatically reject all other applicants for this job and close the listing.'}
                </p>
                <DialogFooter className="gap-2 mt-4">
                    <Button variant="outline" className="rounded-xl" onClick={() => setAcceptConfirm(null)}>
                        {lang === 'el' ? 'Ακύρωση' : 'Cancel'}
                    </Button>
                    <Button className="rounded-xl" onClick={handleConfirmAccept}>
                        {lang === 'el' ? 'Αποδοχή' : 'Accept'}
                    </Button>
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
