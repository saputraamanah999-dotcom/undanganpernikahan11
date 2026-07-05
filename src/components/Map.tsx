import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Navigation, ExternalLink, Loader2 } from 'lucide-react';

interface MapProps {
  address: string;
  venue: string;
  mapsLink: string;
  className?: string;
}

export default function Map({ address, venue, mapsLink, className = "" }: MapProps) {
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Custom encoded URL for Google Maps embed (with full standard compliance)
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(venue + ", " + address)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;

  return (
    <div 
      id="mapcn-wrapper" 
      className={`w-full rounded-2xl overflow-hidden border border-[#C5A059]/20 shadow-inner bg-[#0A0A0A] relative flex flex-col ${className}`}
      style={{ minHeight: '320px', maxWidth: '100%' }}
    >
      {/* Premium Dark Glass Skeleton Loader */}
      <AnimatePresence>
        {!mapLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-gradient-to-b from-[#0F0F0F] to-[#050505] flex flex-col items-center justify-center space-y-4 z-10 p-4"
          >
            {/* Pulsing map locator circle */}
            <div className="relative flex items-center justify-center">
              <div className="absolute w-12 h-12 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/30 animate-ping" />
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#C5A059] to-[#E2C284] flex items-center justify-center text-black shadow-lg">
                <MapPin className="w-5 h-5 animate-bounce" />
              </div>
            </div>
            
            <div className="space-y-1 text-center">
              <p className="text-[10px] md:text-xs text-[#C5A059] font-mono font-bold tracking-widest uppercase">
                Menginisialisasi Peta Lokasi
              </p>
              <div className="flex items-center justify-center space-x-1.5 text-gray-500 font-mono text-[9px]">
                <Loader2 className="w-3 h-3 animate-spin text-[#C5A059]" />
                <span>Menghubungkan ke Google Maps API...</span>
              </div>
            </div>

            {/* Simulated interactive elements skeleton */}
            <div className="w-4/5 max-w-xs h-3 bg-zinc-900 rounded-full overflow-hidden relative">
              <div className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-transparent via-[#C5A059]/20 to-transparent animate-shimmer" 
                style={{ animation: 'shimmer 1.5s infinite' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Map Canvas Iframe */}
      <div className="flex-1 w-full h-full relative" style={{ minHeight: '280px' }}>
        <iframe
          src={mapEmbedUrl}
          width="100%"
          height="100%"
          style={{ 
            border: 0,
            filter: "invert(90%) hue-rotate(180deg) brightness(0.85) contrast(1.15) saturate(0.65)",
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%'
          }}
          onLoad={() => setMapLoaded(true)}
          allowFullScreen={false}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Mapcn Map Location Canvas"
          className="w-full h-full transition-opacity duration-1000 ease-in-out"
        />
      </div>

      {/* Embedded footer control area for flawless small-device scaling */}
      <div className="p-3 bg-[#0C0C0C] border-t border-[#C5A059]/15 flex items-center justify-between gap-2.5 z-20">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider leading-none">VIRTUAL COORDINATES</p>
          <p className="text-xs text-[#E5E5E5] font-semibold truncate mt-1">
            {venue}
          </p>
        </div>
        
        <a
          href={mapsLink}
          target="_blank"
          rel="noreferrer"
          className="flex-shrink-0 inline-flex items-center space-x-1 py-1.5 px-3 rounded-lg bg-[#C5A059]/10 hover:bg-[#C5A059] border border-[#C5A059]/30 text-[#C5A059] hover:text-black text-[10px] font-bold tracking-wider transition-all duration-200"
        >
          <span>Petunjuk</span>
          <Navigation className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
