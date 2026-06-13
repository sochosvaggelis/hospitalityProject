import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { toast } from 'sonner';
import { ISLAND_COORDS } from '@/lib/islandCoords';

const pinIcon = L.divIcon({
    className: '',
    html: `<div style="width:28px;height:28px;background:#e85d2f;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
});

const loadingIcon = L.divIcon({
    className: '',
    html: `<div style="width:28px;height:28px;background:#aaa;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.25);animation:pulse 1s infinite;"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
});

// The CARTO "voyager_nolabels" basemap paints all water this exact colour, so we
// can tell sea from land by sampling the pixel under the click — no network call.
const SEA_RGB = [213, 232, 235];
const SEA_TOL_SQ = 16 * 16; // squared euclidean tolerance (land is ~26+ away)
const TILE = (z, x, y) => `https://a.basemaps.cartocdn.com/rastertiles/voyager_nolabels/${z}/${x}/${y}.png`;

function loadTile(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous'; // CARTO tiles send Access-Control-Allow-Origin: *
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

// Returns true if the map point lands on water. Throws if the tile can't be read.
async function isSeaPoint(map, latlng) {
    const z = Math.round(map.getZoom());
    const p = map.project(latlng, z); // global pixel coords at integer zoom
    const tileX = Math.floor(p.x / 256);
    const tileY = Math.floor(p.y / 256);
    const ox = Math.min(255, Math.max(0, Math.floor(p.x) - tileX * 256));
    const oy = Math.min(255, Math.max(0, Math.floor(p.y) - tileY * 256));

    const img = await loadTile(TILE(z, tileX, tileY));
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, 256, 256);

    // Majority vote over a 5×5 patch to shrug off single-pixel noise at the coast.
    const sx = Math.min(251, Math.max(0, ox - 2));
    const sy = Math.min(251, Math.max(0, oy - 2));
    const { data } = ctx.getImageData(sx, sy, 5, 5);
    let sea = 0;
    const n = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
        const dr = data[i] - SEA_RGB[0];
        const dg = data[i + 1] - SEA_RGB[1];
        const db = data[i + 2] - SEA_RGB[2];
        if (dr * dr + dg * dg + db * db < SEA_TOL_SQ) sea++;
    }
    return sea / n > 0.6;
}

function ClickHandler({ onPick }) {
    useMapEvents({ click(e) { onPick(e.latlng.lat, e.latlng.lng); } });
    return null;
}

// Captures the Leaflet map instance into a ref so drag handlers can reach it.
function MapRef({ mapRef }) {
    mapRef.current = useMap();
    return null;
}

function Recenter({ center, zoom }) {
    const map = useMap();
    const prev = useRef(null);
    useEffect(() => {
        if (prev.current !== center) {
            map.setView(center, zoom);
            prev.current = center;
        }
    }, [center, zoom, map]);
    return null;
}

export default function LocationPickerMap({ island, lat, lng, onChange, lang }) {
    const coords = ISLAND_COORDS[island] ?? { center: [38.2, 24.0], zoom: 7 };
    const pickerZoom = coords.pickerZoom ?? Math.floor(coords.zoom) - 1;
    const [checking, setChecking] = useState(null); // {lat, lng} while verifying
    const busyRef = useRef(false); // synchronous guard against rapid double picks
    const mapRef = useRef(null);

    // Verify a candidate point, then accept (onValid) or reject (onInvalid).
    const validate = async (la, ln, onValid, onInvalid) => {
        if (busyRef.current) return;
        busyRef.current = true;
        setChecking({ lat: la, lng: ln });
        let sea = false, errored = false;
        try {
            sea = await isSeaPoint(mapRef.current, L.latLng(la, ln));
        } catch {
            errored = true; // can't read tile → don't block the user
        }
        setChecking(null);
        busyRef.current = false;
        if (!sea || errored) {
            onValid();
        } else {
            toast.error(
                lang === 'el'
                    ? 'Δεν μπορείς να βάλεις πινέζα στη θάλασσα — επίλεξε σημείο στη στεριά'
                    : "You can't drop a pin in the sea — pick a spot on land",
                { duration: 3000 }
            );
            onInvalid?.();
        }
    };

    return (
        <div className="mt-3 rounded-xl overflow-hidden border border-border/60 isolate" style={{ height: '260px' }}>
            <MapContainer
                center={coords.center}
                zoom={pickerZoom}
                style={{ width: '100%', height: '100%' }}
                zoomControl={true}
                attributionControl={false}
                scrollWheelZoom={true}
            >
                <TileLayer crossOrigin="anonymous" url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png" />
                <MapRef mapRef={mapRef} />
                <Recenter center={coords.center} zoom={pickerZoom} />
                <ClickHandler onPick={(la, ln) => validate(la, ln, () => onChange(la, ln))} />
                {checking && <Marker position={[checking.lat, checking.lng]} icon={loadingIcon} interactive={false} />}
                {lat && lng && (
                    <Marker
                        position={[lat, lng]}
                        icon={pinIcon}
                        draggable
                        eventHandlers={{
                            dragend(e) {
                                const p = e.target.getLatLng();
                                // Revert to the previous valid position if the drop is invalid.
                                validate(p.lat, p.lng, () => onChange(p.lat, p.lng), () => e.target.setLatLng([lat, lng]));
                            },
                        }}
                    />
                )}
            </MapContainer>
            <div className="px-3 py-1.5 text-xs text-muted-foreground" style={{ background: 'hsl(40 50% 97%)', borderTop: '1px solid hsl(var(--border) / 0.4)' }}>
                {lat && lng
                    ? (lang === 'el' ? '✓ Τοποθεσία επιλέχθηκε — σύρε την πινέζα για να τη μετακινήσεις' : '✓ Location set — drag the pin to adjust')
                    : (lang === 'el' ? 'Κάνε κλικ στον χάρτη για να τοποθετήσεις το μαγαζί σου' : 'Click on the map to place your venue')}
            </div>
        </div>
    );
}
