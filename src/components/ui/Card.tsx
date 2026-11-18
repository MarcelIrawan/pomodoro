import type { JSX, ComponentChildren } from 'preact';
import { cn } from '../../utils/cn.ts';

export type CardProps = JSX.IntrinsicElements['div'] & {
  title?: string;
  subtitle?: string;
  children?: ComponentChildren;
};

export function Card({ title, subtitle, class: className, children, ...rest }: CardProps) {
  return (
    <div class={cn('card', className)} {...rest}>
      {title && (
        <header class="card__header">
          <h3 class="card__title">{title}</h3>
          {subtitle && <p class="card__subtitle">{subtitle}</p>}
        </header>
      )}
      <div class="card__body">{children}</div>
    </div>
  );
}
