import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Building2, MapPin, Clock, DollarSign, Users, ArrowLeft, Briefcase, Globe, Star, ExternalLink, Phone, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import useLanguage from '@/lib/useLanguage';
import { formatSalary } from '@/lib/i18n';
import { api } from '@/lib/api';
import { useVenueTypes } from '@/lib/queries';
import moment from 'moment';

// Public page for a single venue (shop/property): its identity + active job
// listings. Keyed by venue id, so each venue of a multi-venue account is distinct.
export default function VenuePublic() {
    const { venueId } = useParams();
    const navigate = useNavigate();
    const { lang } = useLanguage();
    const [venue, setVenue] = useState(null);
    const [loading, setLoading] = useState(true);
    const { data: venueTypes = [] } = useVenueTypes();
    const typeLabel = (key) => { const vt = venueTypes.find(t => t.key === key); return vt ? (lang === 'el' ? vt.label_el : vt.label_en) : ''; };

    useEffect(() => {
        api.getVenueProfile(venueId)
            .then(data => { setVenue(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [venueId]);

    if (loading) return (
        <div className="flex justify-center py-32" style={{ background: '#eef4fd', minHeight: '100vh' }}>
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
    );

    if (!venue) return (
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
            <p className="text-muted-foreground">{lang === 'el' ? 'Το κατάστημα δεν βρέθηκε.' : 'Venue not found.'}</p>
            <Button variant="outline" className="mt-4 rounded-xl" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />{lang === 'el' ? 'Πίσω' : 'Back'}
            </Button>
        </div>
    );

    return (
        <div style={{ background: '#eef4fd', minHeight: '100vh' }}>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" />{lang === 'el' ? 'Πίσω' : 'Back'}
                </button>

                {/* Header card */}
                <div className="bg-card rounded-2xl border border-border/50 p-6 sm:p-8 mb-6">
                    <div className="flex items-start gap-5">
                        {venue.logo_url ? (
                            <img src={venue.logo_url} alt={venue.name} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
                        ) : (
                            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Building2 className="w-9 h-9 text-primary" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{venue.name}</h1>
                            {venue.stars > 0 && (
                                <div className="flex items-center gap-0.5 mt-1.5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star key={i} className={`w-4 h-4 ${i < venue.stars ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/20'}`} />
                                    ))}
                                    <span className="text-sm text-muted-foreground ml-1.5">{venue.stars} {lang === 'el' ? 'αστέρια' : 'stars'}</span>
                                </div>
                            )}
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                                {venue.type && <Badge variant="secondary" className="rounded-lg gap-1"><Building2 className="w-3 h-3" />{typeLabel(venue.type)}</Badge>}
                                {venue.location && <Badge variant="outline" className="rounded-lg gap-1"><MapPin className="w-3 h-3" />{venue.location}</Badge>}
                                {venue.phone && (
                                    <a href={`tel:${venue.phone.replace(/\s+/g, '')}`} className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                                        <Phone className="w-3.5 h-3.5" />{venue.phone}
                                    </a>
                                )}
                                {venue.email && (
                                    <a href={`mailto:${venue.email}`} className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                                        <Mail className="w-3.5 h-3.5" />{venue.email}
                                    </a>
                                )}
                                {venue.website && (
                                    <a href={venue.website.startsWith('http') ? venue.website : `https://${venue.website}`}
                                        target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                                        <Globe className="w-3.5 h-3.5" />{venue.website.replace(/^https?:\/\//, '')}<ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                    {venue.description && (
                        <div className="mt-6 pt-6 border-t border-border/50">
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{venue.description}</p>
                        </div>
                    )}
                </div>

                {/* Active jobs */}
                <div>
                    <h2 className="font-display text-xl font-bold text-foreground mb-4">
                        {lang === 'el' ? 'Ανοιχτές Θέσεις' : 'Open Positions'}
                        {venue.jobs.length > 0 && <span className="ml-2 text-sm font-normal text-muted-foreground">({venue.jobs.length})</span>}
                    </h2>

                    {venue.jobs.length === 0 ? (
                        <div className="bg-card rounded-2xl border border-border/50 p-10 text-center">
                            <Briefcase className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                            <p className="text-muted-foreground">{lang === 'el' ? 'Δεν υπάρχουν ανοιχτές θέσεις αυτή τη στιγμή.' : 'No open positions at the moment.'}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {venue.jobs.map(job => (
                                <Link key={job.id} to={`/jobs/${job.id}`}
                                    className="block bg-card rounded-xl border border-border/50 p-4 hover:shadow-md hover:border-primary/20 transition-all">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-foreground">{lang === 'el' && job.title_el ? job.title_el : job.title}</p>
                                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                                {job.location && <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="w-3 h-3" />{job.location}</span>}
                                                {job.employment_type && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3 h-3" />{job.employment_type}</span>}
                                                {job.salary_amount && <span className="flex items-center gap-1 text-xs text-primary font-medium"><DollarSign className="w-3 h-3" />{formatSalary(job.salary_amount, job.salary_period, lang)}</span>}
                                                {job.positions_available && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="w-3 h-3" />{job.positions_available} {lang === 'el' ? 'θέσεις' : 'positions'}</span>}
                                            </div>
                                        </div>
                                        <span className="text-xs text-muted-foreground flex-shrink-0 pt-0.5">{moment(job.created_at).fromNow()}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
