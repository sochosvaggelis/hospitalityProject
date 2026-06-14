import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import IslandDropdown from '@/components/IslandDropdown';
import { useMyVenues, useVenueTypes } from '@/lib/queries';
import { api } from '@/lib/api';
import { ISLAND_COORDS } from '@/lib/islandCoords';
import { toast } from 'sonner';

// Lets a hotel pick which venue a listing is for, and add a new one inline.
// New venues default their coordinates to the island centre; a precise pin can
// be set later from the Profile page. Calls onSelect(venue) with the chosen row.
export default function VenueField({ value, onSelect, islands, lang }) {
    const el = lang === 'el';
    const qc = useQueryClient();
    const { data: venues = [], isLoading } = useMyVenues();
    const { data: venueTypes = [] } = useVenueTypes();
    const [adding, setAdding] = useState(false);
    const [name, setName] = useState('');
    const [island, setIsland] = useState('');
    const [type, setType] = useState('');
    const [saving, setSaving] = useState(false);

    const showAdd = adding || (!isLoading && venues.length === 0);

    const createVenue = async () => {
        if (!name.trim() || !island) {
            toast.error(el ? 'Συμπλήρωσε όνομα και νησί' : 'Enter a name and island');
            return;
        }
        setSaving(true);
        try {
            const center = ISLAND_COORDS[island]?.center;
            const venue = await api.createVenue({
                name: name.trim(), location: island, type: type || null,
                lat: center?.[0] ?? null, lng: center?.[1] ?? null,
            });
            await qc.invalidateQueries({ queryKey: ['my-venues'] });
            onSelect(venue);
            setName(''); setIsland(''); setType(''); setAdding(false);
        } catch (e) {
            toast.error(e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-2">
            {venues.length > 0 && (
                <Select
                    value={value || ''}
                    onValueChange={id => onSelect(venues.find(v => v.id === id))}>
                    <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder={el ? 'Επίλεξε κατάστημα' : 'Select venue'} />
                    </SelectTrigger>
                    <SelectContent>
                        {venues.map(v => (
                            <SelectItem key={v.id} value={v.id}>{v.name}{v.location ? ` · ${v.location}` : ''}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            {showAdd ? (
                <div className="rounded-xl border border-border/60 p-3 space-y-2">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        {venues.length === 0
                            ? (el ? 'Πρόσθεσε το πρώτο σου κατάστημα' : 'Add your first venue')
                            : (el ? 'Νέο κατάστημα' : 'New venue')}
                    </p>
                    <Input className="rounded-xl" value={name} onChange={e => setName(e.target.value)}
                        placeholder={el ? 'Όνομα καταστήματος' : 'Venue name'} />
                    <Select value={type} onValueChange={setType}>
                        <SelectTrigger className="rounded-xl"><SelectValue placeholder={el ? 'Τύπος (π.χ. Καφέ)' : 'Type (e.g. Café)'} /></SelectTrigger>
                        <SelectContent>
                            {venueTypes.map(vt => <SelectItem key={vt.key} value={vt.key}>{el ? vt.label_el : vt.label_en}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <IslandDropdown value={island} onValueChange={setIsland} islands={islands}
                        placeholder={el ? 'Επίλεξε νησί' : 'Select island'} />
                    <div className="flex gap-2">
                        <button type="button" onClick={createVenue} disabled={saving}
                            className="inline-flex items-center gap-1 rounded-xl bg-primary text-primary-foreground px-3 py-1.5 text-sm disabled:opacity-50">
                            <Plus className="w-4 h-4" />{saving ? (el ? 'Προσθήκη…' : 'Adding…') : (el ? 'Προσθήκη' : 'Add')}
                        </button>
                        {venues.length > 0 && (
                            <button type="button" onClick={() => setAdding(false)}
                                className="rounded-xl border border-border/60 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">
                                {el ? 'Άκυρο' : 'Cancel'}
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <button type="button" onClick={() => setAdding(true)}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                    <Plus className="w-4 h-4" />{el ? 'Νέο κατάστημα' : 'Add venue'}
                </button>
            )}
        </div>
    );
}
