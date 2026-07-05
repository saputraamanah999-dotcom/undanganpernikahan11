import React, { useState, useEffect } from 'react';
import { Bell, BellRing, BellOff, Volume2, ShieldCheck, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Crystalline Cathedral Bell Chord Synthesizer using Web Audio API (Offline-first, flawless)
export const playChimeSound = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    const playTone = (freq: number, delay: number, duration: number, vol: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      
      // Gentle chime envelope (fast attack, smooth exponential decay)
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + delay + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration);
    };

    // Golden wedding chime chord sequence (G5, C6, E6)
    playTone(783.99, 0, 1.5, 0.15); // G5
    playTone(1046.50, 0.12, 1.8, 0.15); // C6
    playTone(1318.51, 0.24, 2.0, 0.12); // E6
  } catch (err) {
    console.warn("AudioContext blocked or failed", err);
  }
};

export default function NotificationPrompt() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showBanner, setShowBanner] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      
      // Auto show banner if permission is not granted/denied yet
      if (Notification.permission === 'default') {
        const timer = setTimeout(() => setShowBanner(true), 4000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleRequestPermission = async () => {
    if (!('Notification' in window)) {
      setFeedback('Browser ini tidak mendukung notifikasi.');
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        playChimeSound();
        setFeedback('Notifikasi Berhasil Diaktifkan! 🔔');
        setTimeout(() => {
          setShowBanner(false);
          setFeedback(null);
        }, 2000);
      } else {
        setFeedback('Izin notifikasi ditolak.');
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err) {
      console.error('Error requesting permission', err);
    }
  };

  const handleTestNotification = () => {
    // 1. Play crystalline chime instantly
    playChimeSound();
    setFeedback('Memutar suara & mengirim notifikasi uji coba...');

    // 2. Schedule Service Worker background notification after 2.5 seconds
    setTimeout(() => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title: 'Simulasi Pengingat Pernikahan 🔔',
          message: 'Ini adalah uji coba notifikasi berkala (H-7/H-1/Hari H). Selamat datang di perayaan bersama kami!',
          sender: 'Keluarga Besar',
          audience: 'all',
          icon: '/images/BALI-ICON.webp'
        });
      } else {
        // Fallback local notification
        if (Notification.permission === 'granted') {
          new Notification('Keluarga Besar: Simulasi Pengingat Pernikahan 🔔', {
            body: 'Ini adalah uji coba notifikasi berkala (H-7/H-1/Hari H). Selamat datang di perayaan bersama kami!',
            icon: '/images/BALI-ICON.webp'
          });
        }
      }
      setFeedback('Notifikasi dikirim! Silakan periksa layar kunci atau pusat notifikasi Anda.');
      setTimeout(() => setFeedback(null), 4000);
    }, 2000);
  };

  return (
    <div id="notification-prompt-container" className="max-w-xl mx-auto px-4 py-8">
      <AnimatePresence>
        {showBanner && permission === 'default' && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-5 rounded-2xl bg-[#151515] border border-[#C5A059]/35 shadow-2xl space-y-4 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#C5A059]/5 to-transparent rounded-bl-full pointer-events-none" />
            
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059] animate-pulse">
                <BellRing className="w-6 h-6" />
              </div>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-serif text-base font-bold text-[#F5F5F5] flex items-center justify-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-[#C5A059]" />
                <span>Aktifkan Pengingat Pernikahan</span>
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed max-w-sm mx-auto">
                Dapatkan notifikasi timeline penting (H-7, H-1, & Hari H) langsung di perangkat Anda agar tidak ketinggalan momen suci kami.
              </p>
            </div>

            <div className="flex items-center justify-center space-x-3 pt-1">
              <button
                type="button"
                onClick={handleRequestPermission}
                className="fx-btn-shine-sweep py-2 px-6 rounded-lg text-xs font-bold tracking-wide uppercase transition-all shadow-md hover:scale-103 active:scale-97 cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #C5A059, #E2C284)',
                  color: '#000',
                  boxShadow: '0 4px 15px -4px rgba(197,160,89,0.5)'
                }}
              >
                Aktifkan Sekarang
              </button>
              <button
                type="button"
                onClick={() => setShowBanner(false)}
                className="py-2 px-4 rounded-lg text-xs font-semibold text-gray-500 hover:text-white transition-all cursor-pointer"
              >
                Nanti Saja
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Embedded Permanent Control Card (Design Integration) */}
      <div className="p-6 rounded-2xl bg-[#151515] border border-[#C5A059]/15 shadow-xl space-y-4 relative overflow-hidden">
        <div className="flex items-start justify-between space-x-4">
          <div className="space-y-1">
            <span className="font-mono text-[9px] tracking-widest text-[#C5A059] uppercase block font-semibold">
              EVENT REMINDERS / PENGINGAT
            </span>
            <h4 className="font-serif text-lg font-bold text-[#F5F5F5] flex items-center space-x-1.5">
              <Bell className="w-4 h-4 text-[#C5A059]" />
              <span>Sistem Notifikasi Tamu</span>
            </h4>
            <p className="text-xs text-gray-400 leading-normal">
              Status Notifikasi Saat Ini: {' '}
              <span className={`font-bold font-mono uppercase px-2 py-0.5 rounded text-[10px] border ${
                permission === 'granted' 
                  ? 'bg-emerald-950/35 text-emerald-400 border-emerald-500/30' 
                  : permission === 'denied'
                  ? 'bg-red-950/35 text-red-400 border-red-500/30'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-700/50'
              }`}>
                {permission === 'granted' ? 'Aktif (Granted)' : permission === 'denied' ? 'Ditolak (Denied)' : 'Belum Ditentukan'}
              </span>
            </p>
          </div>
          
          <div className="p-3 bg-[#0A0A0A] rounded-xl border border-white/5 text-[#C5A059]">
            {permission === 'granted' ? <BellRing className="w-5 h-5 animate-bounce" /> : <BellOff className="w-5 h-5" />}
          </div>
        </div>

        <p className="text-xs text-gray-400 leading-relaxed font-sans">
          Mendukung notifikasi latar belakang (background push) menggunakan Service Worker. Anda akan dikirimi notifikasi H-7, H-1, dan Hari H secara otomatis dengan nada chime yang merdu.
        </p>

        <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-1.5 text-[11px] text-[#C5A059] font-mono">
            <Volume2 className="w-4 h-4 animate-pulse" />
            <span>Melodi Chime Gereja Terintegrasi</span>
          </div>

          <div className="flex items-center space-x-2">
            {(permission === 'default' || permission === 'denied') && (
              <button
                type="button"
                onClick={handleRequestPermission}
                className="flex-1 sm:flex-initial py-2 px-4 bg-[#C5A059] hover:bg-[#b38e4b] text-black text-xs font-bold rounded-lg uppercase tracking-wide transition-all cursor-pointer shadow-md"
              >
                Izinkan Notifikasi
              </button>
            )}
            
            <button
              type="button"
              onClick={() => {
                playChimeSound();
                setFeedback('Melodi chime pengingat dimainkan dengan sukses.');
                setTimeout(() => setFeedback(null), 3000);
              }}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 py-2 px-4 bg-[#0A0A0A] hover:bg-white/5 border border-[#C5A059]/30 hover:border-[#C5A059] text-[#C5A059] hover:text-white text-xs font-bold rounded-lg uppercase tracking-wide transition-all cursor-pointer"
              title="Uji Melodi Pengingat Suci"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Uji Melodi</span>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 text-[11px] text-center font-mono text-[#C5A059] bg-[#C5A059]/10 border border-[#C5A059]/20 p-2 rounded-lg leading-relaxed"
            >
              {feedback}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
