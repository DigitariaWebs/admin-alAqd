import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    fullWidth?: boolean;
}

export const Textarea = ({
    label,
    error,
    fullWidth = true,
    className = '',
    id,
    ...props
}: TextareaProps) => {
    const textareaId = id || props.name;

    return (
        <div className={`${fullWidth ? 'w-full' : ''} mb-4`}>
            {label && (
                <label
                    htmlFor={textareaId}
                    className="block text-xs font-medium text-gray-700 mb-1 ml-1"
                >
                    {label}
                </label>
            )}
            <textarea
                id={textareaId}
                className={`
          block w-full rounded-[20px] border border-gray-200 bg-gray-50/50 
          px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400
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
        </div>
    );
};
