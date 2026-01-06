import { cn } from './ui/utils';

type PageTransitionProps = {
  children: React.ReactNode;
  className?: string;
};

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <div className={cn('page-transition', className)}>
      {children}
    </div>
  );
}
