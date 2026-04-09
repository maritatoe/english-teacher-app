import React from 'react';

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.625rem 1rem',
    borderRadius: 'var(--radius-md)',
    fontWeight: '500',
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: 'none',
  };

  const variants = {
    primary: {
      backgroundColor: 'var(--color-primary)',
      color: 'white',
    },
    danger: {
      backgroundColor: 'var(--color-danger)',
      color: 'white',
    },
    outline: {
      backgroundColor: 'transparent',
      border: '1px solid var(--color-border)',
      color: 'var(--color-text)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--color-text-light)',
    }
  };

  return (
    <button 
      style={{ ...baseStyle, ...variants[variant] }} 
      className={className} 
      {...props}
    >
      {children}
    </button>
  );
}
