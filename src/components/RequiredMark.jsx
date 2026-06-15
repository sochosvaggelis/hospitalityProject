// A red asterisk marking a required form field, plus a small legend to explain it.
export default function RequiredMark() {
    return <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>;
}

export function RequiredNote({ lang, className = '' }) {
    return (
        <p className={`text-xs text-muted-foreground ${className}`}>
            <span className="text-red-500">*</span> {lang === 'el' ? 'Υποχρεωτικά πεδία' : 'Required fields'}
        </p>
    );
}
