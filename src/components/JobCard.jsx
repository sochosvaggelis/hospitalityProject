import { Link } from 'react-router-dom';
import { MapPin, Clock, Briefcase, UtensilsCrossed, Wine, Waves, Coffee, PartyPopper, ConciergeBell, Crown, Soup } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import useLanguage from '@/lib/useLanguage';
import { formatSalary } from '@/lib/i18n';
import moment from 'moment';

const typeLabels = {
    en: { full_time: 'Full Time', part_time: 'Part Time', seasonal: 'Seasonal', temporary: 'Temporary' },
    el: { full_time: 'Πλήρης', part_time: 'Μερική', seasonal: 'Εποχιακή', temporary: 'Προσωρινή' }
};

const catLabels = {
    en: { fine_dining: 'Fine Dining', wine_expert: 'Wine Expert / Sommelier', pool_beach: 'Pool & Beach', breakfast: 'Breakfast Server', banquet: 'Banquet Server', room_service: 'Room Service', head_waiter: "Head Waiter / Maître d'", catering: 'Catering Server' },
    el: { fine_dining: 'Fine Dining', wine_expert: 'Οινολόγος / Sommelier', pool_beach: 'Pool & Beach', breakfast: 'Σερβιτόρος Πρωινού', banquet: 'Σερβιτόρος Δεξιώσεων', room_service: 'Room Service', head_waiter: 'Αρχισερβιτόρος', catering: 'Catering' }
};

const catIcons = {
    fine_dining: UtensilsCrossed, wine_expert: Wine, pool_beach: Waves, breakfast: Coffee,
    banquet: PartyPopper, room_service: ConciergeBell, head_waiter: Crown, catering: Soup,
};

function CardImage({ job, islands }) {
    const { lang } = useLanguage();

    if (job.photo_url) {
        return <img src={job.photo_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />;
    }

    const outline = islands?.find(i => job.location?.toLowerCase().includes(i.name.toLowerCase()))?.outline_url;

    if (outline) {
        return (
            <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1d6fa8 0%, #38d4f5 100%)' }}>
                <img src={outline} alt="" className="h-3/4 max-w-[70%] object-contain opacity-35 group-hover:opacity-50 transition-opacity duration-300"
                    style={{ filter: 'brightness(0) invert(1)' }} />
            </div>
        );
    }

    const Icon = catIcons[job.category] || Briefcase;
    return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, hsl(205 78% 32%) 0%, hsl(205 70% 48%) 100%)' }}>
            <Icon className="w-12 h-12 text-white/40 group-hover:text-white/60 transition-colors duration-300" />
            <span className="text-xs font-medium text-white/50">{catLabels[lang]?.[job.category] || job.category}</span>
        </div>
    );
}

export default function JobCard({ job, islands }) {
    const { lang } = useLanguage();

    return (
        <Link to={`/jobs/${job.id}`} className="block group">
            <div className="bg-card rounded-2xl border border-border/50 overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5">
                {/* Photo */}
                <div className="h-40 overflow-hidden">
                    <CardImage job={job} islands={islands} />
                </div>

                {/* Details */}
                <div className="relative p-5 pt-8">
                    {job.hotel_logo ? (
                        <img src={job.hotel_logo} alt="" className="absolute -top-[22px] left-4 w-11 h-11 rounded-xl object-cover border-2 border-card shadow-md" />
                    ) : (
                        <div className="absolute -top-[22px] left-4 w-11 h-11 rounded-xl bg-primary border-2 border-card shadow-md flex items-center justify-center">
                            <Briefcase className="w-5 h-5 text-primary-foreground" />
                        </div>
                    )}
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {lang === 'el' && job.title_el ? job.title_el : job.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">{job.hotel_name}</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="secondary" className="text-xs font-normal">
                            <MapPin className="w-3 h-3 mr-1" />
                            {job.location}
                        </Badge>
                        <Badge variant="outline" className="text-xs font-normal">
                            <Clock className="w-3 h-3 mr-1" />
                            {typeLabels[lang]?.[job.employment_type] || job.employment_type}
                        </Badge>
                        <Badge variant="outline" className="text-xs font-normal">
                            {catLabels[lang]?.[job.category] || job.category}
                        </Badge>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                        {job.salary_amount ? (
                            <span className="text-sm font-semibold text-primary">{formatSalary(job.salary_amount, job.salary_period, lang)}</span>
                        ) : <span />}
                        <span className="text-xs text-muted-foreground">{moment(job.created_date).fromNow()}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
