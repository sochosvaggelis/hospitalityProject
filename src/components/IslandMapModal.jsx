import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import useLanguage from '@/lib/useLanguage';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const ISLAND_NAMES_EL = {
    Santorini: 'Σαντορίνη',
    Mykonos:   'Μύκονος',
    Crete:     'Κρήτη',
    Rhodes:    'Ρόδος',
    Corfu:     'Κέρκυρα',
    Zakynthos: 'Ζάκυνθος',
    Paros:     'Πάρος',
    Naxos:     'Νάξος',
    Lefkada:   'Λευκάδα',
    Milos:     'Μήλος',
    Skiathos:  'Σκιάθος',
    Hydra:     'Ύδρα',
    Ios:       'Ίος',
    Kefalonia: 'Κεφαλονιά',
    Samos:     'Σάμος',
};

const ISLAND_COORDS = {
    Santorini:  { center: [36.42, 25.40], zoom: 12 },
    Mykonos:    { center: [37.4467, 25.3289], zoom: 12 },
    Crete:      { center: [35.2401, 24.9000], zoom: 8  },
    Rhodes:     { center: [36.1892, 28.0464], zoom: 11 },
    Corfu:      { center: [39.6243, 19.9217], zoom: 11 },
    Zakynthos:  { center: [37.7902, 20.9040], zoom: 12 },
    Paros:      { center: [37.0853, 25.1489], zoom: 12 },
    Naxos:      { center: [37.1020, 25.3760], zoom: 11 },
    Lefkada:    { center: [38.7500, 20.6500], zoom: 12 },
    Milos:      { center: [36.6891, 24.4389], zoom: 12 },
    Skiathos:   { center: [39.1620, 23.4920], zoom: 13 },
    Hydra:      { center: [37.3464, 23.4714], zoom: 13 },
    Ios:        { center: [36.7220, 25.2840], zoom: 13 },
    Kefalonia:  { center: [38.1753, 20.5692], zoom: 11 },
    Samos:      { center: [37.7500, 26.8167], zoom: 11 },
};

export default function IslandMapModal({ island, onClose }) {
    const { lang } = useLanguage();
    const coords = ISLAND_COORDS[island.name] ?? { center: [37.9838, 23.7275], zoom: 7 };
    const { center, zoom } = coords;

    const displayName = lang === 'el'
        ? (ISLAND_NAMES_EL[island.name] ?? island.name)
        : island.name;

    const labelIcon = L.divIcon({
        className: '',
        html: `<div style="font-family:serif;font-size:18px;font-weight:700;color:#1e3a5f;text-shadow:1px 1px 0 #fff,-1px -1px 0 #fff,1px -1px 0 #fff,-1px 1px 0 #fff;white-space:nowrap;pointer-events:none;">${displayName}</div>`,
        iconAnchor: [0, 0],
    });

    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
                className="relative z-10 w-full max-w-4xl mx-4 rounded-2xl overflow-hidden shadow-2xl"
                style={{ height: '70vh' }}
                onClick={e => e.stopPropagation()}
            >
                <div className="absolute top-0 left-0 right-0 z-[1000] flex items-center justify-between px-5 py-3 bg-white/90 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        {island.outline_url && (
                            <img src={island.outline_url} alt={island.name} className="h-7 w-auto object-contain opacity-70"
                                style={{ filter: 'invert(27%) sepia(97%) saturate(500%) hue-rotate(190deg) brightness(85%)' }} />
                        )}
                        <span className="font-display font-bold text-lg">{island.name}</span>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none">✕</button>
                </div>
                <MapContainer
                    center={center}
                    zoom={zoom}
                    minZoom={zoom}
                    style={{ width: '100%', height: '100%' }}
                    zoomControl
                >
                    <TileLayer
                        attribution='© <a href="https://carto.com/">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
                    />
                    <Marker position={[center[0] + 0.04, center[1]]} icon={labelIcon} interactive={false} />
                </MapContainer>
            </div>
        </div>
    );
}
