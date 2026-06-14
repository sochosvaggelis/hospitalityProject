import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Building2, MapPin, Pencil, Eye, Briefcase, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMyVenues, useVenueTypes } from '@/lib/queries';
import { api } from '@/lib/api';

// Lists a hotel account's venues as cards (like job posts) with Edit / View /
// Add job actions. Each venue is an independent business with its own page;
// editing happens on a dedicated page, viewing opens the public page in a new tab.
export default function VenueManager({ lang }) {
    const el = lang === 'el';
    const navigate = useNavigate();
    const { data: venues = [] } = useMyVenues();
    const { data: venueTypes = [] } = useVenueTypes();
    const { data: myJobs = [] } = useQuery({ queryKey: ['my-jobs'], queryFn: api.getMyJobs, staleTime: 60 * 1000 });

    const typeLabel = (key) => { const vt = venueTypes.find(t => t.key === key); return vt ? (el ? vt.label_el : vt.label_en) : ''; };
    const jobCount = (id) => myJobs.filter(j => j.venue_id === id).length;

    const edit = (v) => navigate(`/venues/${v.id}/edit`);
    const addNew = () => navigate('/venues/new/edit');
    const addJob = (v) => navigate(`/post-job?venue=${v.id}`);
    const viewPublic = (v) => window.open(`/venues/${v.id}`, '_blank', 'noopener');

    return (
        <div className="space-y-4">
            <div>
                <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-display font-semibold text-foreground">{el ? 'Καταστήματα' : 'Venues'}</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    {el ? 'Κάθε κατάστημα είναι ανεξάρτητο, με δικά του στοιχεία. Κάθε αγγελία ανήκει σε ένα κατάστημα.'
                        : 'Each venue is independent, with its own details. Each job listing belongs to a venue.'}
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {venues.map(v => (
                    <div key={v.id} className="bg-card rounded-2xl border border-border/50 p-5 flex flex-col">
                        <div className="flex items-start gap-3">
                            {v.logo_url ? (
                                <img src={v.logo_url} alt="" className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
                            ) : (
                                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <Building2 className="w-5 h-5 text-primary" />
                                </div>
                            )}
                            <div className="min-w-0">
                                <h4 className="font-semibold text-foreground truncate">{v.name || (el ? 'Χωρίς όνομα' : 'Untitled')}</h4>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                    {v.type && <Badge variant="secondary" className="rounded-lg text-xs">{typeLabel(v.type)}</Badge>}
                                    {v.location && <Badge variant="outline" className="rounded-lg text-xs gap-1"><MapPin className="w-3 h-3" />{v.location}</Badge>}
                                    {v.stars > 0 && <Badge variant="outline" className="rounded-lg text-xs gap-1"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />{v.stars}</Badge>}
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5" />{jobCount(v.id)} {el ? 'αγγελίες' : 'jobs'}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/50">
                            <Button size="sm" variant="outline" className="rounded-xl gap-1.5" onClick={() => edit(v)}>
                                <Pencil className="w-3.5 h-3.5" />{el ? 'Επεξεργασία' : 'Edit'}
                            </Button>
                            <Button size="sm" variant="outline" className="rounded-xl gap-1.5" onClick={() => viewPublic(v)}>
                                <Eye className="w-3.5 h-3.5" />{el ? 'Προβολή' : 'View'}
                            </Button>
                            <Button size="sm" className="rounded-xl gap-1.5" onClick={() => addJob(v)}>
                                <Plus className="w-3.5 h-3.5" />{el ? 'Αγγελία' : 'Add job'}
                            </Button>
                        </div>
                    </div>
                ))}
                <button type="button" onClick={addNew}
                    className="rounded-2xl border border-dashed border-border/60 p-5 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors min-h-[140px]">
                    <Plus className="w-6 h-6" />
                    <span className="text-sm font-medium">{el ? 'Νέο κατάστημα' : 'Add venue'}</span>
                </button>
            </div>
        </div>
    );
}
