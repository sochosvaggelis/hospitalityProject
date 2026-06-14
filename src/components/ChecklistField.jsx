import { useState } from 'react';
import { Check, Plus, X, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

// A searchable two-pane picker that edits two newline-separated text columns
// (EN + EL) at once. Left pane: a search box + the predefined `options`
// ({ key, en, el }) not yet picked, filtered as you type, plus an "add custom"
// row for anything not in the list. Right pane: the items already chosen.
// Predefined picks toggle their canonical label in both languages; custom items
// are stored identically in both columns, so backend/display need no changes.
//
// Props:
//   options   – predefined choices [{ key, en, el }]
//   enValue   – current EN text column (newline-separated)
//   elValue   – current EL text column (newline-separated)
//   onChange(enValue, elValue)
//   lang      – 'en' | 'el', controls which label is shown
const toLines = (v) => (v || '').split('\n').map(s => s.trim()).filter(Boolean);

export default function ChecklistField({ options, enValue, elValue, onChange, lang }) {
    const [query, setQuery] = useState('');
    const el = lang === 'el';

    const enLines = toLines(enValue);
    const elLines = toLines(elValue);
    const optionEn = options.map(o => o.en);
    const optionEl = options.map(o => o.el);

    const isChecked = (o) => enLines.includes(o.en) || elLines.includes(o.el);
    // Anything not matching a predefined label is a user-added custom item.
    const customs = [...new Set([
        ...enLines.filter(l => !optionEn.includes(l)),
        ...elLines.filter(l => !optionEl.includes(l)),
    ])];

    // Rebuild both columns deterministically: checked options (catalog order)
    // followed by custom items.
    const emit = (checkedKeys, customList) => {
        const checked = options.filter(o => checkedKeys.has(o.key));
        onChange(
            [...checked.map(o => o.en), ...customList].join('\n'),
            [...checked.map(o => o.el), ...customList].join('\n'),
        );
    };

    const currentKeys = () => new Set(options.filter(isChecked).map(o => o.key));

    const add = (o) => { const k = currentKeys(); k.add(o.key); emit(k, customs); };
    const removeOption = (o) => { const k = currentKeys(); k.delete(o.key); emit(k, customs); };
    const removeCustom = (text) => emit(currentKeys(), customs.filter(c => c !== text));

    const q = query.trim();
    const addCustom = () => {
        if (!q) return;
        if (![...enLines, ...elLines].includes(q)) emit(currentKeys(), [...customs, q]);
        setQuery('');
    };

    const label = (o) => (el ? o.el : o.en);
    const available = options.filter(o => !isChecked(o) && (!q || label(o).toLowerCase().includes(q.toLowerCase())));
    // Offer "add custom" only when the query doesn't already match a known label.
    const canAddCustom = q && !options.some(o => label(o).toLowerCase() === q.toLowerCase()) && !customs.includes(q);
    const selectedCount = options.filter(isChecked).length + customs.length;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Left: search + available options */}
            <div className="flex flex-col h-64 rounded-xl border border-border/60 overflow-hidden">
                <div className="relative border-b border-border/60 flex-shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        className="rounded-none border-0 pl-9 focus-visible:ring-0"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && canAddCustom) { e.preventDefault(); addCustom(); } }}
                        placeholder={el ? 'Αναζήτηση ή προσθήκη…' : 'Search or add…'}
                    />
                </div>
                <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
                    {available.map(o => (
                        <button
                            key={o.key} type="button" onClick={() => add(o)}
                            className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-left text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                            <span className="w-4 h-4 rounded-md border border-border flex items-center justify-center flex-shrink-0" />
                            {label(o)}
                        </button>
                    ))}
                    {canAddCustom && (
                        <button
                            type="button" onClick={addCustom}
                            className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-left text-primary hover:bg-primary/10 transition-colors">
                            <Plus className="w-4 h-4 flex-shrink-0" />
                            {el ? `Προσθήκη «${q}»` : `Add “${q}”`}
                        </button>
                    )}
                    {!available.length && !canAddCustom && (
                        <p className="px-2.5 py-2 text-xs text-muted-foreground">
                            {q ? (el ? 'Καμία επιλογή' : 'No matches') : (el ? 'Όλα επιλεγμένα' : 'All selected')}
                        </p>
                    )}
                </div>
            </div>

            {/* Right: selected items */}
            <div className="h-64 rounded-xl border border-border/60 p-1.5 overflow-y-auto">
                {selectedCount === 0 ? (
                    <p className="px-2.5 py-2 text-xs text-muted-foreground">{el ? 'Δεν έχει επιλεγεί τίποτα' : 'Nothing selected yet'}</p>
                ) : (
                    <div className="flex flex-wrap gap-1.5">
                        {options.filter(isChecked).map(o => (
                            <span key={o.key} className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 text-primary px-2.5 py-1 text-sm font-medium">
                                <Check className="w-3.5 h-3.5" />{label(o)}
                                <button type="button" onClick={() => removeOption(o)} className="opacity-70 hover:opacity-100">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </span>
                        ))}
                        {customs.map(c => (
                            <span key={c} className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-sm text-foreground">
                                {c}
                                <button type="button" onClick={() => removeCustom(c)} className="text-muted-foreground hover:text-foreground">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
