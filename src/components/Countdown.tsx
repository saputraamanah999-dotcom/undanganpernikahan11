import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface CountdownProps {
  /** Optional override target ISO date (used by MaintenanceScreen wrapper). */
  targetDate?: string;
  /** Optional label shown above the timer. */
  label?: string;
  /** Optional compact size for inline usage. */
  compact?: boolean;
}

function calculateTimeLeft(dateStr: string): TimeLeft {
  const difference = +new Date(dateStr) - +new Date();
  let timeLeft: TimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
  if (difference > 0) {
    timeLeft = {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }
  return timeLeft;
}

/**
 * Default Countdown — uses wedding_target_date in localStorage,
 * or falls back to coupleA akad date+time.
 */
export default function Countdown({ targetDate, label = 'Menuju Hari Bahagia', compact = false }: CountdownProps) {
  const [resolvedDate, setResolvedDate] = useState(() => {
    if (targetDate) return targetDate;
    return localStorage.getItem('wedding_target_date') || '2026-10-11T08:00:00';
  });

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(resolvedDate));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(resolvedDate));
    }, 1000);

    const handleDateUpdate = () => {
      const updatedDate = targetDate || localStorage.getItem('wedding_target_date') || '2026-10-11T08:00:00';
      setResolvedDate(updatedDate);
      setTimeLeft(calculateTimeLeft(updatedDate));
    };

    window.addEventListener('wedding_countdown_changed', handleDateUpdate);
    return () => {
      clearInterval(timer);
      window.removeEventListener('wedding_countdown_changed', handleDateUpdate);
    };
  }, [resolvedDate, targetDate]);

  if (!mounted) return null;

  const timerItems = [
    { label: 'Hari', value: timeLeft.days },
    { label: 'Jam', value: timeLeft.hours },
    { label: 'Menit', value: timeLeft.minutes },
    { label: 'Detik', value: timeLeft.seconds },
  ];

  if (compact) {
    return (
      <div className="flex justify-center space-x-2 md:space-x-3">
        {timerItems.map((item) => (
          <div key={item.label} className="flex flex-col items-center">
            <div className="relative w-12 h-14 md:w-14 md:h-16 bg-[#0A0A0A] rounded-lg shadow-xl border border-[#C5A059]/20 flex items-center justify-center overflow-hidden">
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={item.value}
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -12, opacity: 0 }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  className="font-serif text-lg md:text-xl font-bold text-[#C5A059] z-0"
                >
                  {String(item.value).padStart(2, '0')}
                </motion.span>
              </AnimatePresence>
            </div>
            <span className="mt-1 font-mono text-[9px] uppercase tracking-wider text-[#E5E5E5]/60">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      id="countdown-timer-container"
      className={`flex flex-col items-center justify-center ${label ? 'my-8 py-6 px-4 bg-[#151515] rounded-2xl border border-[#C5A059]/20 shadow-2xl max-w-lg mx-auto' : ''}`}
    >
      {label && (
        <h3 className="font-serif text-sm tracking-widest uppercase text-[#C5A059] font-medium mb-5">
          {label}
        </h3>
      )}
      <div className="flex space-x-3 md:space-x-4">
        {timerItems.map((item) => (
          <div
            key={item.label}
            id={`countdown-item-${item.label.toLowerCase()}`}
            className="flex flex-col items-center"
          >
            {/* Value Card */}
            <div className="relative w-16 h-18 md:w-20 md:h-22 bg-[#0A0A0A] rounded-xl shadow-2xl border border-[#C5A059]/20 flex items-center justify-center overflow-hidden">
              {/* Card Divider for Flip style */}
              <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-[#C5A059]/10 z-10" />

              <AnimatePresence mode="popLayout">
                <motion.span
                  key={item.value}
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -15, opacity: 0 }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  className="font-serif text-2xl md:text-3xl font-bold text-[#C5A059] z-0"
                >
                  {String(item.value).padStart(2, '0')}
                </motion.span>
              </AnimatePresence>

              {/* Subtlest shadow and glow */}
              <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-black/[0.2] to-transparent pointer-events-none" />
            </div>

            {/* Label */}
            <span className="mt-2 font-mono text-[10px] md:text-xs uppercase tracking-wider text-[#E5E5E5]/60">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
