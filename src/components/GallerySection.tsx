import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image, X, ChevronLeft, ChevronRight, ZoomIn, Play } from 'lucide-react';
import { subscribeToGallery } from '../lib/firebaseService';

interface PhotoItem {
  id: string;
  url: string;
  caption: string;
  category: string;
}

const DEFAULT_GALLERY_PHOTOS: PhotoItem[] = [
  {
    id: 'bali-couple-1',
    url: '/images/BALI-COUPLE-1.png',
    caption: 'Aria - Mempelai Pria Pernikahan I',
    category: 'Prewedding'
  },
  {
    id: 'bali-couple-2',
    url: '/images/BALI-COUPLE-2.webp',
    caption: 'Bella - Mempelai Wanita Pernikahan I',
    category: 'Prewedding'
  },
  {
    id: 'bali-couple-3',
    url: '/images/BALI-COUPLE-3.png',
    caption: 'Devan - Mempelai Pria Pernikahan II',
    category: 'Engagement'
  },
  {
    id: 'bali-couple-4',
    url: '/images/BALI-COUPLE-4.webp',
    caption: 'Elina - Mempelai Wanita Pernikahan II',
    category: 'Engagement'
  },
  {
    id: 'bali-bg',
    url: '/images/BALI-BACKGROUND.jpg',
    caption: 'Pemandangan Bali - Latar Acara Pernikahan',
    category: 'Family'
  },
  {
    id: 'bali-fallback',
    url: '/images/BALI-FALLBACK.jpeg',
    caption: 'Suasana Khidmat Pesta Pernikahan Adat Bali',
    category: 'Family'
  }
];

export default function GallerySection() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [activePhotoIdx, setActivePhotoIdx] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToGallery((list) => {
      if (list && list.length > 0) {
        setPhotos(list);
      } else {
        setPhotos(DEFAULT_GALLERY_PHOTOS);
      }
    });

    return () => unsubscribe();
  }, []);

  const filteredPhotos = selectedCategory === 'Semua' 
    ? photos 
    : photos.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());

  const openLightbox = (index: number) => {
    setActivePhotoIdx(index);
  };

  const closeLightbox = () => {
    setActivePhotoIdx(null);
  };

  const showNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activePhotoIdx !== null && filteredPhotos.length > 0) {
      setActivePhotoIdx((activePhotoIdx + 1) % filteredPhotos.length);
    }
  };

  const showPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activePhotoIdx !== null && filteredPhotos.length > 0) {
      setActivePhotoIdx((activePhotoIdx - 1 + filteredPhotos.length) % filteredPhotos.length);
    }
  };

  const isVideo = (url: string) => {
    return url.startsWith('data:video/') || url.endsWith('.mp4') || url.endsWith('.webm');
  };

  const categories = ['Semua', 'Prewedding', 'Engagement', 'Family'];

  return (
    <div id="gallery-section" className="py-12 px-4 max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <span className="font-mono text-xs tracking-widest text-[#C5A059] uppercase block mb-1">
          GALLERY / GALERI FOTO
        </span>
        <h3 className="font-serif text-2xl md:text-3xl font-semibold text-[#F5F5F5]">
          Momen Indah Kebahagiaan
        </h3>
        <p className="mt-2 text-xs md:text-sm text-[#E5E5E5]/70 max-w-md mx-auto italic">
          Setiap bingkai foto menyimpan cerita cinta suci dan memori berharga perjalanan kami.
        </p>
      </div>

      {/* Category Filter Buttons */}
      <div className="flex flex-wrap justify-center gap-2 mb-10 max-w-lg mx-auto">
        {categories.map(category => (
          <button
            key={category}
            id={`filter-btn-${category.toLowerCase()}`}
            onClick={() => {
              setSelectedCategory(category);
              setActivePhotoIdx(null);
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-all duration-300 cursor-pointer border ${
              selectedCategory === category
                ? 'bg-[#C5A059] text-black border-[#C5A059] shadow-lg shadow-[#C5A059]/20 scale-105'
                : 'bg-[#0A0A0A] text-gray-400 border-[#C5A059]/20 hover:text-white hover:border-[#C5A059]/50'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Grid Layout with Framer Motion layout transition */}
      <motion.div 
        layout 
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
      >
        <AnimatePresence mode="popLayout">
          {filteredPhotos.map((photo, idx) => (
            <motion.div
              layout
              key={photo.id}
              id={`gallery-photo-${photo.id}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
              onClick={() => openLightbox(idx)}
              className="group relative aspect-square rounded-2xl overflow-hidden border border-[#C5A059]/20 shadow-xl cursor-pointer bg-[#151515]"
            >
              {/* Media element: Image or Video */}
              {isVideo(photo.url) ? (
                <div className="w-full h-full relative">
                  <video
                    src={photo.url}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    muted
                    loop
                    playsInline
                  />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/50 text-[#C5A059] border border-[#C5A059]/30 group-hover:bg-[#C5A059] group-hover:text-black transition-all">
                    <Play className="w-4 h-4 fill-current" />
                  </div>
                </div>
              ) : (
                <img
                  src={photo.url}
                  alt={photo.caption}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 z-10">
                <span className="self-start text-[9px] font-mono tracking-widest uppercase bg-[#C5A059]/20 text-[#C5A059] px-2 py-0.5 rounded border border-[#C5A059]/30">
                  {photo.category}
                </span>
                
                <div className="space-y-1">
                  <p className="font-serif text-xs md:text-sm text-white font-medium line-clamp-2">
                    {photo.caption}
                  </p>
                  <span className="inline-flex items-center space-x-1 text-[10px] text-[#C5A059] font-semibold">
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>{isVideo(photo.url) ? 'Putar Video' : 'Perbesar'}</span>
                  </span>
                </div>
              </div>

              {/* Subtlest border outline inside card */}
              <div className="absolute inset-2 border border-white/5 rounded-xl pointer-events-none z-20 group-hover:border-[#C5A059]/30 transition-colors duration-300" />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {activePhotoIdx !== null && filteredPhotos[activePhotoIdx] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
            className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 cursor-pointer"
          >
            {/* Close Button top-right */}
            <button
              id="btn-close-lightbox"
              onClick={closeLightbox}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-[#C5A059] hover:text-black hover:scale-110 active:scale-95 transition-all z-50 shadow-2xl"
              title="Tutup Galeri"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Lightbox Wrapper */}
            <div 
              className="relative max-w-4xl w-full max-h-[75vh] flex items-center justify-center cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Prev Button */}
              {filteredPhotos.length > 1 && (
                <button
                  id="btn-prev-lightbox"
                  onClick={showPrev}
                  className="absolute left-2 md:-left-16 p-2.5 rounded-full bg-black/60 text-white border border-[#C5A059]/20 hover:bg-[#C5A059] hover:text-black hover:scale-105 active:scale-95 transition-all z-40 shadow-2xl"
                  aria-label="Previous Photo"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {/* Next Button */}
              {filteredPhotos.length > 1 && (
                <button
                  id="btn-next-lightbox"
                  onClick={showNext}
                  className="absolute right-2 md:-right-16 p-2.5 rounded-full bg-black/60 text-white border border-[#C5A059]/20 hover:bg-[#C5A059] hover:text-black hover:scale-105 active:scale-95 transition-all z-40 shadow-2xl"
                  aria-label="Next Photo"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              {/* Active Image/Video with Animation */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePhotoIdx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="relative flex flex-col items-center bg-[#151515] p-2 rounded-2xl border border-[#C5A059]/30 shadow-2xl"
                >
                  {isVideo(filteredPhotos[activePhotoIdx].url) ? (
                    <video
                      src={filteredPhotos[activePhotoIdx].url}
                      className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-2xl"
                      controls
                      autoPlay
                      playsInline
                    />
                  ) : (
                    <img
                      src={filteredPhotos[activePhotoIdx].url}
                      alt={filteredPhotos[activePhotoIdx].caption}
                      className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-2xl"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  
                  {/* Photo details footer */}
                  <div className="w-full mt-3 px-3 pb-2 text-center">
                    <span className="font-mono text-[9px] tracking-widest text-[#C5A059] uppercase bg-[#0A0A0A] px-2 py-0.5 rounded border border-[#C5A059]/15">
                      {filteredPhotos[activePhotoIdx].category}
                    </span>
                    <p className="mt-1.5 font-serif text-sm text-[#F5F5F5] font-semibold">
                      {filteredPhotos[activePhotoIdx].caption}
                    </p>
                    <span className="block mt-0.5 font-mono text-[9px] text-gray-500">
                      Item {activePhotoIdx + 1} dari {filteredPhotos.length}
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
