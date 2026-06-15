import { useState } from 'react';
import { Check, ChevronDown, Plus, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

const MAX_VISIBLE = 30; // options shown before search; the rest are found via free text

// A token/chip filter bar. Each chosen filter becomes a chip on the bar reading
// "Label one of <values>", whose value part is a searchable multi-select dropdown.
// `defs` is an array of { key, label, options:[{value,label}], values:[], onChange(values) }.
export default function JobFilterSearch({ lang, emptyText, defs }) {
    const el = lang === 'el';
    const [openKey, setOpenKey] = useState(null); // chip whose value dropdown is open
    const [addOpen, setAddOpen] = useState(false);
    const [query, setQuery] = useState('');

    const activeKeys = defs.filter(d => d.values.length > 0).map(d => d.key);
    // Show a chip for active filters + one being added (still empty) so the user can pick.
    const shownKeys = openKey && !activeKeys.includes(openKey) ? [...activeKeys, openKey] : activeKeys;
    const shown = shownKeys.map(k => defs.find(d => d.key === k)).filter(Boolean);
    const available = defs.filter(d => !shownKeys.includes(d.key));

    const toggle = (def, val) =>
        def.onChange(def.values.includes(val) ? def.values.filter(v => v !== val) : [...def.values, val]);

    const matchedOf = (def) => {
        const q = query.trim().toLowerCase();
        return q ? def.options.filter(o => o.label.toLowerCase().includes(q)) : def.options;
    };

    const selectAll = (def) => {
        const matched = matchedOf(def).map(o => o.value);
        def.onChange(Array.from(new Set([...def.values, ...matched])));
    };

    const remove = (def) => { def.onChange([]); if (openKey === def.key) setOpenKey(null); };

    const summary = (def) => {
        if (!def.values.length) return el ? 'επιλέξτε…' : 'select…';
        const labels = def.values.map(v => def.options.find(o => o.value === v)?.label ?? v);
        return labels.length <= 2 ? labels.join(', ') : `${def.values.length} ${el ? 'επιλεγμένα' : 'selected'}`;
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            {shown.map(def => {
                const matched = matchedOf(def);
                const visible = matched.slice(0, MAX_VISIBLE);
                const extra = matched.length - visible.length;
                return (
                    <Popover key={def.key} open={openKey === def.key}
                        onOpenChange={v => { setOpenKey(v ? def.key : null); setQuery(''); }}>
                        <div className="flex items-center rounded-xl border bg-card shadow-sm overflow-hidden" style={{ borderColor: 'hsl(40 35% 82%)' }}>
                            <PopoverTrigger asChild>
                                <button type="button" className="flex items-center gap-1.5 pl-3 pr-2 py-2 text-sm hover:bg-muted/40 transition-colors">
                                    <span className="font-medium text-foreground">{def.label}</span>
                                    <span className="text-muted-foreground">{el ? 'ένα από' : 'one of'}</span>
                                    <span className={cn('truncate max-w-[180px]', def.values.length ? 'text-primary font-medium' : 'text-muted-foreground italic')}>{summary(def)}</span>
                                    <ChevronDown className="w-4 h-4 opacity-50" />
                                </button>
                            </PopoverTrigger>
                            <button type="button" onClick={() => remove(def)} title={el ? 'Αφαίρεση' : 'Remove'}
                                className="px-2 py-2 text-muted-foreground hover:text-foreground border-l" style={{ borderColor: 'hsl(40 35% 82%)' }}>
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <PopoverContent className="p-0 z-40 w-64" align="start" sideOffset={6}>
                            <Command shouldFilter={false}>
                                <CommandInput value={query} onValueChange={setQuery}
                                    placeholder={el ? `Αναζήτηση ${def.label.toLowerCase()}…` : `Search ${def.label.toLowerCase()}…`} />
                                <div className="flex items-center justify-between gap-2 px-2 py-1.5 border-b text-xs">
                                    <button type="button" onClick={() => selectAll(def)} className="text-primary hover:underline font-medium">
                                        {el ? 'Επιλογή όλων' : 'Select all'}
                                    </button>
                                    <button type="button" onClick={() => def.onChange([])} className="text-muted-foreground hover:text-foreground">
                                        {el ? 'Καθαρισμός' : 'Clear all'}
                                    </button>
                                </div>
                                <CommandList className="max-h-[260px]">
                                    {visible.length === 0 ? (
                                        <div className="py-6 text-center text-sm text-muted-foreground">{emptyText}</div>
                                    ) : (
                                        visible.map(o => (
                                            <CommandItem key={o.value} value={o.value} onSelect={() => toggle(def, o.value)}>
                                                <Check className={cn('mr-2 h-4 w-4 text-primary', def.values.includes(o.value) ? 'opacity-100' : 'opacity-0')} />
                                                <span className="truncate">{o.label}</span>
                                            </CommandItem>
                                        ))
                                    )}
                                    {extra > 0 && (
                                        <div className="px-3 py-2 text-[11px] text-muted-foreground border-t">
                                            {el ? `+${extra} ακόμα — γράψε για αναζήτηση` : `+${extra} more — type to search`}
                                        </div>
                                    )}
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                );
            })}

            {available.length > 0 && (
                <Popover open={addOpen} onOpenChange={setAddOpen}>
                    <PopoverTrigger asChild>
                        <button type="button"
                            className="flex items-center gap-1.5 h-10 rounded-xl border border-dashed px-3 text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                            style={{ borderColor: 'hsl(40 35% 70%)' }}>
                            <Plus className="w-4 h-4" />{shown.length ? (el ? 'Φίλτρο' : 'Add filter') : (el ? 'Αναζήτηση & φίλτρα' : 'Search & filters')}
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 z-40 w-56" align="start" sideOffset={6}>
                        <Command>
                            <CommandInput placeholder={el ? 'Διάλεξε φίλτρο…' : 'Choose a filter…'} />
                            <CommandList>
                                <CommandEmpty>{emptyText}</CommandEmpty>
                                {available.map(d => (
                                    <CommandItem key={d.key} value={d.label} onSelect={() => { setAddOpen(false); setOpenKey(d.key); }}>
                                        {d.label}
                                    </CommandItem>
                                ))}
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            )}
        </div>
    );
}
