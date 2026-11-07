import { useEffect, useRef, useState } from 'react';
import ReactiveThemeSwitcher from './themes.js';

export default function NavMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setIsOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div className="nav-menu" ref={menuRef}>
      <button
        ref={triggerRef}
        type="button"
        className="nav-menu-trigger"
        aria-expanded={isOpen}
        aria-controls="nav-appearance-panel"
        aria-label={isOpen ? 'Close appearance settings' : 'Open appearance settings'}
        onClick={() => setIsOpen((open) => !open)}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.6 2.77-.08-.02a1.7 1.7 0 0 0-1.8.68l-.04.07h-3.2l-.04-.07a1.7 1.7 0 0 0-1.8-.68l-.08.02-1.6-2.77.06-.06A1.7 1.7 0 0 0 9.96 15l-.08-.04v-3.2l.08-.04a1.7 1.7 0 0 0-.34-1.88l-.06-.06 1.6-2.77.08.02a1.7 1.7 0 0 0 1.8-.68l.04-.07h3.2l.04.07a1.7 1.7 0 0 0 1.8.68l.08-.02 1.6 2.77-.06.06A1.7 1.7 0 0 0 19.46 12l.08.04v3.2z" />
        </svg>
        <span className="nav-menu-chevron" aria-hidden="true">
          {isOpen ? '⌃' : '⌄'}
        </span>
      </button>
      {isOpen && (
        <div
          id="nav-appearance-panel"
          className="nav-menu-panel"
          aria-label="Appearance settings"
        >
          <p className="nav-menu-heading">Appearance</p>
          <ReactiveThemeSwitcher
            className="nav-appearance-controls"
            showAccents
          />
        </div>
      )}
    </div>
  );
}