import { useState } from 'react';
import Layout from '../../components/common/Layout';
import { useTheme } from '../../context/ThemeContext';
import { FiCheck } from 'react-icons/fi';

const ThemeSettings = () => {
  const { currentTheme, changeTheme, themes } = useTheme();
  const [selected, setSelected] = useState(currentTheme);

  const categories = {
    'Professional': ['Clinical Blue', 'Corporate Blue', 'Executive Gray', 'Navy Pro', 'Clean White', 'Emerald Office', 'Platinum', 'Graphite', 'Royal Steel', 'Deep Indigo', 'Modern Black'],
    'Academic': ['Chalkboard Green', 'Classroom Blue', 'Notebook White', 'Library Brown', 'Campus Sky', 'Education Purple', 'Smart Orange', 'Oxford Theme', 'Harvard Red', 'Stanford Beige'],
    'Student': ['Neon Blue', 'Gamer Dark', 'Gradient Purple', 'Aqua Glow', 'Sunset Mix', 'Lime Pop', 'Candy Pink', 'Sky Pulse', 'Cosmic Night', 'Electric Cyan'],
    'Parent': ['Soft Gray', 'Warm White', 'Family Blue', 'Calm Green', 'Beige Classic'],
    'Dark': ['AMOLED Black', 'Midnight Blue', 'Cyber Dark', 'Carbon Gray', 'Dark Purple', 'Dark Forest', 'Dark Ocean', 'Dark Red', 'Black Gold', 'Hacker Green'],
    'Accessibility': ['High Contrast White', 'High Contrast Dark', 'Large Font Theme', 'Dyslexia Friendly', 'Color Blind Safe'],
  };

  const handleApply = (themeName) => {
    setSelected(themeName);
    changeTheme(themeName);
  };

  return (
    <Layout role="admin">
      <h1 className="text-3xl font-bold mb-6">Theme Settings</h1>
      <div className="space-y-8">
        {Object.entries(categories).map(([category, themeList]) => (
          <div key={category}>
            <h2 className="text-xl font-semibold mb-3">{category} Themes</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {themeList.map(themeName => {
                const theme = themes[themeName] || {};
                const isActive = selected === themeName;
                return (
                  <button
                    key={themeName}
                    onClick={() => handleApply(themeName)}
                    className={`relative p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                      isActive ? 'border-primary shadow-sm' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${theme['--color-bg'] || '#fff'} 0%, ${theme['--color-primary-light'] || '#ddd'} 100%)`,
                      color: theme['--color-text'] || '#000',
                    }}
                  >
                    <div className="text-sm font-medium">{themeName}</div>
                    <div className="flex gap-1 mt-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme['--color-primary'] || '#000' }}></div>
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme['--color-primary-light'] || '#666' }}></div>
                    </div>
                    {isActive && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white">
                        <FiCheck className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default ThemeSettings;
