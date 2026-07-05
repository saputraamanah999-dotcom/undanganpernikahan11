import { useState, useEffect } from 'react';
import { Palette, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ThemePreset {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accentClass: string;
}

interface ThemeSwitcherProps {
  currentTheme: string;
  onChangeTheme: (themeId: string) => void;
}

export const themes: ThemePreset[] = [
  {
    id: 'plum-gold',
    name: 'Royal Plum & Gold',
    primary: '#633750', // Deep Plum
    secondary: '#C5A059', // Gold
    accentClass: 'bg-[#633750]'
  },
  {
    id: 'sage-cream',
    name: 'Sage Green & Cream',
    primary: '#3C4E43', // Sage
    secondary: '#D4AF37', // Warm Gold
    accentClass: 'bg-[#3C4E43]'
  },
  {
    id: 'navy-rose',
    name: 'Midnight Navy & Rose',
    primary: '#0B132B', // Midnight Navy
    secondary: '#E0A96D', // Rose Gold
    accentClass: 'bg-[#0B132B]'
  },
  {
    id: 'ivory-blush',
    name: 'Ivory & Blush',
    primary: '#4D243D', // Soft Plum/Burgundy
    secondary: '#D5A6BD', // Rose Pink
    accentClass: 'bg-[#4D243D]'
  }
];

export default function ThemeSwitcher({ currentTheme, onChangeTheme }: ThemeSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div id="theme-switcher-container" className="fixed bottom-6 left-6 md:bottom-8 md:left-8 z-45">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="theme-switcher-panel"
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="absolute bottom-16 left-0 bg-[#151515] border border-gold/30 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] p-4 min-w-[240px] space-y-3 select-none"
          >
            <div className="flex items-center justify-between border-b border-gold/10 pb-2">
              <span className="font-display text-xs tracking-wider text-[#F5F5F5] font-semibold flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-gold animate-pulse" />
                <span>Pilih Tema Warna</span>
              </span>
              <span className="text-[9px] font-mono text-gold/60 uppercase">4 Presets</span>
            </div>

            <div className="space-y-1.5">
              {themes.map((theme) => {
                const isActive = currentTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => {
                      onChangeTheme(theme.id);
                      // Visual micro-vibrate if supported
                      if (navigator.vibrate) navigator.vibrate(20);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl border transition-all text-left group cursor-pointer ${
                      isActive
                        ? 'border-gold bg-gold/10 text-white'
                        : 'border-white/5 hover:border-gold/20 bg-white/[0.02] text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      {/* Theme Palette Indicator Dots */}
                      <div className="flex space-x-1">
                        <div
                          className="w-3 h-3 rounded-full border border-white/20"
                          style={{ backgroundColor: theme.primary }}
                        />
                        <div
                          className="w-3 h-3 rounded-full border border-white/20"
                          style={{ backgroundColor: theme.secondary }}
                        />
                      </div>
                      <span className="text-[11px] font-sans tracking-wide font-medium">
                        {theme.name}
                      </span>
                    </div>

                    {isActive && <Check className="w-3.5 h-3.5 text-gold" />}
                  </button>
                );
              })}
            </div>
            
            <p className="text-[9px] text-gray-500 text-center leading-normal italic pt-1">
              *Aksen warna, latar, dan ornamen akan berganti seketika.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        id="btn-theme-switcher-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-13 h-13 md:w-14 md:h-14 rounded-full bg-[#151515] border shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex items-center justify-center transition-all duration-300 hover:scale-108 active:scale-95 cursor-pointer group ${
          isOpen ? 'border-gold text-white' : 'border-gold/40 text-gold hover:text-white'
        }`}
        title="Ubah Tema Warna"
      >
        <Palette className="w-5 h-5 transition-transform group-hover:rotate-12" />
      </button>
    </div>
  );
}
