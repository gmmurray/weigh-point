import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  compact?: boolean;
}

export const Card = ({
  children,
  compact = false,
  className = '',
  ...props
}: CardProps) => {
  const classes = [
    'card bg-base-100 shadow-xl',
    compact ? 'card-compact' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...props}>
      <div className="card-body">{children}</div>
    </div>
  );
};

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export const CardTitle = ({ children, className = '' }: CardTitleProps) => {
  return <h2 className={`card-title ${className}`}>{children}</h2>;
};

interface CardActionsProps {
  children: ReactNode;
  className?: string;
}

export const CardActions = ({ children, className = '' }: CardActionsProps) => {
  return (
    <div className={`card-actions justify-end ${className}`}>{children}</div>
  );
};
