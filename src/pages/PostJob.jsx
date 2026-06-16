import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Briefcase, ImagePlus, Languages, MapPin, FileText, Euro } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import useLanguage from '@/lib/useLanguage';
import { api } from '@/lib/api';
import { useIslands, useCategories, useEmploymentTypes, useMyVenues } from '@/lib/queries';
import { MONTH_OPTIONS, monthName } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import GuestView from '@/lib/GuestView';
import JobPreviewCard from '@/components/JobPreviewCard';
import JobPhotoField from '@/components/JobPhotoField';
import VenueField from '@/components/VenueField';
import ChecklistField from '@/components/ChecklistField';
import RequiredMark, { RequiredNote } from '@/components/RequiredMark';
import { BENEFIT_OPTIONS, REQUIREMENT_OPTIONS } from '@/lib/jobOptions';

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
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [previewLang, setPreviewLang] = useState('en');
    const [form, setForm] = useState({
        title: '', title_el: '', listing_lang: 'en', venue_id: '', location: '',
        description: '', description_el: '',
        requirements: '', requirements_el: '',
        benefits: '', benefits_el: '',
        employment_type: '', salary_amount: '', salary_period: 'monthly', salary_negotiable: false, positions_available: 1,
        start_date: '', end_date: '', category: '', status: 'active', photo_position: '50% 50%',
    });

    useEffect(() => {
        if (isLoading) return;
        if (isAuthenticated && me && me.role !== 'hotel') navigate('/dashboard');
    }, [isLoading, isAuthenticated, me, navigate]);

    const { data: catsData } = useCategories();
    const { data: empsData } = useEmploymentTypes();
    const { data: islandsData } = useIslands();
    const { data: venues = [] } = useMyVenues();

    const selectedVenue = venues.find(v => v.id === form.venue_id);
    const venueType = selectedVenue?.type || '';

    // Preselect the venue when arriving from a venue card ("Add job").
    const [searchParams] = useSearchParams();
    const venueParam = searchParams.get('venue');
    useEffect(() => {
        if (!venueParam || form.venue_id) return;
        const v = venues.find(x => x.id === venueParam);
        if (v) setForm(f => ({ ...f, venue_id: v.id, location: v.location || '' }));
    }, [venueParam, venues, form.venue_id]);

    // Roles available for the chosen venue type. Untagged roles (no venue_types)
    // apply everywhere; with no venue/type selected yet, all roles show.
    const cats = useMemo(
        () => (catsData || []).filter(c => !venueType || !c.venue_types?.length || c.venue_types.includes(venueType)),
        [catsData, venueType],
    );
    const categories = useMemo(() => cats.map(c => c.key), [cats]);
    const empTypes = useMemo(() => (empsData || []).map(e => e.key), [empsData]);
    const islands = useMemo(() => (islandsData || []).map(i => i.name), [islandsData]);
    const catMap = useMemo(() => Object.fromEntries((catsData || []).map(c => [c.key, { en: c.label_en, el: c.label_el }])), [catsData]);
    const empMap = useMemo(() => Object.fromEntries((empsData || []).map(e => [e.key, { en: e.label_en, el: e.label_el }])), [empsData]);

    // Default the category/type, and reset the category if the chosen venue type
    // no longer offers the currently-selected role.
    useEffect(() => {
        if (!categories.length && !empTypes.length) return;
        setForm(f => ({
            ...f,
            category: categories.includes(f.category) ? f.category : (categories[0] || ''),
            employment_type: f.employment_type || empTypes[0] || '',
        }));
    }, [categories, empTypes]);

    const handleSubmit = async (status = 'active') => {
        const isDraft = status === 'draft';
        if (!form.title && !form.title_el) {
            toast.error(lang === 'el' ? 'Συμπλήρωσε τουλάχιστον τον τίτλο' : 'Please fill in at least the title');
            return;
        }
        if (!isDraft && (!form.location || (!form.description && !form.description_el))) {
            toast.error(lang === 'el' ? 'Συμπλήρωσε τα απαιτούμενα πεδία' : 'Please fill in required fields');
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

    const fillDemo = () => setForm(f => ({
        ...f,
        listing_lang: 'both',
        title: 'Pool & Beach Waiter/Waitress',
        title_el: 'Σερβιτόρος/α Πισίνας & Παραλίας',
        location: islands[0] || '',
        category: categories.includes('pool_beach') ? 'pool_beach' : (categories[0] || ''),
        employment_type: empTypes.includes('seasonal') ? 'seasonal' : (empTypes[0] || ''),
        positions_available: 3,
        start_date: '5',
        end_date: '9',
        salary_amount: '1400',
        salary_period: 'monthly',
        description: "Join our 5-star beachfront resort for the summer season. You'll serve drinks and light meals to guests at the pool bar and beach, deliver friendly, attentive service, and help create an unforgettable experience.",
        description_el: 'Γίνε μέλος του 5άστερου παραθαλάσσιου resort μας για τη θερινή σεζόν. Θα σερβίρεις ποτά και ελαφριά γεύματα σε πισίνα και παραλία, με φιλική και προσεκτική εξυπηρέτηση, βοηθώντας να δημιουργήσουμε μια αξέχαστη εμπειρία.',
        requirements: ['Previous experience', 'Good English', 'Team player', 'Full-season availability'].join('\n'),
        requirements_el: ['Προϋπηρεσία', 'Καλά Αγγλικά', 'Ομαδικό πνεύμα', 'Διαθεσιμότητα όλη τη σεζόν'].join('\n'),
        benefits: ['Accommodation', 'Meals', 'Transport', 'Tips', 'End-of-season bonus'].join('\n'),
        benefits_el: ['Διαμονή', 'Γεύματα', 'Μεταφορά', 'Φιλοδωρήματα', 'Bonus τέλους σεζόν'].join('\n'),
    }));

    const handlePhotoFile = (file) => {
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const removePhoto = () => {
        if (photoPreview) URL.revokeObjectURL(photoPreview);
        setPhotoFile(null);
        setPhotoPreview(null);
        set('photo_position', '50% 50%');
    };

    const showEn = form.listing_lang === 'en' || form.listing_lang === 'both';
    const showEl = form.listing_lang === 'el' || form.listing_lang === 'both';
    const biGrid = `grid gap-4 ${form.listing_lang === 'both' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`;

    const activePreviewLang = form.listing_lang === 'both' ? previewLang : form.listing_lang;
    const hotelName = selectedVenue?.name || me?.hotel_name || me?.full_name;
    const hotelLogo = selectedVenue?.logo_url || me?.hotel_logo_url || me?.avatar_url;

    if (!isAuthenticated && !isLoading) return <GuestView icon={Briefcase} titleEl="Δημοσίευση Αγγελίας" titleEn="Post a Job" descEl="Σύνδεσου ως επιχείρηση για να δημοσιεύσεις νέες θέσεις εργασίας." descEn="Sign in as a business to post new job listings." />;

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-bold text-foreground">{t('nav_post_job')}</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {lang === 'el'
                            ? 'Συμπλήρωσε τα στοιχεία της θέσης — όσο πιο πλήρης η αγγελία, τόσο περισσότερες αιτήσεις.'
                            : 'Fill in the position details — the more complete the listing, the more applications you get.'}
                    </p>
                    <RequiredNote lang={lang} className="mt-2" />
                </div>
                {import.meta.env.DEV && (
                    <Button variant="outline" size="sm" onClick={fillDemo} className="rounded-xl flex-shrink-0">Fill demo</Button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] gap-8 items-start">
            <div className="space-y-5">
                {/* 1. Language & Title */}
                <Section icon={Languages}
                    title={lang === 'el' ? 'Γλώσσα & Τίτλος' : 'Language & Title'}
                    subtitle={lang === 'el' ? 'Σε ποια γλώσσα απευθύνεται η αγγελία' : 'Which language the listing targets'}>
                    <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">{lang === 'el' ? 'Γλώσσα Αγγελίας' : 'Listing Language'}<RequiredMark /></label>
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
                                <label className="text-sm font-medium text-foreground mb-1.5 block">Job Title (EN)<RequiredMark /></label>
                                <Input className="rounded-xl" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Waiter/Waitress" />
                            </div>
                        )}
                        {showEl && (
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1.5 block">Τίτλος Θέσης (EL)<RequiredMark /></label>
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
                            <label className="text-sm font-medium text-foreground mb-1.5 block">{lang === 'el' ? 'Κατάστημα' : 'Venue'}<RequiredMark /></label>
                            <VenueField
                                value={form.venue_id}
                                onSelect={v => setForm(f => ({ ...f, venue_id: v?.id || '', location: v?.location || '' }))}
                                islands={islands}
                                lang={lang}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">{lang === 'el' ? 'Κατηγορία' : 'Category'}</label>
                            <Select value={form.category} onValueChange={v => set('category', v)}>
                                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                                <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{catMap[c]?.[lang] ?? catMap[c]?.en ?? c}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">{lang === 'el' ? 'Χρονικό Διάστημα' : 'Date Range'}</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Select value={form.start_date} onValueChange={v => set('start_date', v)}>
                                <SelectTrigger className="rounded-xl"><SelectValue placeholder={lang === 'el' ? 'Από μήνα' : 'From month'} /></SelectTrigger>
                                <SelectContent>{MONTH_OPTIONS.map(m => <SelectItem key={m} value={m}>{monthName(m, lang)}</SelectItem>)}</SelectContent>
                            </Select>
                            <Select value={form.end_date} onValueChange={v => set('end_date', v)}>
                                <SelectTrigger className="rounded-xl"><SelectValue placeholder={lang === 'el' ? 'Έως μήνα' : 'To month'} /></SelectTrigger>
                                <SelectContent>{MONTH_OPTIONS.map(m => <SelectItem key={m} value={m}>{monthName(m, lang)}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">{lang === 'el' ? 'Ενημερωτικό — εμφανίζεται στην αγγελία για όποιον κάνει αίτηση.' : 'Informative only — shown on the listing for applicants.'}</p>
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
                    <label className="flex items-center gap-2 cursor-pointer w-fit">
                        <Checkbox checked={form.salary_negotiable} onCheckedChange={v => set('salary_negotiable', v === true)} />
                        <span className="text-sm text-foreground">{lang === 'el' ? 'Συζητήσιμη τιμή' : 'Negotiable salary'}</span>
                    </label>
                </Section>

                {/* 4. Photo */}
                <Section icon={ImagePlus}
                    title={lang === 'el' ? 'Φωτογραφία' : 'Photo'}
                    subtitle={lang === 'el' ? 'Εμφανίζεται στην κάρτα της αγγελίας — π.χ. το μαγαζί ή η θέα' : 'Shown on the job card — e.g. your venue or the view'}>
                    <JobPhotoField
                        src={photoPreview}
                        position={form.photo_position}
                        onFile={handlePhotoFile}
                        onPositionChange={pos => set('photo_position', pos)}
                        onRemove={removePhoto}
                        lang={lang}
                    />
                </Section>

                {/* 5. Description */}
                <Section icon={FileText}
                    title={lang === 'el' ? 'Περιγραφή & Απαιτήσεις' : 'Description & Requirements'}
                    subtitle={lang === 'el' ? 'Τι περιλαμβάνει η θέση και τι προσφέρεις' : 'What the role involves and what you offer'}>
                    <div className={biGrid}>
                        {showEn && (
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1.5 block">
                                    {form.listing_lang === 'both' ? 'EN Job Description' : 'Job Description'}<RequiredMark />
                                </label>
                                <Textarea className="rounded-xl min-h-[120px]" value={form.description} onChange={e => set('description', e.target.value)} />
                            </div>
                        )}
                        {showEl && (
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1.5 block">
                                    {form.listing_lang === 'both' ? 'EL Περιγραφή Θέσης' : 'Περιγραφή Θέσης'}<RequiredMark />
                                </label>
                                <Textarea className="rounded-xl min-h-[120px]" value={form.description_el} onChange={e => set('description_el', e.target.value)} />
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">{lang === 'el' ? 'Απαιτήσεις' : 'Requirements'}</label>
                        <ChecklistField
                            options={REQUIREMENT_OPTIONS}
                            enValue={form.requirements} elValue={form.requirements_el}
                            onChange={(en, el) => setForm(f => ({ ...f, requirements: en, requirements_el: el }))}
                            lang={lang}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">{lang === 'el' ? 'Παροχές' : 'Benefits'}</label>
                        <ChecklistField
                            options={BENEFIT_OPTIONS}
                            enValue={form.benefits} elValue={form.benefits_el}
                            onChange={(en, el) => setForm(f => ({ ...f, benefits: en, benefits_el: el }))}
                            lang={lang}
                        />
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

            {/* Live preview */}
            <aside className="lg:sticky lg:top-8 space-y-4">
                <div className="flex items-center justify-between gap-2">
                    <h2 className="font-display font-semibold text-foreground">{lang === 'el' ? 'Προεπισκόπηση' : 'Live preview'}</h2>
                    {form.listing_lang === 'both' && (
                        <div className="inline-flex rounded-xl bg-muted p-1">
                            {['en', 'el'].map(pl => (
                                <button key={pl} type="button" onClick={() => setPreviewLang(pl)}
                                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${previewLang === pl ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                                    {pl === 'el' ? 'Ελληνικά' : 'English'}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="space-y-5 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1">
                    <JobPreviewCard
                        form={form}
                        photoPreview={photoPreview}
                        lang={activePreviewLang}
                        hotelName={hotelName}
                        hotelLogo={hotelLogo}
                        empMap={empMap}
                        catMap={catMap}
                        islands={islandsData}
                    />
                </div>
            </aside>
            </div>
        </div>
    );
}
