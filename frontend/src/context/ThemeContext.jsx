import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import themes from '../themes/themeDefinitions';
import { hexToRgb } from '../utils/colorUtils';
import { generatePalette } from '../utils/colorUtils';

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children, initialTheme = 'Clinical Blue' }) => {
  const [currentTheme, setCurrentTheme] = useState(initialTheme);

 /* useEffect(() => {
  const root = document.documentElement;
  const theme = themes[currentTheme] || themes['Corporate Blue'];

  // Remove old variables (optional, but clean)
  for (let i = 50; i <= 900; i += 100) {
    root.style.removeProperty(`--color-primary-${i}`);
  }

  // Generate full palette from the two base colors
  const primary = theme['--color-primary'];
  const primaryLight = theme['--color-primary-light'];
  const palette = generatePalette(primary, primaryLight);
  Object.entries(palette).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  // Also set the old --color-primary and --color-primary-light for any direct usage
  root.style.setProperty('--color-primary', primary);
  root.style.setProperty('--color-primary-light', primaryLight);

  // Dark mode
  if (theme.dark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}, [currentTheme]);*/
  useEffect(() => {
  const root = document.documentElement;
  const theme = themes[currentTheme] || themes['Clinical Blue'];

  // Generate full primary palette
  const palette = generatePalette(
    theme['--color-primary'],
    theme['--color-primary-light']
  );
  Object.entries(palette).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  // Also set surface colors that our CSS override uses
  root.style.setProperty('--color-bg', theme['--color-bg'] || '#ffffff');
  root.style.setProperty('--color-surface', theme['--color-surface'] || '#ffffff');
  root.style.setProperty('--color-text', theme['--color-text'] || '#000000');
  root.style.setProperty('--color-text-secondary', theme['--color-text-secondary'] || '#666666');
  root.style.setProperty('--color-border', theme['--color-border'] || '#cccccc');

  // Dark mode class
  if (theme.dark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}, [currentTheme]);

  const changeTheme = async (themeName) => {
    try {
      await api.put('/profile/theme', { theme: themeName });
      setCurrentTheme(themeName);
    } catch (error) {
      console.error('Failed to save theme', error);
    }
  };


const generateShades = (hex, lightHex) => {
  // Simple palette: 50 = lightest, 900 = darkest
  // We'll mix white into the base for lighter shades and black for darker ones.
  // For simplicity, we predefine reasonable RGB values based on the two given hex.
  // In a real app you'd use a proper shade generator, but this works.
  const baseRgb = hexToRgb(hex);
  const lightRgb = hexToRgb(lightHex);
  // ... produce shades ...
};


  return (
    <ThemeContext.Provider value={{ currentTheme, changeTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
};
