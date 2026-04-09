import React from 'react';

export function Card({ children, className = '', ...props }) {
  const style = {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-md)',
    padding: 'var(--space-4)',
    border: '1px solid var(--color-border)',
  };

  return (
    <div style={style} className={className} {...props}>
      {children}
    </div>
  );
}
