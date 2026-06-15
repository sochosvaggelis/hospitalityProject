import { useState, useEffect, useMemo, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import JobFilterSearch from '@/components/JobFilterSearch';
import JobCard from '@/components/JobCard';
import useLanguage from '@/lib/useLanguage';
import { useInfiniteJobs, useIslands, useCategories, useEmploymentTypes, useVenueNames } from '@/lib/queries';

export default function Jobs() {
    const { t, lang } = useLanguage();
    // Free-text search is no longer typed here; it only arrives via the URL (e.g.
    // the Home hero) and shows as a clearable badge. The bar itself is filters-only.
    const [search, setSearch] = useState('');
    // Each filter holds an array of selected values (multi-select chips).
    const [island, setIsland] = useState([]);
    const [category, setCategory] = useState([]);
    const [empType, setEmpType] = useState([]);
    const [listingLang, setListingLang] = useState([]);
    const [venueName, setVenueName] = useState([]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('search')) setSearch(params.get('search'));
        if (params.get('category')) setCategory([params.get('category')]);
        if (params.get('island')) setIsland([params.get('island')]);
    }, []);

    const { data: catsData } = useCategories();
    const { data: empsData } = useEmploymentTypes();
    const { data: islandData = [] } = useIslands();
    const { data: venueNames = [] } = useVenueNames();

    const categories = useMemo(() => (catsData || []).map(c => c.key), [catsData]);
    const empTypes = useMemo(() => (empsData || []).map(e => e.key), [empsData]);
    const islands = useMemo(() => islandData.map(i => i.name), [islandData]);
    const catMap = useMemo(() => Object.fromEntries((catsData || []).map(c => [c.key, { en: c.label_en, el: c.label_el }])), [catsData]);
    const empMap = useMemo(() => Object.fromEntries((empsData || []).map(e => [e.key, { en: e.label_en, el: e.label_el }])), [empsData]);

    // Every filter (incl. search & island) is sent to the server; nothing is
    // filtered client-side, and results arrive one page at a time.
    const filters = useMemo(() => {
        const f = {};
        if (category.length) f.category = category;
        if (empType.length) f.employment_type = empType;
        if (listingLang.length) f.listing_lang = listingLang;
        if (island.length) f.location = island;
        if (venueName.length) f.hotel_name = venueName;
        if (search.trim()) f.search = search.trim();
        return f;
    }, [category, empType, listingLang, island, venueName, search]);

    const { data, isLoading: loading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteJobs(filters);
    const jobs = useMemo(() => (data?.pages || []).flatMap(p => p.jobs), [data]);
    const total = data?.pages?.[0]?.total ?? 0;

    // Auto-load the next page when the sentinel scrolls into view.
    const sentinelRef = useRef(null);
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el || !hasNextPage) return;
        const obs = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
        }, { rootMargin: '400px' });
        obs.observe(el);
        return () => obs.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const catLabel = c => c === 'all' ? (lang === 'el' ? 'Όλες' : 'All') : (catMap[c]?.[lang] ?? catMap[c]?.en ?? c);
    const empLabel = e => e === 'all' ? (lang === 'el' ? 'Όλες' : 'All') : (empMap[e]?.[lang] ?? empMap[e]?.en ?? e);
    const langLabel = l => ({ all: lang === 'el' ? 'Όλες' : 'All', en: 'English', el: 'Ελληνικά', both: lang === 'el' ? 'Και τα 2' : 'Both' }[l] ?? l);

    const emptyText = lang === 'el' ? 'Καμία επιλογή' : 'No match';

    // Each filter is a chip on the bar with its own multi-select dropdown of values.
    const filterDefs = useMemo(() => [
        { key: 'island', label: lang === 'el' ? 'Νησί' : 'Island', values: island, onChange: setIsland,
            options: islands.map(i => ({ value: i, label: i })) },
        { key: 'category', label: lang === 'el' ? 'Κατηγορία' : 'Category', values: category, onChange: setCategory,
            options: categories.map(c => ({ value: c, label: catLabel(c) })) },
        { key: 'venue', label: lang === 'el' ? 'Όνομα Μαγαζιού' : 'Venue Name', values: venueName, onChange: setVenueName,
            options: venueNames.map(n => ({ value: n, label: n })) },
        { key: 'empType', label: lang === 'el' ? 'Τύπος Απασχόλησης' : 'Employment Type', values: empType, onChange: setEmpType,
            options: empTypes.map(e => ({ value: e, label: empLabel(e) })) },
        { key: 'lang', label: lang === 'el' ? 'Γλώσσα Αγγελίας' : 'Listing Language', values: listingLang, onChange: setListingLang,
            options: ['en', 'el', 'both'].map(l => ({ value: l, label: langLabel(l) })) },
    ], [lang, category, empType, island, listingLang, venueName, categories, empTypes, islands, venueNames, catMap, empMap]);

    const clearFilters = () => { setCategory([]); setEmpType([]); setIsland([]); setListingLang([]); setVenueName([]); setSearch(''); };
    const hasFilters = category.length || empType.length || island.length || listingLang.length || venueName.length || search.trim();

    return (
        <div style={{ background: '#eef4fd', minHeight: '100vh' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <h1 className="font-display text-3xl font-bold text-foreground mb-6">{t('jobs_title')}</h1>

                <div className="mb-4">
                    <JobFilterSearch lang={lang} emptyText={emptyText} defs={filterDefs} />
                </div>

                {hasFilters && (
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                        {search.trim() && <Badge variant="secondary" className="gap-1 rounded-lg">{(lang === 'el' ? 'Αναζήτηση: ' : 'Search: ') + search.trim()}<X className="w-3 h-3 cursor-pointer" onClick={() => setSearch('')} /></Badge>}
                        <button onClick={clearFilters} className="text-xs text-primary hover:underline">{lang === 'el' ? 'Καθαρισμός όλων' : 'Clear all'}</button>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
                ) : jobs.length === 0 ? (
                    <p className="text-center text-muted-foreground py-16">{t('jobs_no_results')}</p>
                ) : (
                    <>
                        <p className="text-sm text-muted-foreground mb-4">
                            {total} {lang === 'el' ? (total === 1 ? 'αγγελία' : 'αγγελίες') : (total === 1 ? 'job' : 'jobs')}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {jobs.map(job => <JobCard key={job.id} job={job} islands={islandData} showFavorite={false} />)}
                        </div>

                        {/* Infinite-scroll sentinel + manual fallback */}
                        <div ref={sentinelRef} className="h-px" />
                        {isFetchingNextPage && (
                            <div className="flex justify-center py-8"><div className="w-7 h-7 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
                        )}
                        {hasNextPage && !isFetchingNextPage && (
                            <div className="flex justify-center py-8">
                                <Button variant="outline" className="rounded-xl" onClick={() => fetchNextPage()}>
                                    {lang === 'el' ? 'Φόρτωση περισσότερων' : 'Load more'}
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
