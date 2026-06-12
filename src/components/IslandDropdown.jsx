import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export default function IslandDropdown({ value, onValueChange, islands, placeholder, className }) {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        "flex h-9 w-full items-center justify-between rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm",
                        "focus:outline-none focus:ring-1 focus:ring-ring",
                        className
                    )}
                >
                    <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
                        {value || placeholder}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                className="p-0 z-[2000]"
                style={{ width: 'var(--radix-popover-trigger-width)' }}
                align="start"
                sideOffset={4}
            >
                <div className="max-h-48 overflow-y-auto p-1">
                    {islands.map(name => (
                        <button
                            key={name}
                            type="button"
                            onMouseDown={e => { e.preventDefault(); onValueChange(name); setOpen(false); }}
                            className="relative flex w-full items-center rounded-sm py-1.5 pl-2 pr-8 text-sm cursor-default hover:bg-accent hover:text-accent-foreground"
                        >
                            {name}
                            {value === name && (
                                <span className="absolute right-2 flex items-center">
                                    <Check className="h-4 w-4" />
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}
