import React from 'react';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: SelectOption[];
    error?: string;
    fullWidth?: boolean;
}

export const Select = ({
    label,
    options,
    error,
    fullWidth = true,
    className = '',
    id,
    ...props
}: SelectProps) => {
    const selectId = id || props.name;

    return (
        <div className={`${fullWidth ? 'w-full' : ''} mb-4`}>
            {label && (
                <label
                    htmlFor={selectId}
                    className="block text-xs font-medium text-gray-700 mb-1 ml-1"
                >
                    {label}
                </label>
            )}
            <div className="relative">
                <select
                    id={selectId}
                    className={`
            block w-full rounded-full border border-gray-200 bg-gray-50/50 
            px-4 py-2 text-sm text-gray-900 appearance-none
            focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary
            disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500
            ${error ? 'border-error ring-error focus:border-error focus:ring-error' : ''}
            ${className}
          `}
                    {...props}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                </div>
            </div>
            {error && (
                <p className="mt-1 text-xs text-error ml-1">{error}</p>
            )}
        </div>
    );
};
