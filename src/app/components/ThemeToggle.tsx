import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function ThemeToggle() {
  const { mode, preference, setPreference } = useTheme();
  const Icon = preference === 'system' ? Monitor : mode === 'dark' ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="btn-micro h-9 w-9 rounded-full border-border bg-card text-foreground"
          aria-label="Choose color theme"
          title="Choose color theme"
          data-track-event="theme_menu_open"
          data-track-label="Theme menu"
        >
          <Icon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={preference} onValueChange={(value) => {
          if (value === 'system' || value === 'light' || value === 'dark') {
            setPreference(value);
          }
        }}>
          <DropdownMenuRadioItem
            value="system"
            data-track-event="theme_preference_select"
            data-track-label="system"
          >
            <Monitor className="h-4 w-4" />
            System
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value="light"
            data-track-event="theme_preference_select"
            data-track-label="light"
          >
            <Sun className="h-4 w-4" />
            Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value="dark"
            data-track-event="theme_preference_select"
            data-track-label="dark"
          >
            <Moon className="h-4 w-4" />
            Dark
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
