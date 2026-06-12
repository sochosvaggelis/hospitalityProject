import { useState, useEffect, useMemo } from 'react';
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import JobCard from '@/components/JobCard';
import useLanguage from '@/lib/useLanguage';
import { useJobs, useIslands, useCategories, useEmploymentTypes } from '@/lib/queries';

export default function Jobs() {
    const { t, lang } = useLanguage();
    const [search, setSearch] = useState('');
    const [island, setIsland] = useState('all');
    const [category, setCategory] = useState('all');
    const [empType, setEmpType] = useState('all');
    const [listingLang, setListingLang] = useState('all');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('search')) setSearch(params.get('search'));
        if (params.get('category')) setCategory(params.get('category'));
        if (params.get('island')) setIsland(params.get('island'));
    }, []);

    const { data: catsData } = useCategories();
    const { data: empsData } = useEmploymentTypes();
    const { data: islandData = [] } = useIslands();

    const categories = useMemo(() => (catsData || []).map(c => c.key), [catsData]);
    const empTypes = useMemo(() => (empsData || []).map(e => e.key), [empsData]);
    const islands = useMemo(() => islandData.map(i => i.name), [islandData]);
    const catMap = useMemo(() => Object.fromEntries((catsData || []).map(c => [c.key, { en: c.label_en, el: c.label_el }])), [catsData]);
    const empMap = useMemo(() => Object.fromEntries((empsData || []).map(e => [e.key, { en: e.label_en, el: e.label_el }])), [empsData]);

    const filters = {};
    if (category !== 'all') filters.category = category;
    if (empType !== 'all') filters.employment_type = empType;
    if (listingLang !== 'all') filters.listing_lang = listingLang;
    const { data: jobsData, isLoading: loading } = useJobs(filters);
    const jobs = jobsData || [];

    const filteredJobs = jobs.filter(job => {
        if (island !== 'all' && !job.location?.toLowerCase().includes(island.toLowerCase())) return false;
        if (!search.trim()) return true;
        const s = search.toLowerCase();
        return job.title?.toLowerCase().includes(s) || job.hotel_name?.toLowerCase().includes(s) || job.location?.toLowerCase().includes(s);
    });


    const allCategories = ['all', ...categories];
    const allEmpTypes = ['all', ...empTypes];
    const allIslands = islands;

    const catLabel = c => c === 'all' ? (lang === 'el' ? 'Όλες' : 'All') : (catMap[c]?.[lang] ?? catMap[c]?.en ?? c);
    const empLabel = e => e === 'all' ? (lang === 'el' ? 'Όλες' : 'All') : (empMap[e]?.[lang] ?? empMap[e]?.en ?? e);
    const langLabel = l => ({ all: lang === 'el' ? 'Όλες' : 'All', en: 'English', el: 'Ελληνικά', both: lang === 'el' ? 'Και τα 2' : 'Both' }[l] ?? l);
    const clearFilters = () => { setCategory('all'); setEmpType('all'); setIsland('all'); setListingLang('all'); setSearch(''); };
    const hasFilters = category !== 'all' || empType !== 'all' || island !== 'all' || listingLang !== 'all' || search.trim();

    return (
        <div style={{ background: '#eef4fd', minHeight: '100vh' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <h1 className="font-display text-3xl font-bold text-foreground mb-6">{t('jobs_title')}</h1>

                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input className="pl-10 h-11 rounded-xl" style={{ background: 'hsl(40 55% 96%)', borderColor: 'hsl(40 35% 82%)' }}
                            placeholder={t('hero_search_placeholder')} value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <Button variant="outline" className="h-11 rounded-xl gap-2" style={{ background: 'hsl(40 55% 96%)', borderColor: 'hsl(40 35% 82%)' }}
                        onClick={() => setShowFilters(!showFilters)}>
                        <SlidersHorizontal className="w-4 h-4" />{t('jobs_filter')}
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
                    </Button>
                </div>

                <div className={`grid transition-all duration-300 ease-in-out ${showFilters ? 'grid-rows-[1fr] opacity-100 mb-6' : 'grid-rows-[0fr] opacity-0 mb-0'}`}>
                    <div className="overflow-hidden">
                    <div className="bg-card rounded-2xl border border-border/50 p-4 flex flex-col sm:flex-row gap-4">
                        {[
                            { label: lang === 'el' ? 'Κατηγορία' : 'Category', value: category, onChange: setCategory, options: allCategories, labelFn: catLabel },
                            { label: lang === 'el' ? 'Τύπος Απασχόλησης' : 'Employment Type', value: empType, onChange: setEmpType, options: allEmpTypes, labelFn: empLabel },
                        ].map(({ label, value, onChange, options, labelFn }) => (
                            <div key={label} className="flex-1">
                                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
                                <Select value={value} onValueChange={onChange}>
                                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                                    <SelectContent>{options.map(o => <SelectItem key={o} value={o}>{labelFn(o)}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        ))}
                        <div className="flex-1">
                            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{lang === 'el' ? 'Νησί' : 'Island'}</label>
                            <Select value={island} onValueChange={setIsland}>
                                <SelectTrigger className="rounded-xl"><SelectValue placeholder={lang === 'el' ? 'Όλα' : 'All'} /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{lang === 'el' ? 'Όλα' : 'All'}</SelectItem>
                                    {allIslands.map(isl => <SelectItem key={isl} value={isl}>{isl}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{lang === 'el' ? 'Γλώσσα Αγγελίας' : 'Listing Language'}</label>
                            <Select value={listingLang} onValueChange={setListingLang}>
                                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{lang === 'el' ? 'Όλες' : 'All'}</SelectItem>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="el">Ελληνικά</SelectItem>
                                    <SelectItem value="both">{lang === 'el' ? 'Και τα 2' : 'Both'}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    </div>
                </div>

                {hasFilters && (
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                        {category !== 'all' && <Badge variant="secondary" className="gap-1 rounded-lg">{catLabel(category)}<X className="w-3 h-3 cursor-pointer" onClick={() => setCategory('all')} /></Badge>}
                        {empType !== 'all' && <Badge variant="secondary" className="gap-1 rounded-lg">{empLabel(empType)}<X className="w-3 h-3 cursor-pointer" onClick={() => setEmpType('all')} /></Badge>}
                        {island !== 'all' && <Badge variant="secondary" className="gap-1 rounded-lg">{island}<X className="w-3 h-3 cursor-pointer" onClick={() => setIsland('all')} /></Badge>}
                        {listingLang !== 'all' && <Badge variant="secondary" className="gap-1 rounded-lg">{langLabel(listingLang)}<X className="w-3 h-3 cursor-pointer" onClick={() => setListingLang('all')} /></Badge>}
                        <button onClick={clearFilters} className="text-xs text-primary hover:underline">{lang === 'el' ? 'Καθαρισμός' : 'Clear all'}</button>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
                ) : filteredJobs.length === 0 ? (
                    <p className="text-center text-muted-foreground py-16">{t('jobs_no_results')}</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredJobs.map(job => <JobCard key={job.id} job={job} islands={islandData} />)}
                    </div>
                )}
            </div>
        </div>
    );
}
