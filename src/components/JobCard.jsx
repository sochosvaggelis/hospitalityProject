import { Link } from 'react-router-dom';
import { MapPin, Clock, Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import useLanguage from '@/lib/useLanguage';
import { formatSalary } from '@/lib/i18n';
import JobImage from './JobImage';
import FavoriteButton from './FavoriteButton';
import moment from 'moment';

const typeLabels = {
    en: { full_time: 'Full Time', part_time: 'Part Time', seasonal: 'Seasonal', temporary: 'Temporary' },
    el: { full_time: 'Πλήρης', part_time: 'Μερική', seasonal: 'Εποχιακή', temporary: 'Προσωρινή' }
};

const catLabels = {
    en: { fine_dining: 'Fine Dining', wine_expert: 'Wine Expert / Sommelier', pool_beach: 'Pool & Beach', breakfast: 'Breakfast Server', banquet: 'Banquet Server', room_service: 'Room Service', head_waiter: "Head Waiter / Maître d'", catering: 'Catering Server' },
    el: { fine_dining: 'Fine Dining', wine_expert: 'Οινολόγος / Sommelier', pool_beach: 'Pool & Beach', breakfast: 'Σερβιτόρος Πρωινού', banquet: 'Σερβιτόρος Δεξιώσεων', room_service: 'Room Service', head_waiter: 'Αρχισερβιτόρος', catering: 'Catering' }
};

export default function JobCard({ job, islands, showFavorite = true }) {
    const { lang } = useLanguage();

    return (
        <Link to={`/jobs/${job.id}`} className="block group">
            <div className="bg-card rounded-2xl border border-border/50 overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5">
                {/* Photo */}
                <div className="relative h-40 overflow-hidden">
                    <JobImage job={job} islands={islands} interactive />
                    {showFavorite && <FavoriteButton kind="job" id={job.id} className="absolute top-2 right-2" />}
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
                            <span className="text-sm font-semibold text-primary">
                                {formatSalary(job.salary_amount, job.salary_period, lang)}
                                {job.salary_negotiable && <span className="font-normal text-muted-foreground"> · {lang === 'el' ? 'συζητήσιμη' : 'negotiable'}</span>}
                            </span>
                        ) : job.salary_negotiable ? (
                            <span className="text-sm text-muted-foreground">{lang === 'el' ? 'Συζητήσιμη τιμή' : 'Negotiable'}</span>
                        ) : <span />}
                        <span className="text-xs text-muted-foreground">{moment(job.created_at).fromNow()}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
