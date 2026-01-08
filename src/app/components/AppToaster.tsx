import type { CSSProperties } from 'react';
import { Toaster as Sonner } from 'sonner';
import { useTheme } from '../hooks/useTheme';

export function AppToaster() {
  const { mode } = useTheme();

  return (
    <Sonner
      theme={mode}
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as CSSProperties
      }
    />
  );
}
