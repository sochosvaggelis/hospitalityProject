import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import useLanguage from '@/lib/useLanguage';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import GuestView from '@/lib/GuestView';

export default function PostJob() {
    const navigate = useNavigate();
    const { t, lang } = useLanguage();
    const { isAuthenticated, isLoading, me } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [categories, setCategories] = useState([]);
    const [empTypes, setEmpTypes] = useState([]);
    const [catMap, setCatMap] = useState({});
    const [empMap, setEmpMap] = useState({});
    const [islands, setIslands] = useState([]);
    const [form, setForm] = useState({
        title: '', title_el: '', listing_lang: 'en', location: '', description: '', requirements: '',
        employment_type: '', salary_amount: '', salary_period: 'monthly', positions_available: 1,
        start_date: '', category: '', benefits: '', status: 'active',
    });

    useEffect(() => {
        if (isLoading) return;
        if (isAuthenticated && me && me.role !== 'hotel') navigate('/dashboard');
    }, [isLoading, isAuthenticated, me, navigate]);

    useEffect(() => {
        const loadRefs = async () => {
            const [cats, emps, isls] = await Promise.all([
                api.categories(),
                api.employmentTypes(),
                api.islands(),
            ]);
            const catKeys = cats?.map(c => c.key) || [];
            const empKeys = emps?.map(e => e.key) || [];
            setCategories(catKeys);
            setEmpTypes(empKeys);
            setIslands(isls?.map(i => i.name) || []);
            setCatMap(Object.fromEntries((cats || []).map(c => [c.key, { en: c.label_en, el: c.label_el }])));
            setEmpMap(Object.fromEntries((emps || []).map(e => [e.key, { en: e.label_en, el: e.label_el }])));
            setForm(f => ({
                ...f,
                category: f.category || catKeys[0] || '',
                employment_type: f.employment_type || empKeys[0] || '',
            }));
        };
        loadRefs();
    }, []);

    const handleSubmit = async () => {
        if (!form.title || !form.location || !form.description) {
            toast.error(lang === 'el' ? 'Συμπληρώστε τα απαιτούμενα πεδία' : 'Please fill in required fields');
            return;
        }
        setSubmitting(true);
        try {
            await api.createJob(form);
        } catch (e) {
            toast.error(e.message);
            setSubmitting(false);
            return;
        }
        setSubmitting(false);
        toast.success(lang === 'el' ? 'Η θέση δημοσιεύτηκε!' : 'Job posted successfully!');
        navigate('/dashboard');
    };

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    if (!isAuthenticated && !isLoading) return <GuestView icon={Briefcase} titleEl="Δημοσίευση Αγγελίας" titleEn="Post a Job" descEl="Συνδεθείτε ως ξενοδοχείο για να δημοσιεύσετε νέες θέσεις εργασίας." descEn="Sign in as a hotel to post new job listings." />;

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Briefcase className="w-5 h-5 text-primary" /></div>
                <h1 className="font-display text-3xl font-bold text-foreground">{t('nav_post_job')}</h1>
            </div>

            <div className="bg-card rounded-2xl border border-border/50 p-6 space-y-5">
                <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">{lang === 'el' ? 'Γλώσσα Αγγελίας *' : 'Listing Language *'}</label>
                    <Select value={form.listing_lang} onValueChange={v => set('listing_lang', v)}>
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="en">English only</SelectItem>
                            <SelectItem value="el">Ελληνικά only</SelectItem>
                            <SelectItem value="both">English + Ελληνικά</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(form.listing_lang === 'en' || form.listing_lang === 'both') && (
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">Job Title (EN) *</label>
                            <Input className="rounded-xl" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Waiter/Waitress" />
                        </div>
                    )}
                    {(form.listing_lang === 'el' || form.listing_lang === 'both') && (
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">Τίτλος Θέσης (EL) *</label>
                            <Input className="rounded-xl" value={form.title_el} onChange={e => set('title_el', e.target.value)} placeholder="π.χ. Σερβιτόρος/α" />
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">{lang === 'el' ? 'Τοποθεσία *' : 'Location *'}</label>
                        <Select value={form.location} onValueChange={v => set('location', v)}>
                            <SelectTrigger className="rounded-xl"><SelectValue placeholder={lang === 'el' ? 'Επίλεξε νησί' : 'Select island'} /></SelectTrigger>
                            <SelectContent>{islands.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">{lang === 'el' ? 'Μισθός (€)' : 'Salary (€)'}</label>
                        <div className="flex gap-2">
                            <Input
                                type="number" min="0" className="rounded-xl"
                                value={form.salary_amount}
                                onChange={e => set('salary_amount', e.target.value)}
                                placeholder={lang === 'el' ? 'π.χ. 50' : 'e.g. 50'}
                            />
                            <Select value={form.salary_period} onValueChange={v => set('salary_period', v)}>
                                <SelectTrigger className="rounded-xl w-36"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="hourly">{lang === 'el' ? '/ώρα' : '/hour'}</SelectItem>
                                    <SelectItem value="daily">{lang === 'el' ? '/ημέρα' : '/day'}</SelectItem>
                                    <SelectItem value="monthly">{lang === 'el' ? '/μήνα' : '/month'}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">{lang === 'el' ? 'Κατηγορία' : 'Category'}</label>
                        <Select value={form.category} onValueChange={v => set('category', v)}>
                            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{catMap[c]?.[lang] ?? catMap[c]?.en ?? c}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">{lang === 'el' ? 'Τύπος' : 'Type'}</label>
                        <Select value={form.employment_type} onValueChange={v => set('employment_type', v)}>
                            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent>{empTypes.map(e => <SelectItem key={e} value={e}>{empMap[e]?.[lang] ?? empMap[e]?.en ?? e}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">{lang === 'el' ? 'Θέσεις' : 'Positions'}</label>
                        <Input type="number" className="rounded-xl" value={form.positions_available} onChange={e => set('positions_available', Number(e.target.value))} />
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">{lang === 'el' ? 'Ημ/νία Έναρξης' : 'Start Date'}</label>
                    <Input className="rounded-xl" value={form.start_date} onChange={e => set('start_date', e.target.value)} placeholder={lang === 'el' ? 'π.χ. Ιούνιος 2026' : 'e.g. June 2026'} />
                </div>

                <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">{lang === 'el' ? 'Περιγραφή Θέσης *' : 'Job Description *'}</label>
                    <Textarea className="rounded-xl min-h-[120px]" value={form.description} onChange={e => set('description', e.target.value)} />
                </div>

                <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">{lang === 'el' ? 'Απαιτήσεις' : 'Requirements'}</label>
                    <Textarea className="rounded-xl min-h-[80px]" value={form.requirements} onChange={e => set('requirements', e.target.value)} />
                </div>

                <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">{lang === 'el' ? 'Παροχές' : 'Benefits'}</label>
                    <Textarea className="rounded-xl min-h-[80px]" value={form.benefits} onChange={e => set('benefits', e.target.value)} placeholder={lang === 'el' ? 'π.χ. Διαμονή, Γεύματα' : 'e.g. Accommodation, Meals'} />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                    <Button variant="outline" onClick={() => navigate(-1)} className="rounded-xl">{t('common_cancel')}</Button>
                    <Button onClick={handleSubmit} disabled={submitting} className="rounded-xl px-6">
                        {submitting ? t('common_loading') : (lang === 'el' ? 'Δημοσίευση' : 'Post Job')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
