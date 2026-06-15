import { useState } from 'react';
import { Building2, MapPin, Globe, Star, ExternalLink, Phone, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// A non-interactive replica of the public venue page header, rendered from the
// VenueEdit form. Mirrors VenuePublic's hero + thumbnail strip layout.
export default function VenuePreviewCard({ form, venueTypes = [], lang }) {
    const el = lang === 'el';
    const [active, setActive] = useState(0);
    const photos = form.photos || [];
    const idx = active < photos.length ? active : 0;
    const typeLabel = (key) => { const vt = venueTypes.find(t => t.key === key); return vt ? (el ? vt.label_el : vt.label_en) : ''; };
    const name = form.name?.trim() || (el ? 'Όνομα καταστήματος' : 'Venue name');

    return (
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
            {/* Hero */}
            <div className="relative h-44">
                {photos.length > 0 ? (
                    <img src={photos[idx]} alt={name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(205 78% 32%) 0%, hsl(205 70% 48%) 100%)' }}>
                        <Building2 className="w-12 h-12 text-white/40" />
                    </div>
                )}
                {form.logo_url ? (
                    <img src={form.logo_url} alt="" className="absolute bottom-0 left-6 translate-y-1/2 w-16 h-16 rounded-2xl object-cover border-2 border-card shadow-md" />
                ) : (
                    <div className="absolute bottom-0 left-6 translate-y-1/2 w-16 h-16 rounded-2xl bg-primary border-2 border-card shadow-md flex items-center justify-center">
                        <Building2 className="w-7 h-7 text-primary-foreground" />
                    </div>
                )}
            </div>

            {/* Thumbnail strip (only with more than one photo) */}
            {photos.length > 1 && (
                <div className="flex gap-2 px-6 pt-3 pl-24">
                    {photos.map((url, i) => (
                        <button key={url} type="button" onClick={() => setActive(i)}
                            className={`w-14 h-10 rounded-lg overflow-hidden border-2 transition-all ${i === idx ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                            <img src={url} alt="" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}

            {/* Info */}
            <div className={`px-6 pb-6 ${photos.length > 1 ? 'pt-4' : 'pt-10'}`}>
                <h1 className="font-display text-xl font-bold text-foreground">{name}</h1>
                {form.stars > 0 && (
                    <div className="flex items-center gap-0.5 mt-1.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < form.stars ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/20'}`} />
                        ))}
                        <span className="text-sm text-muted-foreground ml-1.5">{form.stars} {el ? 'αστέρια' : 'stars'}</span>
                    </div>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                    {form.type && <Badge variant="secondary" className="rounded-lg gap-1"><Building2 className="w-3 h-3" />{typeLabel(form.type)}</Badge>}
                    {form.location && <Badge variant="outline" className="rounded-lg gap-1"><MapPin className="w-3 h-3" />{form.location}</Badge>}
                    {form.phone && <span className="flex items-center gap-1.5 text-sm text-primary"><Phone className="w-3.5 h-3.5" />{form.phone}</span>}
                    {form.email && <span className="flex items-center gap-1.5 text-sm text-primary"><Mail className="w-3.5 h-3.5" />{form.email}</span>}
                    {form.website && (
                        <span className="flex items-center gap-1.5 text-sm text-primary">
                            <Globe className="w-3.5 h-3.5" />{form.website.replace(/^https?:\/\//, '')}<ExternalLink className="w-3 h-3" />
                        </span>
                    )}
                </div>
                {form.description && (
                    <div className="mt-6 pt-6 border-t border-border/50">
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{form.description}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
