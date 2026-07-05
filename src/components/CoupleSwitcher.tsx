import { motion } from 'motion/react';
import { Heart } from 'lucide-react';

interface CoupleSwitcherProps {
  selectedCouple: 'coupleA' | 'coupleB' | 'both';
  setSelectedCouple: (couple: 'coupleA' | 'coupleB' | 'both') => void;
}

export default function CoupleSwitcher({ selectedCouple, setSelectedCouple }: CoupleSwitcherProps) {
  const options = [
    { id: 'coupleA' as const, label: 'Aria & Bella' },
    { id: 'both' as const, label: 'Kedua Mempelai' },
    { id: 'coupleB' as const, label: 'Devan & Elina' }
  ];

  return (
    <div id="couple-switcher-section" className="flex flex-col items-center justify-center my-8 px-4 w-full max-w-lg mx-auto">
      <span className="font-mono text-xs tracking-wider uppercase text-[#C5A059]/80 mb-3 text-center">
        Pilih Tampilan Undangan
      </span>
      <div className="relative flex p-1.5 bg-[#151515] rounded-full w-full border border-[#C5A059]/25 shadow-xl">
        {options.map((option) => {
          const isActive = selectedCouple === option.id;
          return (
            <button
              key={option.id}
              id={`btn-switch-${option.id}`}
              onClick={() => setSelectedCouple(option.id)}
              className={`relative flex-1 py-2.5 px-3 rounded-full text-xs md:text-sm font-medium tracking-wide transition-colors duration-300 focus:outline-none select-none z-10 flex items-center justify-center space-x-1.5 ${
                isActive
                  ? 'text-black font-bold'
                  : 'text-[#E5E5E5]/70 hover:text-white'
              }`}
            >
              {option.id === 'both' && <Heart className={`w-3.5 h-3.5 ${isActive ? 'fill-black text-black' : 'text-[#C5A059]'}`} />}
              <span>{option.label}</span>
              
              {isActive && (
                <motion.div
                  layoutId="active-couple-pill"
                  className="absolute inset-0 bg-gradient-to-r from-[#C5A059] to-[#E2C284] rounded-full -z-10"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  style={{
                    boxShadow: '0 4px 12px rgba(197, 160, 89, 0.3)'
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
      
      {/* Short descriptive text under switch */}
      <p className="mt-3 text-xs text-[#E5E5E5]/50 text-center italic">
        {selectedCouple === 'both' 
          ? 'Menampilkan informasi seluruh rangkaian acara dari kedua pasangan.'
          : `Menampilkan detail mempelai, akad, resepsi, dan hadiah untuk ${selectedCouple === 'coupleA' ? 'Aria & Bella' : 'Devan & Elina'}.`
        }
      </p>
    </div>
  );
}
