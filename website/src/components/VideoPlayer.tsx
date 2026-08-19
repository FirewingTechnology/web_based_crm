import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  Sparkles,
  Layers,
  Clock,
  ExternalLink
} from 'lucide-react';

interface Chapter {
  title: string;
  time: number; // in seconds
  desc?: string;
}

interface VideoPlayerProps {
  src?: string;
  autoPlay?: boolean;
  className?: string;
  showChapters?: boolean;
  title?: string;
}

const DEFAULT_CHAPTERS: Chapter[] = [
  { title: 'Overview & Cockpit', time: 0, desc: 'Real-time sales dashboard & live stats' },
  { title: 'Lead Pipeline Management', time: 30, desc: '7-stage visual CRM & drawer updates' },
  { title: 'Voice & Sound Reminders', time: 75, desc: 'Automated harmonic follow-up alarms' },
  { title: 'Builder & Project Catalog', time: 120, desc: 'RERA tracking & inline builder creation' },
  { title: 'Executive Targets & Analytics', time: 180, desc: 'Revenue targets, INR metrics & audits' },
];

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src = '/demo-video.mp4',
  autoPlay = false,
  className = '',
  showChapters = true,
  title = 'REALVION Platform Live Walkthrough'
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [activeChapter, setActiveChapter] = useState<number>(0);
  const controlsTimeoutRef = useRef<any>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      // Determine active chapter
      if (DEFAULT_CHAPTERS.length > 0) {
        let currentIdx = 0;
        for (let i = DEFAULT_CHAPTERS.length - 1; i >= 0; i--) {
          if (video.currentTime >= DEFAULT_CHAPTERS[i].time) {
            currentIdx = i;
            break;
          }
        }
        setActiveChapter(currentIdx);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleChapterClick = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      if (!isPlaying) {
        videoRef.current.play();
      }
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(console.error);
      setIsFullscreen(false);
    }
  };

  const restartVideo = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Video Container Frame */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && setShowControls(false)}
        className="relative group rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl shadow-black/80 aspect-video flex items-center justify-center select-none"
      >
        <video
          ref={videoRef}
          src={src}
          autoPlay={autoPlay}
          playsInline
          className="w-full h-full object-contain cursor-pointer"
          onClick={togglePlay}
        />

        {/* Big Center Play/Pause Indicator (when paused) */}
        {!isPlaying && (
          <div
            onClick={togglePlay}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group-hover:bg-black/30"
          >
            <div className="h-20 w-20 rounded-full bg-gradient-to-r from-amber-500 to-[#C8A45D] flex items-center justify-center text-black shadow-2xl shadow-[#C8A45D]/50 transform transition-transform group-hover:scale-110 active:scale-95">
              <Play className="h-9 w-9 ml-1 fill-black" />
            </div>
            <p className="mt-4 text-sm font-bold text-white tracking-wide flex items-center gap-2 drop-shadow-md">
              <Sparkles className="h-4 w-4 text-[#C8A45D]" /> Watch Demo Recording
            </p>
            <p className="text-xs text-slate-300 mt-1 font-light">Click to play with full audio & controls</p>
          </div>
        )}

        {/* Top Header Overlay */}
        <div
          className={`absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between transition-opacity duration-300 ${
            showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#C8A45D] px-2 py-0.5 rounded-full bg-[#C8A45D]/10 border border-[#C8A45D]/30">
              HD 1080P
            </span>
          </div>
        </div>

        {/* Bottom Custom Controls Bar */}
        <div
          className={`absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent space-y-3 transition-opacity duration-300 ${
            showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Progress Slider */}
          <div className="relative group/progress flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#C8A45D] transition-all hover:h-2.5"
            />
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between text-white text-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="p-2 rounded-xl bg-white/10 hover:bg-[#C8A45D] hover:text-black transition"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
              </button>

              <button
                onClick={restartVideo}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition"
                title="Restart"
              >
                <RotateCcw className="h-4 w-4 text-slate-300" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-4 w-4 text-rose-400" />
                  ) : (
                    <Volume2 className="h-4 w-4 text-slate-300" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 bg-white/20 rounded appearance-none cursor-pointer accent-[#C8A45D]"
                />
              </div>

              <span className="font-mono text-[11px] text-slate-300">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Playback speed dropdown / cycle */}
              <div className="flex items-center bg-white/10 rounded-xl p-1 gap-1">
                {[1, 1.25, 1.5].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => handleSpeedChange(speed)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition ${
                      playbackSpeed === speed
                        ? 'bg-[#C8A45D] text-black font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>

              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chapters / Timeline Navigation if enabled */}
      {showChapters && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-[#C8A45D]" /> Demo Key Highlights & Chapters
            </span>
            <span>Click any section to jump</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {DEFAULT_CHAPTERS.map((chap, idx) => {
              const isActive = activeChapter === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleChapterClick(chap.time)}
                  className={`p-3 rounded-2xl text-left transition border ${
                    isActive
                      ? 'bg-[#C8A45D]/15 border-[#C8A45D] shadow-lg shadow-[#C8A45D]/10'
                      : 'bg-[#101010] border-white/10 hover:border-white/25 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isActive ? 'bg-[#C8A45D] text-black' : 'bg-white/10 text-[#C8A45D]'
                      }`}
                    >
                      {formatTime(chap.time)}
                    </span>
                    {isActive && <span className="h-1.5 w-1.5 rounded-full bg-[#C8A45D] animate-ping" />}
                  </div>
                  <p className={`text-xs font-semibold line-clamp-1 ${isActive ? 'text-[#C8A45D]' : 'text-white'}`}>
                    {chap.title}
                  </p>
                  {chap.desc && (
                    <p className="text-[10px] text-slate-400 font-light line-clamp-1 mt-0.5">{chap.desc}</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
