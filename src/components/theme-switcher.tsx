"use client";

import { useTheme, type Theme } from "@/components/theme-provider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: "default", label: "Default (Dark Violet)" },
  { value: "theme-dark-blue", label: "Dark Blue" },
  { value: "theme-forest", label: "Forest Green" },
  { value: "theme-sunset", label: "Sunset Orange" },
  { value: "theme-midnight-plum", label: "Midnight Plum" },
  { value: "theme-cyber-neon", label: "Cyber Neon" },
  { value: "theme-oceanic-deep", label: "Oceanic Deep" },
];

export function ThemeSwitcher() {
  const { theme, setTheme, isThemeInitialized } = useTheme();

  if (!isThemeInitialized) {
    // Render a placeholder while the theme is being initialized from localStorage
    // This prevents the Select component from initializing with potentially unstable props
    return (
      <div className="flex items-center space-x-2">
        <Label htmlFor="themeSelectorPlaceholder" className="text-sm text-[var(--admin-bar-fg)]">Theme:</Label>
        <div 
          id="themeSelectorPlaceholder" 
          className="w-[200px] h-8 bg-input border border-border rounded-md animate-pulse"
          aria-busy="true"
          aria-label="Loading theme selector"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Label htmlFor="themeSelector" className="text-sm text-[var(--admin-bar-fg)]">Theme:</Label>
      <Select
        value={theme}
        onValueChange={(value: string) => setTheme(value as Theme)}
        // No longer need disabled={!isThemeInitialized} as we don't render until initialized
      >
        <SelectTrigger id="themeSelector" className="w-[200px] h-8 text-xs bg-input border-border text-foreground focus:ring-ring">
          <SelectValue placeholder="Select theme" />
        </SelectTrigger>
        <SelectContent>
          {THEME_OPTIONS.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
