import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart } from 'lucide-react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface CoupleCountdownProps {
  couple: 'coupleA' | 'coupleB';
  coupleName: string;
  /** ISO date string OR YYYY-MM-DD + HH:mm in WITA */
  targetDate: string;
  timeLabel: string;
  eventType: 'akad' | 'resepsi';
}

function calculate(dateStr: string): TimeLeft {
  const difference = +new Date(dateStr) - +new Date();
  if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

/**
 * Convert "YYYY-MM-DD" + "HH:mm - HH:mm WITA" → ISO date string
 */
function parseWitaStart(dateStr: string, timeRange: string): string {
  const match = timeRange.match(/(\d{1,2}):(\d{2})/);
  if (!match) return `${dateStr}T08:00:00+08:00`;
  const [, h, m] = match;
  return `${dateStr}T${h.padStart(2, '0')}:${m}:00+08:00`;
}

export default function CoupleCountdownCard({
  couple,
  coupleName,
  targetDate,
  timeLabel,
  eventType
}: CoupleCountdownProps) {
  const isoDate = parseWitaStart(targetDate, timeLabel);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculate(isoDate));

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calculate(isoDate)), 1000);
    return () => clearInterval(timer);
  }, [isoDate]);

  const items = [
    { label: 'Hari', value: timeLeft.days },
    { label: 'Jam', value: timeLeft.hours },
    { label: 'Menit', value: timeLeft.minutes },
    { label: 'Detik', value: timeLeft.seconds },
  ];

  const isPast = +new Date(isoDate) - +new Date() <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="bg-[#151515] rounded-2xl p-5 border border-[#C5A059]/20 shadow-2xl text-center"
    >
      <div className="flex items-center justify-center space-x-1.5 mb-3">
        <Heart className="w-3.5 h-3.5 text-[#C5A059] fill-[#C5A059]/20" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-[#C5A059] font-bold">
          {eventType === 'akad' ? 'Akad Nikah' : 'Resepsi'} — {coupleName}
        </span>
      </div>
      <p className="text-[10px] text-gray-500 font-mono mb-4">{timeLabel}</p>

      {isPast ? (
        <div className="py-4 px-2 rounded-xl bg-[#0A0A0A] border border-[#C5A059]/20">
          <p className="font-serif text-sm text-[#C5A059] italic">
            Acara sedang berlangsung / telah lewat
          </p>
        </div>
      ) : (
        <div className="flex justify-center space-x-2 md:space-x-3">
          {items.map((it) => (
            <div key={it.label} className="flex flex-col items-center">
              <div className="relative w-14 h-16 md:w-16 md:h-18 bg-[#0A0A0A] rounded-lg shadow-xl border border-[#C5A059]/20 flex items-center justify-center overflow-hidden">
                <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-[#C5A059]/10 z-10" />
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={it.value}
                    initial={{ y: 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -12, opacity: 0 }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                    className="font-serif text-xl md:text-2xl font-bold text-[#C5A059]"
                  >
                    {String(it.value).padStart(2, '0')}
                  </motion.span>
                </AnimatePresence>
              </div>
              <span className="mt-1.5 font-mono text-[9px] uppercase tracking-wider text-[#E5E5E5]/60">
                {it.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
