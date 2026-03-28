import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

// ------------------------------------------------------------------
// Componente
// ------------------------------------------------------------------
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <motion.button
      id="theme-toggle"
      onClick={toggleTheme}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative p-3 rounded-xl glass-panel hover:bg-white/10 transition-all"
      aria-pressed={isDark}
      aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
    >
      {/* Icono Luna (modo oscuro) */}
      <motion.div
        initial={false}
        animate={{
          rotate: isDark ? 0 : 180,
          scale: isDark ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <Moon className="w-5 h-5 text-primary-glow" />
      </motion.div>

      {/* Icono Sol (modo claro) */}
      <motion.div
        initial={false}
        animate={{
          rotate: isDark ? -180 : 0,
          scale: isDark ? 0 : 1,
        }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-center"
        aria-hidden="true"
      >
        <Sun className="w-5 h-5 text-yellow-400" />
      </motion.div>
    </motion.button>
  );
}
