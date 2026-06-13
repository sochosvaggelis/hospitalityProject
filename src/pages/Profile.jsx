import { useState, useEffect } from 'react';
import { User, Building2, MapPin, Phone, Globe, Award, Languages, Save, Camera, Mail, FileText, Upload, ExternalLink, Star, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import IslandDropdown from '@/components/IslandDropdown';
import { toast } from 'sonner';
import useLanguage from '@/lib/useLanguage';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import GuestView from '@/lib/GuestView';
import LocationPickerMap from '@/components/LocationPickerMap';
import { ISLAND_COORDS } from '@/lib/islandCoords';

export default function Profile() {
    const { t, lang } = useLanguage();
    const { me, user, refreshProfile } = useAuth();
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({});
    const [newEmail, setNewEmail] = useState('');
    const [islands, setIslands] = useState([]);
    const [avatarBusy, setAvatarBusy] = useState(false);
    const [resumeBusy, setResumeBusy] = useState(false);

    useEffect(() => {
        api.islands().then(data => setIslands((data || []).map(i => i.name)));
    }, []);

    useEffect(() => {
        if (me) {
            setForm({
                full_name: me.full_name || '',
                phone: me.phone || '',
                bio: me.bio || '',
                location: me.location || '',
                experience_years: me.experience_years || 0,
                skills: me.skills || '',
                languages_spoken: me.languages_spoken || '',
                hotel_name: me.hotel_name || '',
                hotel_description: me.hotel_description || '',
                hotel_website: me.hotel_website || '',
                hotel_stars: me.hotel_stars || null,
                lat: me.lat || null,
                lng: me.lng || null,
            });
            setNewEmail(me.email || '');
        }
    }, [me]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.updateProfile(form);

            // Email change goes through Supabase Auth (requires confirmation)
            if (newEmail && newEmail !== me.email) {
                const { error } = await supabase.auth.updateUser({ email: newEmail });
                if (error) {
                    toast.error(error.message);
                } else {
                    toast.success(lang === 'el'
                        ? 'Στάλθηκε email επιβεβαίωσης στη νέα διεύθυνση!'
                        : 'Confirmation email sent to your new address!');
                }
            }

            await refreshProfile();
            toast.success(lang === 'el' ? 'Το προφίλ ενημερώθηκε!' : 'Profile updated!');
        } catch (e) {
            toast.error(e.message);
        }
        setSaving(false);
    };

    const handleAvatarUpload = async (e) => {
        const input = e.target;
        const file = input.files?.[0];
        if (!file) return;
        setAvatarBusy(true);
        try {
            await api.uploadAvatar(file);
            await refreshProfile();
            toast.success(lang === 'el' ? 'Η φωτογραφία ενημερώθηκε!' : 'Photo updated!');
        } catch (e) {
            toast.error(e.message);
        } finally {
            setAvatarBusy(false);
            input.value = ''; // allow re-selecting the same file
        }
    };

    const handleResumeUpload = async (e) => {
        const input = e.target;
        const file = input.files?.[0];
        if (!file) return;
        if (file.type !== 'application/pdf') {
            toast.error(lang === 'el' ? 'Μόνο αρχεία PDF επιτρέπονται' : 'Only PDF files are allowed');
            input.value = '';
            return;
        }
        setResumeBusy(true);
        try {
            await api.uploadResume(file);
            await refreshProfile();
            toast.success(lang === 'el' ? 'Το βιογραφικό ανέβηκε!' : 'Resume uploaded!');
        } catch (e) {
            toast.error(e.message);
        } finally {
            setResumeBusy(false);
            input.value = ''; // allow re-selecting the same file
        }
    };

    const handleRemoveAvatar = async () => {
        setAvatarBusy(true);
        try {
            await api.deleteAvatar();
            await refreshProfile();
            toast.success(lang === 'el' ? 'Η φωτογραφία αφαιρέθηκε' : 'Photo removed');
        } catch (e) {
            toast.error(e.message);
        } finally {
            setAvatarBusy(false);
        }
    };

    const handleRemoveResume = async () => {
        setResumeBusy(true);
        try {
            await api.deleteResume();
            await refreshProfile();
            toast.success(lang === 'el' ? 'Το βιογραφικό αφαιρέθηκε' : 'Resume removed');
        } catch (e) {
            toast.error(e.message);
        } finally {
            setResumeBusy(false);
        }
    };

    if (!me) return <GuestView icon={User} titleEl="Το Προφίλ σας" titleEn="Your Profile" descEl="Συνδεθείτε για να δείτε και να επεξεργαστείτε το προφίλ σας." descEn="Sign in to view and edit your profile." />;

    const isHotel = me.role === 'hotel';
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
            <h1 className="font-display text-3xl font-bold text-foreground mb-8">{t('profile_title')}</h1>

            {/* Avatar */}
            <div className="bg-card rounded-2xl border border-border/50 p-6 mb-6">
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        {me.avatar_url ? (
                            <img src={me.avatar_url} alt="" className="w-20 h-20 rounded-2xl object-cover" />
                        ) : (
                            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                                {isHotel ? <Building2 className="w-8 h-8 text-primary" /> : <User className="w-8 h-8 text-primary" />}
                            </div>
                        )}
                        <label className={`absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center transition-opacity ${avatarBusy ? 'pointer-events-none opacity-0' : 'opacity-0 group-hover:opacity-100 cursor-pointer'}`}>
                            <Camera className="w-5 h-5 text-white" />
                            <input type="file" accept="image/*" className="hidden" disabled={avatarBusy} onChange={handleAvatarUpload} />
                        </label>
                        {avatarBusy && (
                            <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                            </div>
                        )}
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">{lang === 'el' ? 'Πατήστε στη φωτογραφία για αλλαγή' : 'Click photo to change'}</p>
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium capitalize">{me.role}</span>
                        {me.avatar_url && (
                            <button onClick={handleRemoveAvatar} disabled={avatarBusy}
                                className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50">
                                {avatarBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                {lang === 'el' ? 'Αφαίρεση φωτογραφίας' : 'Remove photo'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-2xl border border-border/50 p-6 space-y-5">

                {/* Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            {lang === 'el' ? 'Ονοματεπώνυμο' : 'Full Name'}
                        </label>
                        <Input className="rounded-xl" value={form.full_name || ''} onChange={e => set('full_name', e.target.value)} />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                            Email
                        </label>
                        <Input type="email" className="rounded-xl" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                        {newEmail !== me.email && (
                            <p className="text-xs text-muted-foreground mt-1">
                                {lang === 'el' ? 'Θα σταλεί email επιβεβαίωσης' : 'A confirmation email will be sent'}
                            </p>
                        )}
                    </div>
                </div>

                {/* Phone & Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-muted-foreground" />{t('profile_phone')}</label>
                        <Input className="rounded-xl" value={form.phone || ''} onChange={e => set('phone', e.target.value)} />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-muted-foreground" />{t('profile_location')}</label>
                        <Input className="rounded-xl" value={form.location || ''} onChange={e => set('location', e.target.value)} />
                    </div>
                </div>

                {/* Bio */}
                <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2"><User className="w-3.5 h-3.5 text-muted-foreground" />{t('profile_bio')}</label>
                    <Textarea className="rounded-xl min-h-[100px]" value={form.bio || ''} onChange={e => set('bio', e.target.value)} />
                </div>

                {/* Server-only fields */}
                {!isHotel && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2"><Award className="w-3.5 h-3.5 text-muted-foreground" />{t('profile_experience')}</label>
                                <Input type="number" className="rounded-xl" value={form.experience_years || 0} onChange={e => set('experience_years', Number(e.target.value))} />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2"><Languages className="w-3.5 h-3.5 text-muted-foreground" />{t('profile_languages')}</label>
                                <Input className="rounded-xl" value={form.languages_spoken || ''} onChange={e => set('languages_spoken', e.target.value)} placeholder={lang === 'el' ? 'π.χ. Ελληνικά, Αγγλικά' : 'e.g. Greek, English'} />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2"><Award className="w-3.5 h-3.5 text-muted-foreground" />{t('profile_skills')}</label>
                            <Input className="rounded-xl" value={form.skills || ''} onChange={e => set('skills', e.target.value)} placeholder={lang === 'el' ? 'π.χ. Σερβιτόρος, Bartending' : 'e.g. Serving, Bartending'} />
                        </div>

                        {/* Resume / CV upload */}
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                                {lang === 'el' ? 'Βιογραφικό (CV)' : 'Resume / CV'}
                            </label>
                            <div className="flex items-center gap-3">
                                {me.resume_url ? (
                                    <a href={me.resume_url} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-sm text-primary hover:underline truncate max-w-[200px]">
                                        <FileText className="w-4 h-4 flex-shrink-0" />
                                        <span className="truncate">{lang === 'el' ? 'Δείτε το CV σας' : 'View your CV'}</span>
                                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                    </a>
                                ) : (
                                    <span className="text-sm text-muted-foreground">{lang === 'el' ? 'Δεν έχετε ανεβάσει CV' : 'No resume uploaded'}</span>
                                )}
                                <label className={`${resumeBusy ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}>
                                    <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-accent transition-colors">
                                        {resumeBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                                        {me.resume_url
                                            ? (lang === 'el' ? 'Αντικατάσταση' : 'Replace')
                                            : (lang === 'el' ? 'Ανέβασμα PDF' : 'Upload PDF')}
                                    </span>
                                    <input type="file" accept="application/pdf" className="hidden" disabled={resumeBusy} onChange={handleResumeUpload} />
                                </label>
                                {me.resume_url && (
                                    <button onClick={handleRemoveResume} disabled={resumeBusy}
                                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-50">
                                        {resumeBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                        {lang === 'el' ? 'Αφαίρεση' : 'Remove'}
                                    </button>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{lang === 'el' ? 'Μόνο PDF, μέγιστο 5MB' : 'PDF only, max 5MB'}</p>
                        </div>
                    </>
                )}

                {/* Hotel-only fields */}
                {isHotel && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-muted-foreground" />{t('profile_hotel_name')}</label>
                                <Input className="rounded-xl" value={form.hotel_name || ''} onChange={e => set('hotel_name', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2"><Star className="w-3.5 h-3.5 text-muted-foreground" />{lang === 'el' ? 'Αστέρια' : 'Star Rating'}</label>
                                <div className="flex items-center gap-1.5 h-10">
                                    {[1,2,3,4,5].map(n => (
                                        <button
                                            key={n}
                                            type="button"
                                            onClick={() => set('hotel_stars', form.hotel_stars === n ? null : n)}
                                            className="transition-transform hover:scale-110"
                                        >
                                            <Star className={`w-6 h-6 ${n <= (form.hotel_stars || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30 hover:text-yellow-300'}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-muted-foreground" />{lang === 'el' ? 'Νησί' : 'Island'}</label>
                            <IslandDropdown
                                value={form.location || ''}
                                onValueChange={v => setForm(f => ({ ...f, location: v, lat: null, lng: null }))}
                                islands={islands}
                                placeholder={lang === 'el' ? 'Επίλεξε νησί' : 'Select island'}
                            />
                            {form.location && (
                                <LocationPickerMap
                                    island={form.location}
                                    lat={form.lat}
                                    lng={form.lng}
                                    lang={lang}
                                    onChange={(lat, lng) => setForm(f => ({ ...f, lat, lng }))}
                                />
                            )}
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-muted-foreground" />{t('profile_hotel_desc')}</label>
                            <Textarea className="rounded-xl min-h-[100px]" value={form.hotel_description || ''} onChange={e => set('hotel_description', e.target.value)} placeholder={lang === 'el' ? 'Περιγράψτε το ξενοδοχείο σας...' : 'Describe your hotel...'} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2"><Globe className="w-3.5 h-3.5 text-muted-foreground" />{t('profile_hotel_website')}</label>
                            <Input className="rounded-xl" value={form.hotel_website || ''} onChange={e => set('hotel_website', e.target.value)} placeholder="www.myhotel.gr" />
                        </div>
                    </>
                )}

                <div className="flex justify-end pt-2">
                    <Button onClick={handleSave} disabled={saving} className="rounded-xl gap-2 px-6">
                        <Save className="w-4 h-4" />{saving ? t('common_loading') : t('profile_save')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
