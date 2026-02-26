import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    fullWidth?: boolean;
}

export const Input = ({
    label,
    error,
    helperText,
    fullWidth = true,
    className = '',
    id,
    ...props
}: InputProps) => {
    const inputId = id || props.name;

    return (
        <div className={`${fullWidth ? 'w-full' : ''} mb-4`}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-xs font-medium text-gray-700 mb-1 ml-1"
                >
                    {label}
                </label>
            )}
            <input
                id={inputId}
                className={`
          block w-full rounded-full border border-gray-200 bg-gray-50/50 
          px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400
          focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary
          disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500
          ${error ? 'border-error ring-error focus:border-error focus:ring-error' : ''}
          ${className}
        `}
                {...props}
            />
            {error && (
                <p className="mt-1 text-xs text-error ml-1">{error}</p>
            )}
            {helperText && !error && (
                <p className="mt-1 text-xs text-gray-500 ml-1">{helperText}</p>
            )}
        </div>
    );
};
