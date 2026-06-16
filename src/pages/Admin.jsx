import { useState, useEffect } from 'react';
import { Users, Briefcase, FileText, Trash2, Shield, Building2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import useLanguage from '@/lib/useLanguage';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import GuestView from '@/lib/GuestView';
import moment from 'moment';

export default function Admin() {
    const { lang } = useLanguage();
    const { me, isLoading: authLoading } = useAuth();
    const [users, setUsers] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!me) return;
        if (me.role !== 'admin') { setLoading(false); return; }
        const load = async () => {
            const [u, j, a] = await Promise.all([
                api.adminUsers(),
                api.adminJobs(),
                api.adminApplications(),
            ]);
            setUsers(u || []);
            setJobs(j || []);
            setApplications(a || []);
            setLoading(false);
        };
        load();
    }, [me]);

    const updateUserRole = async (userId, newRole) => {
        try {
            await api.adminSetRole(userId, newRole);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
            toast.success(lang === 'el' ? 'Ο ρόλος ενημερώθηκε' : 'Role updated');
        } catch (e) { toast.error(e.message); }
    };

    const deleteJob = async (jobId) => {
        await api.adminDeleteJob(jobId);
        setJobs(prev => prev.filter(j => j.id !== jobId));
        toast.success(lang === 'el' ? 'Η θέση διαγράφηκε' : 'Job deleted');
    };

    if (authLoading || loading) return <div className="flex justify-center py-32"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

    if (!me) return <GuestView icon={Shield} titleEl="Admin Panel" titleEn="Admin Panel" descEl="Συνδεθείτε ως διαχειριστής για πρόσβαση." descEn="Sign in as admin to access this panel." />;
    if (me.role !== 'admin') {
        return <div className="flex justify-center items-center py-32"><p className="text-muted-foreground">{lang === 'el' ? 'Δεν έχεις πρόσβαση.' : 'Access denied.'}</p></div>;
    }

    const roleIcon = { admin: Shield, hotel: Building2, user: User };

    return (
        <div style={{ background: '#eef4fd', minHeight: '100vh' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <h1 className="font-display text-3xl font-bold text-foreground mb-8">{lang === 'el' ? 'Διαχείριση' : 'Admin'}</h1>

                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[{ icon: Users, val: users.length, label: lang === 'el' ? 'Χρήστες' : 'Users', color: 'bg-primary/10 text-primary' },
                      { icon: Briefcase, val: jobs.length, label: lang === 'el' ? 'Θέσεις' : 'Jobs', color: 'bg-blue-50 text-blue-600' },
                      { icon: FileText, val: applications.length, label: lang === 'el' ? 'Αιτήσεις' : 'Applications', color: 'bg-green-50 text-green-600' }
                    ].map(({ icon: Icon, val, label, color }) => (
                        <div key={label} className="bg-card rounded-2xl border border-border/50 p-5 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}><Icon className="w-5 h-5" /></div>
                            <div><p className="text-2xl font-bold text-foreground">{val}</p><p className="text-xs text-muted-foreground">{label}</p></div>
                        </div>
                    ))}
                </div>

                <Tabs defaultValue="users">
                    <TabsList className="rounded-xl mb-6">
                        <TabsTrigger value="users" className="rounded-lg gap-2"><Users className="w-4 h-4" />{lang === 'el' ? 'Χρήστες' : 'Users'}</TabsTrigger>
                        <TabsTrigger value="jobs" className="rounded-lg gap-2"><Briefcase className="w-4 h-4" />{lang === 'el' ? 'Θέσεις' : 'Jobs'}</TabsTrigger>
                        <TabsTrigger value="applications" className="rounded-lg gap-2"><FileText className="w-4 h-4" />{lang === 'el' ? 'Αιτήσεις' : 'Applications'}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="users">
                        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border/50">
                                            {[lang === 'el' ? 'Όνομα' : 'Name', 'Email', lang === 'el' ? 'Ρόλος' : 'Role', lang === 'el' ? 'Ημ/νία' : 'Date'].map(h => (
                                                <th key={h} className="text-left p-4 font-medium text-muted-foreground">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => (
                                            <tr key={u.id} className="border-b border-border/30 last:border-0">
                                                <td className="p-4 font-medium text-foreground">{u.full_name}</td>
                                                <td className="p-4 text-muted-foreground">{u.email}</td>
                                                <td className="p-4">
                                                    <Select value={u.role || 'user'} onValueChange={v => updateUserRole(u.id, v)}>
                                                        <SelectTrigger className="h-8 w-28 rounded-lg text-xs"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="user">User</SelectItem>
                                                            <SelectItem value="hotel">Business</SelectItem>
                                                            <SelectItem value="admin">Admin</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </td>
                                                <td className="p-4 text-xs text-muted-foreground">{moment(u.created_at).format('DD/MM/YYYY')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="jobs">
                        <div className="space-y-3">
                            {jobs.map(job => (
                                <div key={job.id} className="bg-card rounded-xl border border-border/50 p-4 flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-foreground">{job.title}</p>
                                        <p className="text-sm text-muted-foreground">{job.hotel_name} · {job.location}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{moment(job.created_at).format('DD/MM/YYYY')}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="rounded-lg capitalize">{job.status}</Badge>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteJob(job.id)}><Trash2 className="w-4 h-4" /></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="applications">
                        <div className="space-y-3">
                            {applications.map(app => (
                                <div key={app.id} className="bg-card rounded-xl border border-border/50 p-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="font-medium text-foreground">{app.applicant_name}</p>
                                            <p className="text-sm text-muted-foreground">{app.job_title} · {app.hotel_name}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{moment(app.created_at).format('DD/MM/YYYY')}</p>
                                        </div>
                                        <Badge variant="outline" className="rounded-lg capitalize">{app.status}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
