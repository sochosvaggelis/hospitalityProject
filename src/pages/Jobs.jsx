import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import JobCard from '@/components/JobCard';
import useLanguage from '@/lib/useLanguage';
import { api } from '@/lib/api';

export default function Jobs() {
    const { t, lang } = useLanguage();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [island, setIsland] = useState('all');
    const [category, setCategory] = useState('all');
    const [empType, setEmpType] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [categories, setCategories] = useState([]);
    const [empTypes, setEmpTypes] = useState([]);
    const [islands, setIslands] = useState([]);
    const [catMap, setCatMap] = useState({});
    const [empMap, setEmpMap] = useState({});

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('search')) setSearch(params.get('search'));
        if (params.get('category')) setCategory(params.get('category'));
        if (params.get('island')) setIsland(params.get('island'));
    }, []);

    useEffect(() => {
        const loadRefs = async () => {
            const [cats, emps, isls] = await Promise.all([
                api.categories(),
                api.employmentTypes(),
                api.islands(),
            ]);
            setCategories(cats?.map(c => c.key) || []);
            setEmpTypes(emps?.map(e => e.key) || []);
            setIslands(isls?.map(i => i.name) || []);
            setCatMap(Object.fromEntries((cats || []).map(c => [c.key, { en: c.label_en, el: c.label_el }])));
            setEmpMap(Object.fromEntries((emps || []).map(e => [e.key, { en: e.label_en, el: e.label_el }])));
        };
        loadRefs();
    }, []);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const filters = {};
            if (category !== 'all') filters.category = category;
            if (empType !== 'all') filters.employment_type = empType;
            const data = await api.getJobs(filters);
            setJobs(data || []);
            setLoading(false);
        };
        load();
    }, [category, empType]);

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
    const clearFilters = () => { setCategory('all'); setEmpType('all'); setIsland('all'); setSearch(''); };
    const hasFilters = category !== 'all' || empType !== 'all' || island !== 'all' || search.trim();

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
                    </Button>
                </div>

                {showFilters && (
                    <div className="bg-card rounded-2xl border border-border/50 p-4 mb-6 flex flex-col sm:flex-row gap-4">
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
                    </div>
                )}

                {hasFilters && (
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                        {category !== 'all' && <Badge variant="secondary" className="gap-1 rounded-lg">{catLabel(category)}<X className="w-3 h-3 cursor-pointer" onClick={() => setCategory('all')} /></Badge>}
                        {empType !== 'all' && <Badge variant="secondary" className="gap-1 rounded-lg">{empLabel(empType)}<X className="w-3 h-3 cursor-pointer" onClick={() => setEmpType('all')} /></Badge>}
                        {island !== 'all' && <Badge variant="secondary" className="gap-1 rounded-lg">{island}<X className="w-3 h-3 cursor-pointer" onClick={() => setIsland('all')} /></Badge>}
                        <button onClick={clearFilters} className="text-xs text-primary hover:underline">{lang === 'el' ? 'Καθαρισμός' : 'Clear all'}</button>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
                ) : filteredJobs.length === 0 ? (
                    <p className="text-center text-muted-foreground py-16">{t('jobs_no_results')}</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredJobs.map(job => <JobCard key={job.id} job={job} />)}
                    </div>
                )}
            </div>
        </div>
    );
}
