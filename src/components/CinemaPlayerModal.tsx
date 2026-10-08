import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize, Film, Download, Sparkles, Check, Megaphone, SkipForward, ExternalLink, Clock, RotateCcw } from 'lucide-react';
import { Movie, TelegramAd } from '../types';

interface CinemaPlayerModalProps {
  movie: Movie | null;
  ad?: TelegramAd | null;
  onClose: () => void;
  onAdClick?: (adId: string) => void;
}

export const CinemaPlayerModal: React.FC<CinemaPlayerModalProps> = ({
  movie,
  ad,
  onClose,
  onAdClick
}) => {
  if (!movie) return null;

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<string>(movie.quality);
  const [selectedSub, setSelectedSub] = useState<'id' | 'off'>('id');
  const [copiedLink, setCopiedLink] = useState(false);

  // Pre-roll Ad State
  const effectiveAd = ad && ad.isActive ? ad : null;
  const [showingPreroll, setShowingPreroll] = useState<boolean>(Boolean(effectiveAd));
  const [adCountdown, setAdCountdown] = useState<number>(5);
  const [earlyClickNotice, setEarlyClickNotice] = useState<string | null>(null);

  // Reset ad countdown whenever a movie or active ad loads
  useEffect(() => {
    if (effectiveAd) {
      setShowingPreroll(true);
      setAdCountdown(5);
      setEarlyClickNotice(null);
      effectiveAd.impressions = (effectiveAd.impressions || 0) + 1;
    } else {
      setShowingPreroll(false);
    }
  }, [movie, effectiveAd]);

  // 5-second countdown timer for Pre-roll Ad
  useEffect(() => {
    if (!showingPreroll) return;

    const interval = setInterval(() => {
      setAdCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showingPreroll]);

  const handleSkipAd = () => {
    if (adCountdown > 0) {
      setEarlyClickNotice(`Tunggu ${adCountdown} detik lagi untuk melewati iklan`);
      setTimeout(() => setEarlyClickNotice(null), 2500);
      return;
    }

    setShowingPreroll(false);
    setEarlyClickNotice(null);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleRestartPreroll = () => {
    setShowingPreroll(true);
    setAdCountdown(5);
    setEarlyClickNotice(null);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const handlePrerollAdClick = () => {
    if (effectiveAd && onAdClick) {
      onAdClick(effectiveAd.id);
    }
    if (effectiveAd?.targetUrl) {
      window.open(effectiveAd.targetUrl, '_blank');
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const copyDownload = () => {
    if (movie.downloadUrl) {
      navigator.clipboard.writeText(movie.downloadUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const isSkippable = adCountdown === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      {/* Ambient glow */}
      <div className="absolute -inset-10 bg-radial from-amber-500/10 via-transparent to-transparent pointer-events-none" />

      {/* Main Cinema Player Modal */}
      <div
        id="cinema-player-modal"
        className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400">
              <Film className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">{movie.title}</h2>
                {showingPreroll && (
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Iklan Berjalan
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{movie.year}</span>
                <span aria-hidden="true">·</span>
                <span>{movie.duration}</span>
                <span aria-hidden="true">·</span>
                <span className="text-amber-400 font-semibold">{movie.rating} ⭐</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-400">{movie.language}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {effectiveAd && !showingPreroll && (
              <button
                onClick={handleRestartPreroll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                title="Uji coba kembali iklan pre-roll dengan countdown 5 detik"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Tes Iklan (5s)</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Tutup Player"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player Canvas */}
        <div className="relative bg-black aspect-video w-full flex items-center justify-center group overflow-hidden">
          <video
            ref={videoRef}
            src={movie.streamUrl}
            poster={movie.posterUrl}
            autoPlay={!showingPreroll}
            playsInline
            className="w-full h-full object-contain"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          {/* Interactive "Skip Ad" Countdown Overlay when an ad is active */}
          {showingPreroll && effectiveAd && (
            <div
              id="skip-ad-overlay"
              className="absolute inset-0 z-30 flex flex-col justify-between bg-slate-950/90 backdrop-blur-sm p-4 sm:p-6 animate-fadeIn select-none"
            >
              {/* Top Ad Info Banner */}
              <div className="flex items-center justify-between gap-3 bg-slate-900/80 border border-slate-800/90 px-4 py-2.5 rounded-xl backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-wide">
                    Iklan Sponsor
                  </span>
                  <span className="text-xs text-slate-300 font-medium">
                    {effectiveAd.sponsorName}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrerollAdClick}
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    <span>Kunjungi Sponsor</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Center Ad Showcase Card */}
              <div className="max-w-lg w-full mx-auto bg-slate-900/95 border border-slate-800 rounded-2xl p-6 shadow-2xl relative text-center my-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-3">
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>Sponsor Resmi Bioskop Bot</span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 leading-snug">
                  {effectiveAd.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                  {effectiveAd.text}
                </p>

                {/* Primary Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
                  <button
                    onClick={handlePrerollAdClick}
                    className="w-full sm:w-auto flex-1 py-3 px-5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-98 cursor-pointer"
                  >
                    <span>{effectiveAd.buttonText}</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>

                  <button
                    id="modal-center-skip-button"
                    onClick={handleSkipAd}
                    disabled={!isSkippable}
                    className={`w-full sm:w-auto py-3 px-5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                      isSkippable
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 cursor-pointer active:scale-98 animate-pulse'
                        : 'bg-slate-800/90 text-slate-500 border border-slate-700/60 cursor-not-allowed'
                    }`}
                  >
                    <SkipForward className="w-4 h-4" />
                    <span>
                      {isSkippable ? 'Lewati Iklan' : `Lewati (${adCountdown}s)`}
                    </span>
                  </button>
                </div>

                {/* Early Skip Warning Toast/Cue */}
                {earlyClickNotice && (
                  <div className="mt-3 text-xs text-amber-400 font-medium animate-bounce">
                    ⚠️ {earlyClickNotice}
                  </div>
                )}
              </div>

              {/* Bottom Interactive Skip Ad Widget Bar (YouTube style overlay) */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {isSkippable
                      ? 'Iklan selesai · Siap diputar'
                      : `Video akan dimulai dalam ${adCountdown} detik`}
                  </span>
                </div>

                {/* Floating "Skip Ad" Countdown Button Widget */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    id="interactive-skip-ad-btn"
                    onClick={handleSkipAd}
                    disabled={!isSkippable}
                    className={`group relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xl ${
                      isSkippable
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer shadow-amber-500/25 active:scale-95 ring-2 ring-amber-400/50'
                        : 'bg-slate-900/90 hover:bg-slate-800/90 text-slate-300 border border-slate-700/80 cursor-not-allowed select-none'
                    }`}
                    title={
                      isSkippable
                        ? 'Klik untuk langsung memutar film'
                        : `Tombol lewati aktif dalam ${adCountdown} detik`
                    }
                  >
                    {!isSkippable ? (
                      <>
                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-amber-400 font-mono text-[11px] font-bold">
                          {adCountdown}
                        </div>
                        <span>Lewati Iklan dalam {adCountdown}s</span>
                      </>
                    ) : (
                      <>
                        <span>Lewati Iklan</span>
                        <SkipForward className="w-4 h-4 fill-current transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 5-Second Linear Progress Bar */}
              <div className="absolute bottom-0 inset-x-0 h-1.5 bg-slate-800/80 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-1000 ease-linear shadow-sm"
                  style={{ width: `${Math.min(100, ((5 - adCountdown) / 5) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Subtitle simulation overlay */}
          {!showingPreroll && selectedSub === 'id' && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 px-4 py-1 bg-black/75 rounded text-sm text-yellow-300 font-medium tracking-wide shadow-md pointer-events-none text-center">
              [Subtitle Indonesia aktif · CineTele Stream Engine]
            </div>
          )}

          {/* Video Control Bar */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 flex items-center justify-between opacity-90 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="w-9 h-9 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center hover:bg-amber-400 transition-colors shadow-lg cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              <button
                onClick={toggleMute}
                className="p-2 text-slate-200 hover:text-white transition-colors cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <span className="text-xs text-slate-300 font-mono tabular-nums">
                HD STREAM LIVE
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Quality selector */}
              <select
                value={selectedQuality}
                onChange={(e) => setSelectedQuality(e.target.value)}
                className="bg-slate-800/80 text-xs text-slate-200 border border-slate-700 rounded px-2 py-1 outline-none cursor-pointer hover:border-slate-500"
              >
                <option value="4K UHD">4K UHD</option>
                <option value="1080p FHD">1080p FHD</option>
                <option value="720p HD">720p HD</option>
              </select>

              {/* Subtitle toggle */}
              <button
                onClick={() => setSelectedSub(selectedSub === 'id' ? 'off' : 'id')}
                className={`text-xs px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                  selectedSub === 'id'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                CC {selectedSub === 'id' ? 'ID' : 'OFF'}
              </button>

              <button
                onClick={handleFullscreen}
                className="p-2 text-slate-200 hover:text-white transition-colors cursor-pointer"
                title="Layar Penuh"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Video Info and Telegram Bot integration info */}
        <div className="p-6 overflow-y-auto bg-slate-950/60 border-t border-slate-800">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {movie.genre.map((g) => (
                  <span key={g} className="text-xs text-slate-400 font-medium">
                    {g} ·
                  </span>
                ))}
                <span className="text-xs text-amber-400 font-mono">{selectedQuality}</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                {movie.synopsis}
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2 min-w-[200px]">
              <button
                onClick={copyDownload}
                className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
                {copiedLink ? 'Link Tersalin!' : 'Salin Direct URL'}
              </button>

              {movie.telegramFileId && (
                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-400">
                  <span className="text-[10px] uppercase text-slate-500 block mb-0.5">Telegram File ID</span>
                  <p className="truncate text-slate-300">{movie.telegramFileId}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
