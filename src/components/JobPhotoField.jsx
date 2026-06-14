import { useRef } from 'react';
import { ImagePlus, X, Move } from 'lucide-react';
import { toast } from 'sonner';

// Controlled photo picker with drag-to-reposition, shared by PostJob and the
// Dashboard edit modal. The parent owns the file/url/position state.
export default function JobPhotoField({ src, position = '50% 50%', onFile, onPositionChange, onRemove, lang }) {
    const inputRef = useRef(null);
    const dragState = useRef(null);

    const handleSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error(lang === 'el' ? 'Μόνο αρχεία εικόνας' : 'Only image files are allowed');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error(lang === 'el' ? 'Μέγιστο μέγεθος 5MB' : 'Maximum size is 5MB');
            return;
        }
        onFile(file);
    };

    const onPointerDown = (e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        const [x, y] = (position || '50% 50%').split(' ').map(parseFloat);
        dragState.current = { startX: e.clientX, startY: e.clientY, x, y, w: e.currentTarget.clientWidth, h: e.currentTarget.clientHeight };
    };
    const onPointerMove = (e) => {
        const d = dragState.current;
        if (!d) return;
        const nx = Math.min(100, Math.max(0, d.x - ((e.clientX - d.startX) / d.w) * 100));
        const ny = Math.min(100, Math.max(0, d.y - ((e.clientY - d.startY) / d.h) * 100));
        onPositionChange(`${Math.round(nx)}% ${Math.round(ny)}%`);
    };
    const onPointerUp = () => { dragState.current = null; };

    const handleRemove = () => {
        onRemove();
        if (inputRef.current) inputRef.current.value = '';
    };

    return (
        <>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleSelect} />
            {src ? (
                <div className="space-y-2">
                    <div className="relative rounded-xl overflow-hidden border border-border/50 group">
                        <img src={src} alt="" draggable={false}
                            onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
                            style={{ objectPosition: position }}
                            className="w-full h-44 object-cover cursor-move select-none touch-none" />
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-black/50 text-white text-[11px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <Move className="w-3 h-3 inline mr-1 -mt-0.5" />{lang === 'el' ? 'Σύρε για επανατοποθέτηση' : 'Drag to reposition'}
                        </div>
                        <button type="button" onClick={handleRemove}
                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">{lang === 'el' ? 'Σύρε την εικόνα για να επιλέξεις το ορατό κομμάτι' : 'Drag the image to choose the visible part'}</p>
                        <button type="button" onClick={handleRemove} className="text-xs font-medium text-destructive hover:underline">
                            {lang === 'el' ? 'Αφαίρεση φωτογραφίας' : 'Remove photo'}
                        </button>
                    </div>
                </div>
            ) : (
                <button type="button" onClick={() => inputRef.current?.click()}
                    className="w-full h-28 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
                    <ImagePlus className="w-6 h-6" />
                    <span className="text-sm">{lang === 'el' ? 'Πρόσθεσε φωτογραφία (έως 5MB)' : 'Add a photo (up to 5MB)'}</span>
                </button>
            )}
        </>
    );
}
