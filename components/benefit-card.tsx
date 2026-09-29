import type { HTMLAttributes, ReactNode } from 'react';
import styles from './benefit-card.module.css';

type Props = HTMLAttributes<HTMLElement> & {
  title: string;
  visual: ReactNode;
  value?: string;
  variant?: 'story' | 'compact';
};

/** Shared brand/service card; animation belongs to the surrounding story. */
export function BenefitCard({ title, visual, value, variant = 'compact', children, className = '', ...props }: Props) {
  return <article {...props} className={`${styles.card} ${variant === 'compact' ? styles.compact : ''} ${className}`}>
    {visual}
    {value && <strong>{value}</strong>}
    <h3>{title}</h3>
    {children}
  </article>;
}
