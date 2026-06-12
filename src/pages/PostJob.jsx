import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, ImagePlus, X, Languages, MapPin, FileText, Euro } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import useLanguage from '@/lib/useLanguage';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import GuestView from '@/lib/GuestView';

function Section({ icon: Icon, title, subtitle, children }) {
    return (
        <div className="bg-card rounded-2xl border border-border/50 p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                    <h2 className="font-display font-semibold text-foreground leading-tight">{title}</h2>
                    {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
                </div>
            </div>
            <div className="space-y-4">{children}</div>
        </div>
    );
}

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
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const photoInputRef = useRef(null);
    const [form, setForm] = useState({
        title: '', title_el: '', listing_lang: 'en', location: '',
        description: '', description_el: '',
        requirements: '', requirements_el: '',
        benefits: '', benefits_el: '',
        employment_type: '', salary_amount: '', salary_period: 'monthly', positions_available: 1,
        start_date: '', category: '', status: 'active',
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

    const handleSubmit = async (status = 'active') => {
        const isDraft = status === 'draft';
        if (!form.title && !form.title_el) {
            toast.error(lang === 'el' ? 'Συμπληρώστε τουλάχιστον τον τίτλο' : 'Please fill in at least the title');
            return;
        }
        if (!isDraft && (!form.location || (!form.description && !form.description_el))) {
            toast.error(lang === 'el' ? 'Συμπληρώστε τα απαιτούμενα πεδία' : 'Please fill in required fields');
            return;
        }
        setSubmitting(true);
        try {
            let photo_url = null;
            if (photoFile) {
                const uploaded = await api.uploadJobPhoto(photoFile);
                photo_url = uploaded.url;
            }
            await api.createJob({ ...form, status, photo_url });
        } catch (e) {
            toast.error(e.message);
            setSubmitting(false);
            return;
        }
        setSubmitting(false);
        toast.success(isDraft
            ? (lang === 'el' ? 'Αποθηκεύτηκε ως πρόχειρο — θα τη βρεις στο Dashboard' : 'Saved as draft — find it in your Dashboard')
            : (lang === 'el' ? 'Η θέση δημοσιεύτηκε!' : 'Job posted successfully!'));
        navigate('/dashboard');
    };

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handlePhotoSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error(lang === 'el' ? 'Μόνο αρχεία εικόνας' : 'Only image files are allowed');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error(lang === 'el' ? 'Μέγιστο μέγεθος 5MB' : 'Maximum size is 5MB');
            return;
        }
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const removePhoto = () => {
        if (photoPreview) URL.revokeObjectURL(photoPreview);
        setPhotoFile(null);
        setPhotoPreview(null);
        if (photoInputRef.current) photoInputRef.current.value = '';
    };

    const showEn = form.listing_lang === 'en' || form.listing_lang === 'both';
    const showEl = form.listing_lang === 'el' || form.listing_lang === 'both';
    const biGrid = `grid gap-4 ${form.listing_lang === 'both' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`;

    if (!isAuthenticated && !isLoading) return <GuestView icon={Briefcase} titleEl="Δημοσίευση Αγγελίας" titleEn="Post a Job" descEl="Συνδεθείτε ως ξενοδοχείο για να δημοσιεύσετε νέες θέσεις εργασίας." descEn="Sign in as a hotel to post new job listings." />;

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
            <div className="mb-8">
                <h1 className="font-display text-3xl font-bold text-foreground">{t('nav_post_job')}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {lang === 'el'
                        ? 'Συμπλήρωσε τα στοιχεία της θέσης — όσο πιο πλήρης η αγγελία, τόσο περισσότερες αιτήσεις.'
                        : 'Fill in the position details — the more complete the listing, the more applications you get.'}
                </p>
            </div>

            <div className="space-y-5">
                {/* 1. Language & Title */}
                <Section icon={Languages}
                    title={lang === 'el' ? 'Γλώσσα & Τίτλος' : 'Language & Title'}
                    subtitle={lang === 'el' ? 'Σε ποια γλώσσα απευθύνεται η αγγελία' : 'Which language the listing targets'}>
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
                        {showEn && (
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1.5 block">Job Title (EN) *</label>
                                <Input className="rounded-xl" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Waiter/Waitress" />
                            </div>
                        )}
                        {showEl && (
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1.5 block">Τίτλος Θέσης (EL) *</label>
                                <Input className="rounded-xl" value={form.title_el} onChange={e => set('title_el', e.target.value)} placeholder="π.χ. Σερβιτόρος/α" />
                            </div>
                        )}
                    </div>
                </Section>

                {/* 2. Position details */}
                <Section icon={MapPin}
                    title={lang === 'el' ? 'Λεπτομέρειες Θέσης' : 'Position Details'}
                    subtitle={lang === 'el' ? 'Πού, τι και πότε' : 'Where, what and when'}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">{lang === 'el' ? 'Τοποθεσία *' : 'Location *'}</label>
                            <Select value={form.location} onValueChange={v => set('location', v)}>
                                <SelectTrigger className="rounded-xl"><SelectValue placeholder={lang === 'el' ? 'Επίλεξε νησί' : 'Select island'} /></SelectTrigger>
                                <SelectContent>{islands.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">{lang === 'el' ? 'Κατηγορία' : 'Category'}</label>
                            <Select value={form.category} onValueChange={v => set('category', v)}>
                                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                                <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{catMap[c]?.[lang] ?? catMap[c]?.en ?? c}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">{lang === 'el' ? 'Τύπος' : 'Type'}</label>
                            <Select value={form.employment_type} onValueChange={v => set('employment_type', v)}>
                                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                                <SelectContent>{empTypes.map(e => <SelectItem key={e} value={e}>{empMap[e]?.[lang] ?? empMap[e]?.en ?? e}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">{lang === 'el' ? 'Θέσεις' : 'Positions'}</label>
                            <Input type="number" min="1" className="rounded-xl" value={form.positions_available} onChange={e => set('positions_available', Number(e.target.value))} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">{lang === 'el' ? 'Ημ/νία Έναρξης' : 'Start Date'}</label>
                            <Input className="rounded-xl" value={form.start_date} onChange={e => set('start_date', e.target.value)} placeholder={lang === 'el' ? 'π.χ. Ιούνιος 2026' : 'e.g. June 2026'} />
                        </div>
                    </div>
                </Section>

                {/* 3. Salary */}
                <Section icon={Euro}
                    title={lang === 'el' ? 'Αμοιβή' : 'Salary'}
                    subtitle={lang === 'el' ? 'Προαιρετικό, αλλά οι αγγελίες με μισθό ξεχωρίζουν' : 'Optional, but listings with salary stand out'}>
                    <div className="flex gap-2 max-w-sm">
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
                </Section>

                {/* 4. Photo */}
                <Section icon={ImagePlus}
                    title={lang === 'el' ? 'Φωτογραφία' : 'Photo'}
                    subtitle={lang === 'el' ? 'Εμφανίζεται στην κάρτα της αγγελίας — π.χ. το μαγαζί ή η θέα' : 'Shown on the job card — e.g. your venue or the view'}>
                    <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
                    {photoPreview ? (
                        <div className="relative rounded-xl overflow-hidden border border-border/50">
                            <img src={photoPreview} alt="" className="w-full h-44 object-cover" />
                            <button type="button" onClick={removePhoto}
                                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <button type="button" onClick={() => photoInputRef.current?.click()}
                            className="w-full h-28 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
                            <ImagePlus className="w-6 h-6" />
                            <span className="text-sm">{lang === 'el' ? 'Πρόσθεσε φωτογραφία (έως 5MB)' : 'Add a photo (up to 5MB)'}</span>
                        </button>
                    )}
                </Section>

                {/* 5. Description */}
                <Section icon={FileText}
                    title={lang === 'el' ? 'Περιγραφή & Απαιτήσεις' : 'Description & Requirements'}
                    subtitle={lang === 'el' ? 'Τι περιλαμβάνει η θέση και τι προσφέρεις' : 'What the role involves and what you offer'}>
                    <div className={biGrid}>
                        {showEn && (
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1.5 block">
                                    {form.listing_lang === 'both' ? 'EN Job Description *' : 'Job Description *'}
                                </label>
                                <Textarea className="rounded-xl min-h-[120px]" value={form.description} onChange={e => set('description', e.target.value)} />
                            </div>
                        )}
                        {showEl && (
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1.5 block">
                                    {form.listing_lang === 'both' ? 'EL Περιγραφή Θέσης *' : 'Περιγραφή Θέσης *'}
                                </label>
                                <Textarea className="rounded-xl min-h-[120px]" value={form.description_el} onChange={e => set('description_el', e.target.value)} />
                            </div>
                        )}
                    </div>
                    <div className={biGrid}>
                        {showEn && (
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1.5 block">
                                    {form.listing_lang === 'both' ? 'EN Requirements' : 'Requirements'}
                                </label>
                                <Textarea className="rounded-xl min-h-[80px]" value={form.requirements} onChange={e => set('requirements', e.target.value)} />
                            </div>
                        )}
                        {showEl && (
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1.5 block">
                                    {form.listing_lang === 'both' ? 'EL Απαιτήσεις' : 'Απαιτήσεις'}
                                </label>
                                <Textarea className="rounded-xl min-h-[80px]" value={form.requirements_el} onChange={e => set('requirements_el', e.target.value)} />
                            </div>
                        )}
                    </div>
                    <div className={biGrid}>
                        {showEn && (
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1.5 block">
                                    {form.listing_lang === 'both' ? 'EN Benefits' : 'Benefits'}
                                </label>
                                <Textarea className="rounded-xl min-h-[80px]" value={form.benefits} onChange={e => set('benefits', e.target.value)} placeholder="e.g. Accommodation, Meals" />
                            </div>
                        )}
                        {showEl && (
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1.5 block">
                                    {form.listing_lang === 'both' ? 'EL Παροχές' : 'Παροχές'}
                                </label>
                                <Textarea className="rounded-xl min-h-[80px]" value={form.benefits_el} onChange={e => set('benefits_el', e.target.value)} placeholder="π.χ. Διαμονή, Γεύματα" />
                            </div>
                        )}
                    </div>
                </Section>

                <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                    <Button variant="ghost" onClick={() => navigate(-1)} className="rounded-xl">{t('common_cancel')}</Button>
                    <Button variant="outline" onClick={() => handleSubmit('draft')} disabled={submitting} className="rounded-xl">
                        {lang === 'el' ? 'Αποθήκευση ως πρόχειρο' : 'Save as draft'}
                    </Button>
                    <Button onClick={() => handleSubmit('active')} disabled={submitting} className="rounded-xl px-8">
                        {submitting ? t('common_loading') : (lang === 'el' ? 'Δημοσίευση' : 'Post Job')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
