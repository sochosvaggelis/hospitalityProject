import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useUserFavoriteIds } from '@/lib/queries';
import useLanguage from '@/lib/useLanguage';

// Heart toggle for job seekers to save a hotel or a job listing.
// Only rendered for the 'user' role; guests are routed to login.
export default function FavoriteButton({ kind, id, variant = 'overlay', className = '' }) {
    const { lang } = useLanguage();
    const navigate = useNavigate();
    const { isAuthenticated, me } = useAuth();
    const qc = useQueryClient();
    const enabled = isAuthenticated && me?.role === 'user';
    const { data: favIds } = useUserFavoriteIds(enabled);

    // Hotels (who save applicants) and admins don't use this control.
    if (isAuthenticated && me && me.role !== 'user') return null;

    const isFav = !!favIds?.some(f => f.ref_id === id);

    const handleClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated) { navigate('/login'); return; }

        // Optimistic update of the ids cache
        qc.setQueryData(['user-favorite-ids'], (prev = []) =>
            isFav ? prev.filter(f => f.ref_id !== id) : [...prev, { kind, ref_id: id }]);
        try {
            await api.toggleUserFavorite(kind, id);
            qc.invalidateQueries({ queryKey: ['user-favorites'] });
        } catch (err) {
            qc.invalidateQueries({ queryKey: ['user-favorite-ids'] });
            toast.error(err.message);
            return;
        }
        if (!isFav) toast.success(lang === 'el' ? 'Προστέθηκε στα αγαπημένα' : 'Saved to favourites');
    };

    const label = isFav
        ? (lang === 'el' ? 'Αποθηκευμένο' : 'Saved')
        : (lang === 'el' ? 'Αποθήκευση' : 'Save');

    if (variant === 'button') {
        return (
            <button type="button" onClick={handleClick}
                className={`inline-flex items-center gap-2 h-11 px-5 rounded-xl border transition-colors ${isFav ? 'border-yellow-200 bg-yellow-50 text-yellow-700' : 'border-border hover:bg-muted text-foreground'} ${className}`}>
                <Star className={`w-4 h-4 ${isFav ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                {label}
            </button>
        );
    }

    return (
        <button type="button" onClick={handleClick} aria-label={label}
            className={`w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center transition-colors ${className}`}>
            <Star className={`w-4 h-4 transition-colors ${isFav ? 'fill-yellow-400 text-yellow-400' : 'text-white'}`} />
        </button>
    );
}
