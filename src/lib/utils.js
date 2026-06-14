import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
    return twMerge(clsx(inputs))
}


export const isIframe = window.self !== window.top;

const MONTHS = {
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    el: ['Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος', 'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'],
};

// Month values are stored as "1".."12". Unknown values (e.g. legacy date
// strings) are returned as-is so old listings still render.
export const MONTH_OPTIONS = MONTHS.en.map((_, i) => String(i + 1));

export function monthName(value, lang = 'en') {
    const i = Number(value) - 1;
    if (Number.isNaN(i) || i < 0 || i > 11) return value || '';
    return (MONTHS[lang] || MONTHS.en)[i];
}

export function monthRange(start, end, lang = 'en') {
    return [start, end].map(v => monthName(v, lang)).filter(Boolean).join(' – ');
}
