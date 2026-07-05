import { motion } from 'motion/react';
import { Heart, Sparkles, Clock, MapPin } from 'lucide-react';
import { weddingData } from '../data/weddingData';

interface TimelineRundownProps {
  selectedCouple: 'coupleA' | 'coupleB' | 'both';
  weddingData: any;
}

export default function TimelineRundown({ selectedCouple, weddingData }: TimelineRundownProps) {
  // Filter timeline based on selection
  const filteredEvents = (weddingData?.timeline || []).filter(event => {
    if (selectedCouple === 'both') return true;
    return event.couple === selectedCouple;
  });

  return (
    <div id="timeline-rundown-section" className="py-12 px-4 max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <span className="font-mono text-xs tracking-widest text-[#C5A059] uppercase block mb-1">
          RUNDOWN ACARA
        </span>
        <h3 className="font-serif text-2xl md:text-3xl font-semibold text-[#F5F5F5]">
          Agenda Hari Bahagia
        </h3>
        <p className="mt-2 text-xs md:text-sm text-[#E5E5E5]/70 max-w-md mx-auto italic">
          Rangkaian prosesi pernikahan suci dan syukuran bersama yang tertib dan khidmat.
        </p>
      </div>

      <div className="relative border-l-2 border-[#C5A059]/30 ml-4 md:ml-32 pl-6 md:pl-8 space-y-10">
        {filteredEvents.map((event, index) => {
          const coupleMeta = event.couple === 'coupleA' ? weddingData?.coupleA : weddingData?.coupleB;
          const coupleName = `${coupleMeta?.groom?.nickname || ''} & ${coupleMeta?.bride?.nickname || ''}`;
          const isCoupleA = event.couple === 'coupleA';

          return (
            <motion.div
              key={index}
              id={`timeline-event-${index}`}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="relative"
            >
              {/* Timeline Dot/Icon */}
              <div className="absolute -left-11 md:-left-[41px] top-1.5 flex items-center justify-center w-8 h-8 rounded-full bg-[#0A0A0A] border-2 border-[#C5A059] shadow-2xl">
                {event.type === "Akad Nikah" ? (
                  <Heart className="w-4 h-4 text-[#C5A059] fill-[#C5A059]/20" />
                ) : (
                  <Sparkles className="w-4 h-4 text-[#C5A059] fill-[#C5A059]/10" />
                )}
              </div>

              {/* Desktop Side Timing Column */}
              <div className="hidden md:block absolute -left-44 top-2 w-32 text-right">
                <span className="font-mono text-xs font-semibold text-[#C5A059] block">
                  {event.time}
                </span>
                <span className="text-[10px] text-gray-500 font-mono">
                  WIB
                </span>
              </div>

              {/* Event Main Card */}
              <div className="bg-[#151515] p-5 rounded-2xl border border-[#C5A059]/15 shadow-2xl hover:border-[#C5A059]/40 transition-all duration-300 group">
                {/* Header with mobile time & badge */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-1.5 md:hidden">
                    <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span className="font-mono text-xs font-bold text-[#C5A059]">
                      {event.time} WIB
                    </span>
                  </div>

                  {/* Couple Badge */}
                  {selectedCouple === 'both' && (
                    <span
                      className="text-[10px] font-mono tracking-wide px-2.5 py-1 rounded-full uppercase font-medium bg-[#0A0A0A] text-[#C5A059] border border-[#C5A059]/30"
                    >
                      Pernikahan {coupleName}
                    </span>
                  )}
                </div>

                {/* Title & Desc */}
                <h4 className="font-serif text-base md:text-lg font-bold text-[#F5F5F5] group-hover:text-[#C5A059] transition-colors">
                  {event.title}
                </h4>
                
                <p className="mt-1 text-xs md:text-sm text-[#E5E5E5]/70 leading-relaxed">
                  {event.desc}
                </p>

                {/* Short Venue Info */}
                <div className="mt-3 pt-3 border-t border-[#C5A059]/10 flex items-center space-x-1 text-gray-500">
                  <MapPin className="w-3.5 h-3.5 text-[#C5A059]/70" />
                  <span className="text-[11px] font-mono tracking-tight text-[#C5A059]/80">
                    {event.type === 'Akad Nikah' ? coupleMeta.akad.venue : coupleMeta.resepsi.venue}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
