import { Link } from 'react-router-dom';
import { MapPin, Clock, Users, Briefcase } from 'lucide-react';
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

export default function JobCard({ job }) {
    const { t, lang } = useLanguage();

    return (
        <Link to={`/jobs/${job.id}`} className="block group">
            <div className="bg-card rounded-2xl border border-border/50 p-5 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5">
                <div className="flex items-start gap-4">
                    {job.hotel_logo ? (
                        <img src={job.hotel_logo} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Briefcase className="w-5 h-5 text-primary" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                            {lang === 'el' && job.title_el ? job.title_el : job.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-0.5">{job.hotel_name}</p>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
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

                {job.salary_amount && (
                    <p className="mt-3 text-sm font-medium text-primary">{formatSalary(job.salary_amount, job.salary_period, lang)}</p>
                )}

                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span />
                    <span>{moment(job.created_date).fromNow()}</span>
                </div>
            </div>
        </Link>
    );
}