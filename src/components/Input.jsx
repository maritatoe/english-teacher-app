import React, { forwardRef } from 'react';

export const Input = forwardRef(({ label, id, className = '', error, ...props }, ref) => {
  const inputId = id || Math.random().toString(36).substring(7);
  
  return (
    <div className="form-group">
      {label && <label htmlFor={inputId} className="form-label">{label}</label>}
      <input
        ref={ref}
        id={inputId}
        className={`form-input ${className}`}
        {...props}
      />
      {error && <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';
