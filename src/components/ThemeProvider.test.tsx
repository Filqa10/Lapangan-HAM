import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeProvider';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Polyfill localStorage for testing if jsdom doesn't have it
if (typeof window !== 'undefined' && !window.localStorage) {
  const store: Record<string, string> = {};
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = String(value); },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { Object.keys(store).forEach(key => delete store[key]); },
      length: 0,
      key: () => null,
    },
    writable: true
  });
}

function TestComponent() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-val">{theme}</span>
      <button data-testid="toggle-btn" onClick={toggleTheme}>Toggle</button>
    </div>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.className = '';
    vi.restoreAllMocks();
  });

  it('defaults to light theme', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-val')).toHaveTextContent('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('toggles theme when button is clicked', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const toggleBtn = screen.getByTestId('toggle-btn');
    const themeVal = screen.getByTestId('theme-val');

    expect(themeVal).toHaveTextContent('light');

    // Click to dark
    fireEvent.click(toggleBtn);
    expect(themeVal).toHaveTextContent('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(window.localStorage.getItem('theme')).toBe('dark');

    // Click back to light
    fireEvent.click(toggleBtn);
    expect(themeVal).toHaveTextContent('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(window.localStorage.getItem('theme')).toBe('light');
  });

  it('reads initial theme from localStorage', () => {
    window.localStorage.setItem('theme', 'dark');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-val')).toHaveTextContent('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
