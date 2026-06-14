import { Briefcase, UtensilsCrossed, Wine, Waves, Coffee, PartyPopper, ConciergeBell, Crown, Soup } from 'lucide-react';
import useLanguage from '@/lib/useLanguage';

const catLabels = {
    en: { fine_dining: 'Fine Dining', wine_expert: 'Wine Expert / Sommelier', pool_beach: 'Pool & Beach', breakfast: 'Breakfast Server', banquet: 'Banquet Server', room_service: 'Room Service', head_waiter: "Head Waiter / Maître d'", catering: 'Catering Server' },
    el: { fine_dining: 'Fine Dining', wine_expert: 'Οινολόγος / Sommelier', pool_beach: 'Pool & Beach', breakfast: 'Σερβιτόρος Πρωινού', banquet: 'Σερβιτόρος Δεξιώσεων', room_service: 'Room Service', head_waiter: 'Αρχισερβιτόρος', catering: 'Catering' }
};

const catIcons = {
    fine_dining: UtensilsCrossed, wine_expert: Wine, pool_beach: Waves, breakfast: Coffee,
    banquet: PartyPopper, room_service: ConciergeBell, head_waiter: Crown, catering: Soup,
};

// Renders a job's photo, or a default fallback (island outline / category icon) when
// the job has no photo. `interactive` enables the card hover effects.
export default function JobImage({ job, islands, interactive = false }) {
    const { lang } = useLanguage();
    const hover = interactive ? 'group-hover:scale-105 transition-transform duration-500' : '';

    if (job.photo_url) {
        return <img src={job.photo_url} alt="" style={{ objectPosition: job.photo_position || '50% 50%' }} className={`w-full h-full object-cover ${hover}`} />;
    }

    const outline = islands?.find(i => job.location?.toLowerCase().includes(i.name.toLowerCase()))?.outline_url;

    if (outline) {
        return (
            <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1d6fa8 0%, #38d4f5 100%)' }}>
                <img src={outline} alt="" className={`h-3/4 max-w-[70%] object-contain opacity-35 ${interactive ? 'group-hover:opacity-50 transition-opacity duration-300' : ''}`}
                    style={{ filter: 'brightness(0) invert(1)' }} />
            </div>
        );
    }

    const Icon = catIcons[job.category] || Briefcase;
    return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, hsl(205 78% 32%) 0%, hsl(205 70% 48%) 100%)' }}>
            <Icon className={`w-12 h-12 text-white/40 ${interactive ? 'group-hover:text-white/60 transition-colors duration-300' : ''}`} />
            <span className="text-xs font-medium text-white/50">{catLabels[lang]?.[job.category] || job.category}</span>
        </div>
    );
}
