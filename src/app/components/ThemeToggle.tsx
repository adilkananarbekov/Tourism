import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { Button } from './ui/button';

export function ThemeToggle() {
  const { mode, toggle } = useTheme();

  return (
    <Button
      onClick={toggle}
      variant="outline"
      className="btn-micro h-9 w-9 rounded-full border-border bg-card text-foreground"
      aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
    >
      {mode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
