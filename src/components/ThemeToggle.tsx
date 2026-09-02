import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-secondary/90 backdrop-blur-md border border-border text-foreground hover:bg-primary hover:text-white hover:scale-110 transition-all shadow-lg hover:shadow-primary/25"
      title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
    >
      {theme === 'light' ? (
        <Moon size={22} className="text-violet-600" />
      ) : (
        <Sun size={22} className="text-amber-400" />
      )}
    </button>
  );
}
