import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'wedding_pwa_install_dismissed';
const DISMISS_TTL = 1000 * 60 * 60 * 24 * 7; // 7 days

/**
 * PWA install prompt — shows a Bali-themed "Add to Home Screen" banner
 * when the browser fires `beforeinstallprompt` (Chrome/Edge/Android).
 * The banner uses BALI-ICON.webp as the icon. Dismissals persist for 7 days.
 */
export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if user dismissed recently, or if already installed (display-mode: standalone)
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    const isRecentlyDismissed = Date.now() - dismissedAt < DISMISS_TTL;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true;
    if (isRecentlyDismissed || isStandalone) return;

    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile Chrome
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Delay banner so it doesn't fight with the envelope opening animation
      setTimeout(() => setVisible(true), 6000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setVisible(false);
      }
    } catch (err) {
      console.warn('PWA install prompt failed', err);
    } finally {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.95 }}
          transition={{ type: 'spring', damping: 24, stiffness: 280 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[110] w-[92%] max-w-md bg-[#151515]/95 backdrop-blur-md border-2 border-[#C5A059]/40 rounded-2xl shadow-[0_15px_50px_rgba(197,160,89,0.3)] p-4 flex items-center space-x-3"
        >
          {/* Bali icon */}
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#0A0A0A] border border-[#C5A059]/40 flex items-center justify-center overflow-hidden">
            <img
              src="/images/BALI-ICON.webp"
              alt="Wedding Icon"
              className="w-full h-full object-contain p-1.5"
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-serif text-sm font-bold text-[#F5F5F5] flex items-center space-x-1.5">
              <Smartphone className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Pasang di Perangkat Anda</span>
            </h4>
            <p className="text-[11px] text-[#E5E5E5]/80 leading-snug mt-0.5">
              Simpan undangan ini ke layar utama untuk akses cepat & notifikasi pengingat acara.
            </p>
          </div>

          <div className="flex flex-col space-y-1.5 flex-shrink-0">
            <button
              onClick={handleInstall}
              className="flex items-center space-x-1.5 py-1.5 px-3 rounded-lg bg-[#C5A059] hover:bg-[#b38e4b] text-black text-[10px] font-bold tracking-wider uppercase transition-all active:scale-95 cursor-pointer shadow-md"
            >
              <Download className="w-3 h-3" />
              <span>Pasang</span>
            </button>
            <button
              onClick={handleDismiss}
              className="text-[9px] text-gray-500 hover:text-white transition-colors cursor-pointer font-mono uppercase tracking-wider"
              aria-label="Tutup"
            >
              <X className="w-3 h-3 inline" /> Nanti
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
