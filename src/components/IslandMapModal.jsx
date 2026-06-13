import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import useLanguage from '@/lib/useLanguage';
import { tIsland } from '@/lib/i18n';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});


import { ISLAND_COORDS } from '@/lib/islandCoords';

function MapView({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom]);
    return null;
}

function makePinIcon(count) {
    const size = count > 1 ? 36 : 28;
    const inner = count > 1
        ? `<div style="width:${size}px;height:${size}px;background:#e85d2f;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">
               <span style="color:#fff;font-size:13px;font-weight:800;line-height:1;">${count}</span>
           </div>`
        : `<div style="width:28px;height:28px;background:#e85d2f;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>`;
    return L.divIcon({
        className: '',
        html: inner,
        iconSize: [size, size],
        iconAnchor: [size / 2, count > 1 ? size / 2 : 28],
        popupAnchor: [0, count > 1 ? -size / 2 - 4 : -30],
    });
}

export default function IslandMapModal({ island, jobs = [], onClose }) {
    const { lang } = useLanguage();
    const coords = ISLAND_COORDS[island.name] ?? { center: [37.9838, 23.7275], zoom: 7 };
    const { center, zoom } = coords;

    // Zoom was calibrated for ~1100px (desktop modal width).
    // Narrow viewports need to zoom out proportionally so the island stays visible.
    const mapWidth = Math.min(window.innerWidth, 1100);
    const zoomOffset = Math.log2(1100 / mapWidth);
    const effectiveZoom = Math.round((zoom - zoomOffset) / 0.2) * 0.2;

    // Pan bounds: user can drag to explore, but can't scroll more than ~1.5× the
    // visible area away from the island center (the "threshold" effect).
    const isMobile = window.innerWidth < 640;
    const padCap = isMobile ? 0.1 : 2.5;
    const pad = Math.min(0.12 * Math.pow(2, 13 - effectiveZoom), padCap);
    const maxBounds = [
        [center[0] - pad,       center[1] - pad * 1.6],
        [center[0] + pad,       center[1] + pad * 1.6],
    ];

    const labelFontSize = window.innerWidth < 640 ? '13px' : '18px';
    const displayName = tIsland(island.name, lang);

    const labelIcon = L.divIcon({
        className: '',
        html: `<div style="font-family:'Cinzel',serif;font-size:${labelFontSize};font-weight:700;color:#5a3e1b;text-shadow:1px 1px 0 rgba(238,229,210,0.9),-1px -1px 0 rgba(238,229,210,0.9),1px -1px 0 rgba(238,229,210,0.9),-1px 1px 0 rgba(238,229,210,0.9);white-space:nowrap;pointer-events:none;">${displayName}</div>`,
        iconAnchor: [0, 0],
    });

    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKey);

        const viewport = document.querySelector('meta[name="viewport"]');
        const originalContent = viewport?.getAttribute('content');
        viewport?.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');

        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKey);
            if (viewport && originalContent) viewport.setAttribute('content', originalContent);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-modal-backdrop" onClick={onClose} />
            <div
                className="relative z-10 w-full max-w-6xl mx-0 sm:mx-4 rounded-none sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-modal-card"
                style={{ height: '100dvh', maxHeight: '100dvh' }}
                onMouseDown={e => e.stopPropagation()}
                onClick={e => e.stopPropagation()}
            >
                {/* z-[700] keeps header above all Leaflet panes (max z-index: 600) */}
                <div className="relative z-[700] flex-shrink-0 flex items-center justify-between px-4 sm:px-5 py-2.5 sm:py-3"
                    style={{ background: 'rgba(238, 229, 210, 0.95)', borderBottom: '1px solid rgba(194,160,100,0.3)' }}>
                    <div className="flex items-center gap-2 sm:gap-3">
                        {island.outline_url && (
                            <img src={island.outline_url} alt={island.name} className="h-5 sm:h-7 w-auto object-contain opacity-70"
                                style={{ filter: 'invert(27%) sepia(97%) saturate(500%) hue-rotate(190deg) brightness(85%)' }} />
                        )}
                        <span style={{ fontFamily: "'Cinzel', serif", color: '#5a3e1b' }} className="font-bold text-base sm:text-lg">{displayName}</span>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ color: '#8a6a3a' }}
                        className="hover:opacity-70 transition-opacity w-11 h-11 flex items-center justify-center rounded-lg"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
                {/* Map fills whatever space remains below the header */}
                <div className="flex-1 min-h-0">
                    <MapContainer
                        center={center}
                        zoom={effectiveZoom}
                        minZoom={effectiveZoom}
                        maxZoom={18}
                        maxBounds={maxBounds}
                        maxBoundsViscosity={1}
                        zoomSnap={0.2}
                        zoomDelta={0.2}
                        style={{ width: '100%', height: '100%' }}
                        zoomControl={false}
                        attributionControl={false}
                        dragging={true}
                        scrollWheelZoom={true}
                        doubleClickZoom={true}
                        touchZoom={true}
                        keyboard={false}
                        boxZoom={false}
                    >
                        <MapView center={center} zoom={effectiveZoom} />
                        <TileLayer
                            attribution='© <a href="https://carto.com/">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png"
                        />
                        <Marker position={[center[0] + 0.04, center[1]]} icon={labelIcon} interactive={false} />
                        {Object.values(
                            jobs.reduce((acc, job) => {
                                const key = `${job.hotel_user_id || job.hotel_name}`;
                                if (!acc[key]) acc[key] = { lat: job.lat, lng: job.lng, hotel_name: job.hotel_name, jobs: [] };
                                acc[key].jobs.push(job);
                                return acc;
                            }, {})
                        ).map((group) => (
                            <Marker key={group.hotel_name} position={[group.lat, group.lng]} icon={makePinIcon(group.jobs.length)}>
                                <Popup maxWidth={220}>
                                    <div style={{ fontFamily: 'system-ui, sans-serif', minWidth: '180px' }}>
                                        <div style={{ fontWeight: 700, fontSize: '13px', color: '#1a1a1a', marginBottom: '8px', borderBottom: '1px solid #eee', paddingBottom: '6px' }}>
                                            {group.hotel_name}
                                        </div>
                                        {group.jobs.map(job => (
                                            <div key={job.id} style={{ marginBottom: '6px' }}>
                                                <div style={{ fontSize: '12px', color: '#333', marginBottom: '2px' }}>
                                                    {lang === 'el' && job.title_el ? job.title_el : job.title}
                                                </div>
                                                <Link to={`/jobs/${job.id}`} style={{ fontSize: '11px', color: '#e85d2f', fontWeight: 600, textDecoration: 'none' }}
                                                    onClick={onClose}>
                                                    {lang === 'el' ? 'Δες αγγελία →' : 'View job →'}
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
            </div>
        </div>
    );
}
