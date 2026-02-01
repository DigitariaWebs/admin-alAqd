'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface CollapsibleProps {
    isOpen: boolean;
    children: React.ReactNode;
    className?: string;
}

export const Collapsible: React.FC<CollapsibleProps> = ({
    isOpen,
    children,
    className = '',
}) => {
    return (
        <AnimatePresence initial={false}>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className={`overflow-hidden ${className}`}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
};
