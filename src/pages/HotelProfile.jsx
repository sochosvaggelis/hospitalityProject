import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Building2, MapPin, Globe, Star, ArrowLeft, Briefcase, Clock, DollarSign, Users, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import useLanguage from '@/lib/useLanguage';
import { api } from '@/lib/api';
import moment from 'moment';

export default function HotelProfile() {
    const { hotelId } = useParams();
    const navigate = useNavigate();
    const { lang } = useLanguage();
    const [hotel, setHotel] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getHotelProfile(hotelId)
            .then(data => { setHotel(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [hotelId]);

    if (loading) return (
        <div className="flex justify-center py-32" style={{ background: '#eef4fd', minHeight: '100vh' }}>
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
    );

    if (!hotel) return (
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
            <p className="text-muted-foreground">{lang === 'el' ? 'Το ξενοδοχείο δεν βρέθηκε.' : 'Hotel not found.'}</p>
            <Button variant="outline" className="mt-4 rounded-xl" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />{lang === 'el' ? 'Πίσω' : 'Back'}
            </Button>
        </div>
    );

    const name = hotel.hotel_name || hotel.full_name;
    const logo = hotel.hotel_logo_url || hotel.avatar_url;

    return (
        <div style={{ background: '#eef4fd', minHeight: '100vh' }}>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" />{lang === 'el' ? 'Πίσω' : 'Back'}
                </button>

                {/* Header card */}
                <div className="bg-card rounded-2xl border border-border/50 p-6 sm:p-8 mb-6">
                    <div className="flex items-start gap-5">
                        {logo ? (
                            <img src={logo} alt={name} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
                        ) : (
                            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Building2 className="w-9 h-9 text-primary" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{name}</h1>

                            {/* Star rating */}
                            {hotel.hotel_stars && (
                                <div className="flex items-center gap-0.5 mt-1.5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`w-4 h-4 ${i < hotel.hotel_stars ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/20'}`}
                                        />
                                    ))}
                                    <span className="text-sm text-muted-foreground ml-1.5">{hotel.hotel_stars} {lang === 'el' ? 'αστέρια' : 'stars'}</span>
                                </div>
                            )}

                            <div className="flex flex-wrap items-center gap-4 mt-3">
                                {hotel.location && (
                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                        <MapPin className="w-4 h-4 flex-shrink-0" />
                                        <span>{hotel.location}</span>
                                    </div>
                                )}
                                {hotel.hotel_website && (
                                    <a href={hotel.hotel_website.startsWith('http') ? hotel.hotel_website : `https://${hotel.hotel_website}`}
                                        target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                                        <Globe className="w-4 h-4 flex-shrink-0" />
                                        <span>{hotel.hotel_website.replace(/^https?:\/\//, '')}</span>
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {hotel.hotel_description && (
                        <div className="mt-6 pt-6 border-t border-border/50">
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{hotel.hotel_description}</p>
                        </div>
                    )}
                </div>

                {/* Active jobs */}
                <div>
                    <h2 className="font-display text-xl font-bold text-foreground mb-4">
                        {lang === 'el' ? 'Ανοιχτές Θέσεις' : 'Open Positions'}
                        {hotel.jobs.length > 0 && (
                            <span className="ml-2 text-sm font-normal text-muted-foreground">({hotel.jobs.length})</span>
                        )}
                    </h2>

                    {hotel.jobs.length === 0 ? (
                        <div className="bg-card rounded-2xl border border-border/50 p-10 text-center">
                            <Briefcase className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                            <p className="text-muted-foreground">
                                {lang === 'el' ? 'Δεν υπάρχουν ανοιχτές θέσεις αυτή τη στιγμή.' : 'No open positions at the moment.'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {hotel.jobs.map(job => (
                                <Link key={job.id} to={`/jobs/${job.id}`}
                                    className="block bg-card rounded-xl border border-border/50 p-4 hover:shadow-md hover:border-primary/20 transition-all">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-foreground">{job.title}</p>
                                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                                {job.location && (
                                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <MapPin className="w-3 h-3" />{job.location}
                                                    </span>
                                                )}
                                                {job.employment_type && (
                                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Clock className="w-3 h-3" />{job.employment_type}
                                                    </span>
                                                )}
                                                {job.salary_range && (
                                                    <span className="flex items-center gap-1 text-xs text-primary font-medium">
                                                        <DollarSign className="w-3 h-3" />{job.salary_range}
                                                    </span>
                                                )}
                                                {job.positions_available && (
                                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Users className="w-3 h-3" />{job.positions_available} {lang === 'el' ? 'θέσεις' : 'positions'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-xs text-muted-foreground flex-shrink-0 pt-0.5">
                                            {moment(job.created_at).fromNow()}
                                        </span>
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
