import { useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentColor = 'indigo' | 'emerald' | 'violet' | 'rose' | 'amber';

interface ThemeSwitcherProps {
  className?: string;
  onModeChange?: (mode: ThemeMode) => void;
  onAccentChange?: (accent: AccentColor) => void;
  showAccents?: boolean;
}

const modes: ThemeMode[] = ['light', 'dark', 'system'];
const accents: AccentColor[] = ['indigo', 'emerald', 'violet', 'rose', 'amber'];

const accentLabels: Record<AccentColor, string> = {
  indigo: 'Indigo',
  emerald: 'Emerald',
  violet: 'Violet',
  rose: 'Rose',
  amber: 'Amber',
};

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

function isAccentColor(value: string | null): value is AccentColor {
  return accents.some((accent) => accent === value);
}

export const ReactiveThemeSwitcher = ({
  className = '',
  onModeChange,
  onAccentChange,
  showAccents = true,
}: ThemeSwitcherProps) => {
  const [mode, setMode] = useState<ThemeMode>('system');
  const [accent, setAccent] = useState<AccentColor>('indigo');
  const [preferencesReady, setPreferencesReady] = useState(false);

  useEffect(() => {
    try {
      const savedMode = window.localStorage.getItem('chessstack-theme');
      const savedAccent = window.localStorage.getItem('chessstack-accent');
      if (isThemeMode(savedMode)) setMode(savedMode);
      if (isAccentColor(savedAccent)) setAccent(savedAccent);
    } catch (error) {
      console.warn('Unable to read saved appearance preferences.', error);
    } finally {
      setPreferencesReady(true);
    }
  }, []);

  useEffect(() => {
    if (!preferencesReady) return;

    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const applyMode = () => {
      const isDark = mode === 'dark' || (mode === 'system' && mediaQuery.matches);
      root.classList.toggle('dark', isDark);
      root.style.colorScheme = isDark ? 'dark' : 'light';
    };

    applyMode();
    mediaQuery.addEventListener('change', applyMode);
    try {
      window.localStorage.setItem('chessstack-theme', mode);
    } catch (error) {
      console.warn('Unable to save the appearance preference.', error);
    }

    return () => mediaQuery.removeEventListener('change', applyMode);
  }, [mode, preferencesReady]);

  useEffect(() => {
    if (!preferencesReady) return;

    document.documentElement.dataset.accent = accent;
    try {
      window.localStorage.setItem('chessstack-accent', accent);
    } catch (error) {
      console.warn('Unable to save the accent preference.', error);
    }
  }, [accent, preferencesReady]);

  const selectMode = (nextMode: ThemeMode) => {
    setMode(nextMode);
    onModeChange?.(nextMode);
  };

  const selectAccent = (nextAccent: AccentColor) => {
    setAccent(nextAccent);
    onAccentChange?.(nextAccent);
  };

  return (
    <div className={`appearance-controls ${className}`.trim()}>
      <div className="mode-control" role="group" aria-label="Color theme">
        {modes.map((item) => (
          <button
            key={item}
            type="button"
            className="mode-button"
            aria-pressed={mode === item}
            onClick={() => selectMode(item)}
          >
            {item.charAt(0).toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>
      {showAccents && (
        <div className="accent-control" role="group" aria-label="Accent color">
          {accents.map((item) => (
            <button
              key={item}
              type="button"
              className="accent-button"
              data-accent={item}
              aria-label={`${accentLabels[item]} accent`}
              aria-pressed={accent === item}
              title={accentLabels[item]}
              onClick={() => selectAccent(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReactiveThemeSwitcher;
