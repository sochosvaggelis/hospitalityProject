import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, MapPin, Star } from 'lucide-react';
import useLanguage from '@/lib/useLanguage';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useIslands } from '@/lib/queries';
import GuestView from '@/lib/GuestView';
import JobCard from '@/components/JobCard';
import FavoriteButton from '@/components/FavoriteButton';

function VenueCard({ venue }) {
    return (
        <div className="relative">
            <Link to={`/venues/${venue.id}`}
                className="block bg-card rounded-2xl border border-border/50 p-4 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5">
                <div className="flex items-center gap-3">
                    {venue.logo_url ? (
                        <img src={venue.logo_url} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-6 h-6 text-primary" />
                        </div>
                    )}
                    <div className="min-w-0 pr-8">
                        <p className="font-semibold text-foreground truncate">{venue.name}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            {venue.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{venue.location}</span>}
                            {venue.stars > 0 && <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />{venue.stars}</span>}
                        </div>
                    </div>
                </div>
            </Link>
            <FavoriteButton kind="venue" id={venue.id} className="absolute top-3 right-3" />
        </div>
    );
}

export default function UserFavorites() {
    const { lang } = useLanguage();
    const { isAuthenticated } = useAuth();
    const { data: islands } = useIslands();
    const { data, isLoading } = useQuery({
        queryKey: ['user-favorites'],
        queryFn: api.getUserFavorites,
        enabled: isAuthenticated,
    });

    if (!isAuthenticated) return <GuestView icon={Star} titleEl="Αγαπημένα" titleEn="Favourites" descEl="Συνδεθείτε για να αποθηκεύετε καταστήματα και αγγελίες." descEn="Sign in to save venues and job listings." />;
    if (isLoading) return <div className="flex justify-center py-32"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

    const venues = data?.venues || [];
    const jobs = data?.jobs || [];
    const empty = venues.length === 0 && jobs.length === 0;

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                </div>
                <div>
                    <h1 className="font-display text-3xl font-bold text-foreground">{lang === 'el' ? 'Αγαπημένα' : 'Favourites'}</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {venues.length} {lang === 'el' ? 'καταστήματα' : 'venues'} · {jobs.length} {lang === 'el' ? 'αγγελίες' : 'jobs'}
                    </p>
                </div>
            </div>

            {empty ? (
                <div className="bg-card rounded-2xl border border-border/50 p-12 text-center">
                    <Star className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">{lang === 'el' ? 'Δεν έχεις αποθηκεύσει τίποτα ακόμα.' : 'Nothing saved yet.'}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        {lang === 'el' ? 'Πάτησε το ★ σε μια αγγελία ή ένα κατάστημα.' : 'Tap the ★ on a job or a venue to save it.'}
                    </p>
                    <Link to="/jobs" className="inline-block mt-4 text-sm font-medium text-primary hover:underline">
                        {lang === 'el' ? 'Περιήγηση αγγελιών →' : 'Browse jobs →'}
                    </Link>
                </div>
            ) : (
                <div className="space-y-10">
                    {venues.length > 0 && (
                        <section>
                            <h2 className="font-display font-semibold text-foreground mb-4">{lang === 'el' ? 'Καταστήματα' : 'Venues'}</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {venues.map(v => <VenueCard key={v.id} venue={v} />)}
                            </div>
                        </section>
                    )}
                    {jobs.length > 0 && (
                        <section>
                            <h2 className="font-display font-semibold text-foreground mb-4">{lang === 'el' ? 'Αγγελίες' : 'Jobs'}</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {jobs.map(job => <JobCard key={job.id} job={job} islands={islands} />)}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}
