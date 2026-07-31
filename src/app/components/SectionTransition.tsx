import { cn } from './ui/utils';

interface SectionTransitionProps {
  className?: string;
}

export function SectionTransition({ className }: SectionTransitionProps) {
  return (
    <div className={cn('section-transition', className)} aria-hidden="true">
      <span className="section-transition__glow" />
      <span className="section-transition__line" />
      <span className="section-transition__dot section-transition__dot--left" />
      <span className="section-transition__dot section-transition__dot--right" />
    </div>
  );
}
