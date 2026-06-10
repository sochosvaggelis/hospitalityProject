import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useLanguage from '@/lib/useLanguage';
import { tIsland } from '@/lib/i18n';
import { api } from '@/lib/api';
import IslandMapModal from '@/components/IslandMapModal';


function useCountUp(target, duration = 1200) {
    const [count, setCount] = useState(0);
    const rafRef = useRef(null);

    useEffect(() => {
        if (target === 0) return;
        const start = performance.now();
        const animate = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) rafRef.current = requestAnimationFrame(animate);
        };
        rafRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(rafRef.current);
    }, [target, duration]);

    return count;
}

export default function Home() {
    const { t, lang } = useLanguage();
    const [allJobs, setAllJobs] = useState([]);
    const [islands, setIslands] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedIsland, setSelectedIsland] = useState(null);

    useEffect(() => {
        const load = async () => {
            const [jobs, islands] = await Promise.all([api.getJobs(), api.islands()]);
            setAllJobs(jobs || []);
            setIslands(islands || []);
        };
        load();
    }, []);

    const animatedJobs = useCountUp(allJobs.length);
    const animatedIslands = useCountUp(islands.length);
    const animatedCategories = useCountUp(8);

    const getIslandJobCount = (islandName) =>
        allJobs.filter(j => j.location?.toLowerCase().includes(islandName.toLowerCase())).length;

    const handleSearch = () => {
        if (search.trim()) window.location.href = `${import.meta.env.BASE_URL}jobs?search=${encodeURIComponent(search)}`;
    };

    return (
        <div>
            {/* Hero */}
            <section className="relative overflow-hidden min-h-screen flex flex-col justify-center">
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://media.base44.com/images/public/69f7b607f372feaad608e5b5/d97b2767b_image.png')" }} />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(15,23,42,0.5) 0%, rgba(15,23,42,0.3) 50%, #eef4fd 100%)' }} />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-20 sm:pt-36 sm:pb-28 flex items-start min-h-screen">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight drop-shadow-sm">
                            {lang === 'el' ? 'Βρες δουλειά ως σερβιτόρος στα ελληνικά νησιά' : 'Find Server Jobs on Greek Islands'}
                        </h1>
                        <p className="mt-6 text-4xl font-bold leading-relaxed max-w-4xl mx-auto" style={{ color: '#5bc4e0' }}>
                            {lang === 'el' ? 'Θες διακοπές και δουλειά;' : 'Want a job that feels like vacation?'}
                        </p>
                        <p className="text-4xl font-bold text-white">
                            {lang === 'el' ? 'Σε έχουμε.' : "We've got you."}
                        </p>
                        <p className="mt-4 text-xl text-white/70 leading-relaxed max-w-2xl mx-auto">
                            {lang === 'el'
                                ? 'Συνδέουμε σερβιτόρους με ξενοδοχεία και καταστήματα στα ελληνικά νησιά.'
                                : 'We connect servers with hotels and venues across the Greek islands.'}
                        </p>
                        <div className="mt-10 flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
                            <div className="relative flex-1">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input className="pl-10 h-12 rounded-xl bg-white/90 border-0 text-base"
                                    placeholder={t('hero_search_placeholder')} value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSearch()} />
                            </div>
                            <Button onClick={handleSearch} className="h-12 px-6 rounded-xl text-base">{t('common_search')}</Button>
                        </div>
                        <div className="mt-6 flex items-center justify-center">
                            <Link to="/jobs">
                                <Button variant="outline" className="rounded-xl gap-2 bg-white/10 text-white border-white/50 hover:bg-white/20 hover:text-white">
                                    {t('hero_browse')}<ArrowRight className="w-4 h-4" />
                                </Button>
                            </Link>
                        </div>

                        {/* Stats */}
                        <div className="mt-14 flex items-center justify-center gap-10">
                            <div className="text-center">
                                <div className="text-6xl font-black" style={{ color: '#38d4f5', textShadow: '0 0 20px rgba(56,212,245,0.5)' }}>{animatedJobs}</div>
                                <div className="text-2xl font-semibold mt-1" style={{ color: '#38d4f5' }}>{lang === 'el' ? 'Αγγελίες' : 'Active jobs'}</div>
                            </div>
                            <div className="w-px h-10 bg-white/20" />
                            <div className="text-center">
                                <div className="text-6xl font-black" style={{ color: '#38d4f5', textShadow: '0 0 20px rgba(56,212,245,0.5)' }}>{animatedIslands}</div>
                                <div className="text-2xl font-semibold mt-1" style={{ color: '#38d4f5' }}>{lang === 'el' ? 'Νησιά' : 'Islands'}</div>
                            </div>
                            <div className="w-px h-10 bg-white/20" />
                            <div className="text-center">
                                <div className="text-6xl font-black" style={{ color: '#38d4f5', textShadow: '0 0 20px rgba(56,212,245,0.5)' }}>{animatedCategories}</div>
                                <div className="text-2xl font-semibold mt-1" style={{ color: '#38d4f5' }}>{lang === 'el' ? 'Κατηγορίες' : 'Categories'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Browse by Island */}
            <section className="px-4 sm:px-6 py-16" style={{ background: '#eef4fd' }}>
                <div className="max-w-7xl mx-auto">
                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground text-center mb-10">
                        {lang === 'el' ? 'Αναζήτηση ανά Νησί' : 'Browse by Island'}
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        {islands.map((island) => {
                            const count = getIslandJobCount(island.name);
                            return (
                                <button key={island.name} onClick={() => setSelectedIsland(island)}
                                    className="group relative border border-border/50 rounded-2xl overflow-hidden aspect-[3/4] flex flex-col items-center justify-between p-4 hover:border-primary/40 hover:scale-105 hover:shadow-xl transition-all duration-300 text-left"
                                    style={{ background: 'hsl(40 50% 97%)', boxShadow: '0 2px 12px -2px rgba(194,160,100,0.2)' }}>
                                    <span className="font-display font-semibold text-sm text-foreground group-hover:text-primary transition-colors z-10 text-center">{tIsland(island.name, lang)}</span>
                                    <div className="flex-1 flex items-center justify-center w-full py-2">
                                        {island.outline_url && (
                                            <img src={island.outline_url} alt={island.name}
                                                className="w-full h-full object-contain opacity-60 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105"
                                                style={{ filter: 'invert(27%) sepia(97%) saturate(500%) hue-rotate(190deg) brightness(85%)' }} />
                                        )}
                                    </div>
                                    <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors z-10">
                                        {count > 0 ? `${count} ${count === 1 ? 'job' : 'jobs'}` : lang === 'el' ? 'Σύντομα' : 'Coming soon'}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>
            {selectedIsland && (
                <IslandMapModal island={selectedIsland} onClose={() => setSelectedIsland(null)} />
            )}
        </div>
    );
}
