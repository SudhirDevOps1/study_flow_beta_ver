import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, CloudRain, TreePine, Coffee, Hash, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore, type AppState } from "@/store/useAppStore";

const SOUNDS = [
  { 
    id: "rain", 
    name: "Rain", 
    icon: <CloudRain className="w-4 h-4" />, 
    url: "https://cdn.pixabay.com/audio/2021/09/06/audio_f36c568f9a.mp3" 
  },
  { 
    id: "forest", 
    name: "Forest", 
    icon: <TreePine className="w-4 h-4" />, 
    url: "https://cdn.pixabay.com/audio/2022/03/10/audio_c35ef1d989.mp3" 
  },
  { 
    id: "lofi", 
    name: "Study Lofi", 
    icon: <Coffee className="w-4 h-4" />, 
    url: "https://cdn.pixabay.com/audio/2022/05/27/audio_180873747b.mp3" 
  },
  { 
    id: "white_noise", 
    name: "Deep Noise", 
    icon: <Hash className="w-4 h-4" />, 
    url: "https://cdn.pixabay.com/audio/2022/01/18/audio_823a078b6b.mp3" 
  },
];

export function AmbiencePlayer() {
  const isTimerActive = useAppStore((state: AppState) => !!state.timer.activeSessionId && !state.timer.isPaused);
  const isMusicEnabled = useAppStore((state: AppState) => state.focusMusicEnabled);
  
  const [selectedTrack, setSelectedTrack] = useState(SOUNDS[0]);
  const [volume, setVolume] = useState(0.5);
  const [isOpen, setIsOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (isMusicEnabled && isTimerActive) {
      audioRef.current?.play().catch(e => console.log("Audio play blocked", e));
    } else {
      audioRef.current?.pause();
    }
  }, [isMusicEnabled, isTimerActive, selectedTrack]);

  return (
    <div className="relative">
      <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-2 px-3">
        {/* Sound Selection Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 hover:text-white transition-colors"
        >
          <div className="p-1.5 bg-white/10 rounded-lg text-cyan-400">
            {selectedTrack.icon}
          </div>
          <span className="text-sm font-medium text-slate-300 min-w-[80px] text-left">
            {selectedTrack.name}
          </span>
          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <div className="w-[1px] h-6 bg-white/10 mx-1" />

        {/* Volume Controls */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setVolume(v => v === 0 ? 0.5 : 0)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-16 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-500"
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full mb-2 left-0 w-48 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            {SOUNDS.map((track) => (
              <button
                key={track.id}
                onClick={() => {
                  setSelectedTrack(track);
                  setIsOpen(false);
                }}
                className={`flex items-center gap-3 w-full p-3 text-sm text-left transition-colors hover:bg-white/10 ${
                  selectedTrack.id === track.id ? "text-cyan-400 bg-white/5" : "text-slate-300"
                }`}
              >
                <div className={`${selectedTrack.id === track.id ? "text-cyan-400" : "text-slate-500"}`}>
                  {track.icon}
                </div>
                <span className="font-medium">{track.name}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <audio
        ref={audioRef}
        src={selectedTrack.url}
        loop
      />
    </div>
  );
}
