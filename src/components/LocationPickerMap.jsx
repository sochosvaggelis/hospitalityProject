import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ISLAND_COORDS } from '@/lib/islandCoords';

const pinIcon = L.divIcon({
    className: '',
    html: `<div style="width:28px;height:28px;background:#e85d2f;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
});

function ClickHandler({ onPick }) {
    useMapEvents({ click(e) { onPick(e.latlng.lat, e.latlng.lng); } });
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

    return (
        <div className="mt-3 rounded-xl overflow-hidden border border-border/60" style={{ height: '260px' }}>
            <MapContainer
                center={coords.center}
                zoom={pickerZoom}
                style={{ width: '100%', height: '100%' }}
                zoomControl={true}
                attributionControl={false}
                scrollWheelZoom={true}
            >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png" />
                <Recenter center={coords.center} zoom={pickerZoom} />
                <ClickHandler onPick={onChange} />
                {lat && lng && (
                    <Marker
                        position={[lat, lng]}
                        icon={pinIcon}
                        draggable
                        eventHandlers={{ dragend(e) { const p = e.target.getLatLng(); onChange(p.lat, p.lng); } }}
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
