'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';

interface Option {
    value: string;
    label: string;
}

interface MultiSelectProps {
    label?: string;
    options: Option[];
    value?: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    fullWidth?: boolean;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
    label,
    options,
    value = [],
    onChange,
    placeholder = 'Select...',
    fullWidth = true,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleOption = (optionValue: string) => {
        if (value.includes(optionValue)) {
            onChange(value.filter(v => v !== optionValue));
        } else {
            onChange([...value, optionValue]);
        }
    };

    const removeOption = (optionValue: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(value.filter(v => v !== optionValue));
    };

    return (
        <div className={`${fullWidth ? 'w-full' : ''} mb-4 relative`} ref={dropdownRef}>
            {label && (
                <label className="block text-xs font-medium text-gray-700 mb-1 ml-1">
                    {label}
                </label>
            )}
            <div
                className={`
                    min-h-[42px] w-full rounded-[20px] border border-gray-200 bg-gray-50/50 
                    px-4 py-2 flex items-center justify-between cursor-pointer
                    focus:border-primary focus:bg-white focus:outline-none ring-offset-2
                    ${isOpen ? 'border-primary ring-1 ring-primary bg-white' : ''}
                `}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex flex-wrap gap-2">
                    {value.length === 0 && (
                        <span className="text-gray-400 text-sm">{placeholder}</span>
                    )}
                    {value.map(val => {
                        const option = options.find(o => o.value === val);
                        return (
                            <span
                                key={val}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary border border-primary-100"
                            >
                                {option?.label || val}
                                <button
                                    onClick={(e) => removeOption(val, e)}
                                    className="ml-1.5 inline-flex items-center justify-center rounded-full text-primary hover:bg-primary-100 hover:text-primary-700 focus:outline-none"
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        );
                    })}
                </div>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white rounded-2xl shadow-lg border border-gray-100 max-h-60 overflow-y-auto">
                    {options.map((option) => (
                        <div
                            key={option.value}
                            className={`
                                px-4 py-2 text-sm cursor-pointer hover:bg-gray-50 flex items-center justify-between
                                ${value.includes(option.value) ? 'bg-primary-50 text-primary' : 'text-gray-900'}
                            `}
                            onClick={() => toggleOption(option.value)}
                        >
                            <span>{option.label}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
