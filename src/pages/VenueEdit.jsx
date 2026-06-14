import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Building2, MapPin, Globe, Star, ImagePlus, Loader2, Save, Trash2, Phone, Mail, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import IslandDropdown from '@/components/IslandDropdown';
import LocationPickerMap from '@/components/LocationPickerMap';
import GuestView from '@/lib/GuestView';
import useLanguage from '@/lib/useLanguage';
import { useAuth } from '@/lib/AuthContext';
import { useMyVenues, useVenueTypes, useIslands } from '@/lib/queries';
import { api } from '@/lib/api';
import { ISLAND_COORDS } from '@/lib/islandCoords';
import { toast } from 'sonner';

const blank = { name: '', type: '', location: '', lat: null, lng: null, logo_url: null, stars: null, website: '', description: '', phone: '', email: '' };

export default function VenueEdit() {
    const { venueId } = useParams();
    const isNew = venueId === 'new';
    const navigate = useNavigate();
    const qc = useQueryClient();
    const { lang } = useLanguage();
    const el = lang === 'el';
    const { isAuthenticated, isLoading, me } = useAuth();

    const { data: venues = [] } = useMyVenues();
    const { data: venueTypes = [] } = useVenueTypes();
    const { data: islandsData } = useIslands();
    const islands = (islandsData || []).map(i => i.name);

    const [form, setForm] = useState(isNew ? blank : null);
    const [busy, setBusy] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [justSaved, setJustSaved] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    // Load the venue being edited once the list arrives.
    useEffect(() => {
        if (isNew) return;
        const existing = venues.find(v => v.id === venueId);
        if (existing && !form) setForm({ ...blank, ...existing });
    }, [venues, venueId, isNew, form]);

    useEffect(() => {
        if (isLoading) return;
        if (isAuthenticated && me && me.role !== 'hotel') navigate('/dashboard');
    }, [isLoading, isAuthenticated, me, navigate]);

    if (!isAuthenticated && !isLoading) return <GuestView icon={Building2} titleEl="Καταστήματα" titleEn="Venues" descEl="Συνδέσου ως ξενοδόχος." descEn="Sign in as a hotel." />;

    const handleLogo = async (file) => {
        if (!file) return;
        setUploading(true);
        try { const { url } = await api.uploadVenueLogo(file); set('logo_url', url); }
        catch (e) { toast.error(e.message); } finally { setUploading(false); }
    };

    const save = async () => {
        if (!form.name?.trim() || !form.location) { toast.error(el ? 'Συμπλήρωσε όνομα και νησί' : 'Enter a name and island'); return; }
        setBusy(true);
        try {
            const center = ISLAND_COORDS[form.location]?.center;
            const payload = {
                name: form.name.trim(), type: form.type || null, location: form.location,
                lat: form.lat ?? center?.[0] ?? null, lng: form.lng ?? center?.[1] ?? null,
                logo_url: form.logo_url || null, stars: form.stars ?? null,
                website: form.website || null, description: form.description || null,
                phone: form.phone || null, email: form.email || null,
            };
            if (isNew) {
                // New venue: keep the user on the page, now editing the saved record.
                const created = await api.createVenue(payload);
                await qc.invalidateQueries({ queryKey: ['my-venues'] });
                navigate(`/venues/${created.id}/edit`, { replace: true });
            } else {
                await api.updateVenue(venueId, payload);
                await qc.invalidateQueries({ queryKey: ['my-venues'] });
            }
            toast.success(el ? 'Οι αλλαγές αποθηκεύτηκαν' : 'Changes saved');
            setJustSaved(true);
            setTimeout(() => setJustSaved(false), 3000);
        } catch (e) { toast.error(e.message); } finally { setBusy(false); }
    };

    const remove = async () => {
        setBusy(true);
        try { await api.deleteVenue(venueId); await qc.invalidateQueries({ queryKey: ['my-venues'] }); navigate('/profile'); }
        catch (e) { toast.error(e.message); setBusy(false); }
    };

    if (!form) return (
        <div className="flex justify-center py-32"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
    );

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
            <button onClick={() => navigate('/profile')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" />{el ? 'Πίσω στο προφίλ' : 'Back to profile'}
            </button>

            <h1 className="font-display text-2xl font-bold text-foreground mb-6">
                {isNew ? (el ? 'Νέο κατάστημα' : 'New venue') : (el ? 'Επεξεργασία καταστήματος' : 'Edit venue')}
            </h1>

            <div className="bg-card rounded-2xl border border-border/50 p-5 sm:p-6 space-y-5">
                {/* Logo */}
                <div className="flex items-center gap-4">
                    {form.logo_url ? (
                        <img src={form.logo_url} alt="" className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
                    ) : (
                        <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center flex-shrink-0"><ImagePlus className="w-7 h-7 text-muted-foreground" /></div>
                    )}
                    <div className="flex flex-col items-start gap-1.5">
                        <label className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 px-3 py-1.5 text-sm cursor-pointer hover:border-primary/40 transition-colors">
                            <input type="file" accept="image/*" className="hidden" disabled={uploading}
                                onChange={e => { handleLogo(e.target.files?.[0]); e.target.value = ''; }} />
                            {uploading
                                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />{el ? 'Μεταφόρτωση…' : 'Uploading…'}</>
                                : <><ImagePlus className="w-3.5 h-3.5" />{form.logo_url ? (el ? 'Αλλαγή εικόνας' : 'Change image') : (el ? 'Προσθήκη εικόνας' : 'Add image')}</>}
                        </label>
                        {form.logo_url && <button type="button" onClick={() => set('logo_url', null)} className="text-xs text-destructive hover:underline">{el ? 'Αφαίρεση' : 'Remove'}</button>}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-muted-foreground" />{el ? 'Όνομα *' : 'Name *'}</label>
                        <Input className="rounded-xl" value={form.name} onChange={e => set('name', e.target.value)} placeholder={el ? 'π.χ. Starbucks Παραλίας' : 'e.g. Starbucks Beach'} />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">{el ? 'Τύπος' : 'Type'}</label>
                        <Select value={form.type || ''} onValueChange={v => set('type', v)}>
                            <SelectTrigger className="rounded-xl"><SelectValue placeholder={el ? 'Επίλεξε τύπο' : 'Select type'} /></SelectTrigger>
                            <SelectContent>{venueTypes.map(vt => <SelectItem key={vt.key} value={vt.key}>{el ? vt.label_el : vt.label_en}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-muted-foreground" />{el ? 'Email επικοινωνίας' : 'Contact email'}</label>
                        <Input type="email" className="rounded-xl" value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="info@example.com" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-muted-foreground" />{el ? 'Τηλέφωνο' : 'Phone'}</label>
                        <Input className="rounded-xl" value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder={el ? 'π.χ. 22860 12345' : 'e.g. +30 22860 12345'} />
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2"><Star className="w-3.5 h-3.5 text-muted-foreground" />{el ? 'Αστέρια' : 'Star Rating'}</label>
                    <div className="flex items-center gap-1.5 h-10">
                        {[1, 2, 3, 4, 5].map(n => (
                            <button key={n} type="button" onClick={() => set('stars', form.stars === n ? null : n)} className="transition-transform hover:scale-110">
                                <Star className={`w-6 h-6 ${n <= (form.stars || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30 hover:text-yellow-300'}`} />
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-muted-foreground" />{el ? 'Νησί *' : 'Island *'}</label>
                    <IslandDropdown value={form.location} islands={islands}
                        onValueChange={loc => setForm(f => ({ ...f, location: loc, lat: null, lng: null }))}
                        placeholder={el ? 'Επίλεξε νησί' : 'Select island'} />
                    {form.location && (
                        <LocationPickerMap island={form.location} lat={form.lat} lng={form.lng} lang={lang}
                            onChange={(lat, lng) => setForm(f => ({ ...f, lat, lng }))} />
                    )}
                </div>

                <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2"><Globe className="w-3.5 h-3.5 text-muted-foreground" />{el ? 'Ιστότοπος' : 'Website'}</label>
                    <Input className="rounded-xl" value={form.website || ''} onChange={e => set('website', e.target.value)} placeholder="www.example.com" />
                </div>

                <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-muted-foreground" />{el ? 'Περιγραφή' : 'Description'}</label>
                    <Textarea className="rounded-xl min-h-[100px]" value={form.description || ''} onChange={e => set('description', e.target.value)} placeholder={el ? 'Περιγράψτε το κατάστημα...' : 'Describe this venue...'} />
                </div>

                <div className="flex justify-between items-center gap-3 pt-2">
                    {!isNew ? (
                        confirming ? (
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-muted-foreground">{el ? 'Θα διαγραφούν και οι αγγελίες του. Σίγουρα;' : 'Its job listings will be deleted too. Sure?'}</span>
                                <Button variant="ghost" size="sm" className="rounded-xl" disabled={busy} onClick={() => setConfirming(false)}>{el ? 'Άκυρο' : 'Cancel'}</Button>
                                <Button variant="destructive" size="sm" className="rounded-xl" disabled={busy} onClick={remove}>
                                    <Trash2 className="w-4 h-4 mr-1" />{el ? 'Διαγραφή' : 'Delete'}
                                </Button>
                            </div>
                        ) : (
                            <Button variant="ghost" className="rounded-xl text-destructive hover:text-destructive" disabled={busy} onClick={() => setConfirming(true)}>
                                <Trash2 className="w-4 h-4 mr-1" />{el ? 'Διαγραφή' : 'Delete'}
                            </Button>
                        )
                    ) : <span />}
                    <div className="flex items-center gap-3">
                        {justSaved && (
                            <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                                <Check className="w-4 h-4" />{el ? 'Αποθηκεύτηκε' : 'Saved'}
                            </span>
                        )}
                        <Button className="rounded-xl gap-2 px-6" disabled={busy} onClick={save}>
                            <Save className="w-4 h-4" />{busy ? (el ? 'Αποθήκευση…' : 'Saving…') : (el ? 'Αποθήκευση' : 'Save')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
