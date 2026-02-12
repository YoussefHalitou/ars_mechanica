
import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Option {
    value: string;
    label: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export function SearchableSelect({ options, value, onChange, placeholder = "Auswählen...", className, disabled }: SearchableSelectProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find(o => o.value === value);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Focus input when opening
    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus();
        } else {
            setSearch(""); // Reset search when closed
        }
    }, [open]);

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className={cn("relative", className)} ref={containerRef}>
            <div
                onClick={() => !disabled && setOpen(!open)}
                className={cn(
                    "flex h-9 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer hover:bg-slate-50 transition-colors",
                    disabled && "cursor-not-allowed opacity-50",
                    open && "ring-2 ring-slate-200"
                )}
            >
                <span className={cn("truncate block", !selectedOption && "text-slate-500")}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                    {value && !disabled && (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange("");
                            }}
                            className="rounded-full p-0.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X className="h-3 w-3" />
                        </div>
                    )}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                </div>
            </div>

            {open && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in-0 zoom-in-95 duration-100">
                    <div className="sticky top-0 z-10 bg-white p-2 border-b border-slate-100">
                        <input
                            ref={inputRef}
                            type="text"
                            className="w-full rounded-sm border border-slate-200 bg-slate-50 px-2 py-1 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Suchen..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className="py-1">
                        {filteredOptions.length === 0 ? (
                            <div className="relative cursor-default select-none py-2 px-2 text-slate-500 text-center text-xs">
                                Keine Ergebnisse.
                            </div>
                        ) : (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.value}
                                    className={cn(
                                        "relative flex w-full cursor-pointer select-none items-center py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-slate-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                                        option.value === value && "bg-blue-50 text-blue-900 font-medium"
                                    )}
                                    onClick={() => {
                                        onChange(option.value);
                                        setOpen(false);
                                    }}
                                >
                                    <span className="truncate">{option.label}</span>
                                    {option.value === value && (
                                        <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                                            <Check className="h-4 w-4 text-blue-600" />
                                        </span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
