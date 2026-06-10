import { useState, useEffect } from 'react';
import { Star, User, MapPin, Award, Languages, Briefcase, MessageCircle, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import useLanguage from '@/lib/useLanguage';
import { api } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import GuestView from '@/lib/GuestView';

export default function Favorites() {
    const { lang } = useLanguage();
    const navigate = useNavigate();
    const { me, isLoading: authLoading } = useAuth();
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [profileModal, setProfileModal] = useState(null);

    useEffect(() => {
        api.getFavorites().then(data => {
            setFavorites(data || []);
            setLoading(false);
        });
    }, []);

    const handleRemove = async (email) => {
        await api.toggleFavorite(email, '');
        setFavorites(prev => prev.filter(f => f.applicant_email !== email));
        toast.success(lang === 'el' ? 'Αφαιρέθηκε από τα αγαπημένα' : 'Removed from favorites');
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

    const handleMessage = async (fav) => {
        const conv = await api.startConversation({
            other_email: fav.applicant_email,
            other_name: fav.applicant_name,
        });
        navigate('/messages');
    };

    if (authLoading) return <div className="flex justify-center py-32"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
    if (!me) return <GuestView icon={Star} titleEl="Αγαπημένοι Υποψήφιοι" titleEn="Favourite Applicants" descEl="Συνδεθείτε ως ξενοδοχείο για να αποθηκεύετε αγαπημένους υποψηφίους." descEn="Sign in as a hotel to save favourite applicants." />;
    if (loading) return (
        <div className="flex justify-center py-32">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                </div>
                <div>
                    <h1 className="font-display text-3xl font-bold text-foreground">
                        {lang === 'el' ? 'Αγαπημένοι Υποψήφιοι' : 'Favourite Applicants'}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {favorites.length} {lang === 'el' ? 'αποθηκευμένοι' : 'saved'}
                    </p>
                </div>
            </div>

            {favorites.length === 0 ? (
                <div className="bg-card rounded-2xl border border-border/50 p-12 text-center">
                    <Star className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">
                        {lang === 'el'
                            ? 'Δεν έχετε αποθηκεύσει κανέναν υποψήφιο ακόμα.'
                            : 'No favourite applicants yet.'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                        {lang === 'el'
                            ? 'Πατήστε το ★ δίπλα σε έναν υποψήφιο στο Dashboard.'
                            : 'Click the ★ next to an applicant in your Dashboard.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {favorites.map(fav => (
                        <div key={fav.id} className="bg-card rounded-xl border border-border/50 p-4 flex items-center justify-between gap-4">
                            <button
                                onClick={() => handleViewProfile(fav.applicant_email)}
                                className="flex items-center gap-3 flex-1 min-w-0 text-left"
                            >
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <User className="w-5 h-5 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-medium text-foreground hover:text-primary transition-colors">{fav.applicant_name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{fav.applicant_email}</p>
                                </div>
                            </button>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <Button size="sm" variant="outline" className="h-8 rounded-xl gap-1.5 text-xs"
                                    onClick={() => handleMessage(fav)}>
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    {lang === 'el' ? 'Μήνυμα' : 'Message'}
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 rounded-xl p-0 text-muted-foreground hover:text-red-500"
                                    onClick={() => handleRemove(fav.applicant_email)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Profile modal */}
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
                                        <MapPin className="w-4 h-4 flex-shrink-0" /><span>{profileModal.data.location}</span>
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
                                        <Languages className="w-4 h-4 flex-shrink-0" /><span>{profileModal.data.languages_spoken}</span>
                                    </div>
                                )}
                                {profileModal.data.skills && (
                                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                        <Briefcase className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>{profileModal.data.skills}</span>
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
        </div>
    );
}
