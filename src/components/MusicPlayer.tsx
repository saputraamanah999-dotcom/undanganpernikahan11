import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Music, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MusicPlayerProps {
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  url: string;
  title?: string;
}

export default function MusicPlayer({ isPlaying, setIsPlaying, url, title }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Fallback to default if not defined
  const trackTitle = title || "Melodi Swarga - Gamelan Bali & Suling Klasik";

  useEffect(() => {
    // Initialize audio instance
    const audio = new Audio(url);
    audio.loop = true;
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audioRef.current = null;
    };
  }, [url]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(err => {
          console.log("Autoplay blocked by browser. User interaction needed.", err);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, setIsPlaying]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Format helper (e.g. 135 -> "02:15")
  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      id="music-player-top-bar" 
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm md:max-w-md bg-[#101010]/90 backdrop-blur-md border border-[#C5A059]/25 rounded-2xl shadow-2xl p-3 flex flex-col space-y-2"
    >
      <div className="flex items-center justify-between space-x-3">
        {/* Play / Pause Interactive Button */}
        <button
          id="btn-music-toggle-top"
          onClick={togglePlay}
          className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-[#C5A059] hover:bg-[#b38e4b] text-black transition-all active:scale-90 shadow-md cursor-pointer"
          aria-label={isPlaying ? "Pause Music" : "Play Music"}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-black" />
          ) : (
            <Play className="w-4 h-4 fill-black ml-0.5" />
          )}
        </button>

        {/* Track Metadata Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-1">
            <Music className="w-3.5 h-3.5 text-[#C5A059] animate-pulse" />
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#C5A059]/70 leading-none">
              BACKGROUND MUSIC
            </p>
          </div>
          <p className="text-xs font-semibold text-[#F5F5F5] truncate mt-1">
            {trackTitle}
          </p>
        </div>

        {/* Dynamic sound indicators */}
        <div className="flex items-center space-x-1.5 flex-shrink-0">
          {isPlaying ? (
            <div className="flex items-end space-x-0.5 h-3">
              <span className="w-0.5 bg-[#C5A059] animate-bounce" style={{ height: '60%', animationDuration: '0.8s' }} />
              <span className="w-0.5 bg-[#C5A059] animate-bounce" style={{ height: '100%', animationDuration: '1s' }} />
              <span className="w-0.5 bg-[#C5A059] animate-bounce" style={{ height: '40%', animationDuration: '0.6s' }} />
            </div>
          ) : (
            <VolumeX className="w-4 h-4 text-gray-600" />
          )}
        </div>
      </div>

      {/* Interactive Progress Bar Timeline */}
      <div className="flex items-center space-x-2.5">
        <span className="text-[9px] font-mono text-gray-500 min-w-[28px]">
          {formatTime(currentTime)}
        </span>
        
        <div 
          onClick={handleProgressBarClick}
          className="flex-1 h-1.5 bg-zinc-900 rounded-full overflow-hidden relative cursor-pointer group"
        >
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#C5A059] to-[#E2C284] rounded-full transition-all duration-100 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
          {/* Hover highlight line */}
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>

        <span className="text-[9px] font-mono text-gray-500 min-w-[28px] text-right">
          {formatTime(duration || 180)}
        </span>
      </div>
    </div>
  );
}
