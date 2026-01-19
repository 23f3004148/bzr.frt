import React from 'react';

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export const Card: React.FC<CardProps> = ({ className = '', children, ...rest }) => {
  const classes = className
    ? `rounded-2xl border border-gray-200 bg-white p-4 shadow-sm ${className}`
    : 'rounded-2xl border border-gray-200 bg-white p-4 shadow-sm';

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
};
