import React, { useEffect, useState } from 'react';
import { Bell, Film, X, ArrowRight, CheckCircle2, Clock, Plus, Sparkles, ExternalLink } from 'lucide-react';
import { FilmRequest } from '../types';

export interface ToastNotification {
  id: string;
  type: 'film_request';
  title: string;
  username: string;
  timestamp: string;
  requestItem?: FilmRequest;
}

interface NotificationToastProps {
  notification: ToastNotification | null;
  onDismiss: () => void;
  onViewRequests: () => void;
  onQuickAddFilm: (title: string) => void;
}

// Synthesize pleasant sound with Web Audio API (no external file needed)
export const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // First chime note (E5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
    gain1.gain.setValueAtTime(0.12, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.35);

    // Second chime note (B5)
    setTimeout(() => {
      try {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(987.77, ctx.currentTime);
        gain2.gain.setValueAtTime(0.15, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.45);
      } catch {}
    }, 120);
  } catch {
    // Audio context may be restricted before user gesture
  }
};

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onDismiss,
  onViewRequests,
  onQuickAddFilm
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!notification) return;

    setProgress(100);
    const duration = 7000; // 7 seconds
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [notification, onDismiss]);

  if (!notification) return null;

  return (
    <div className="fixed top-5 right-5 z-50 max-w-sm w-full animate-slideIn">
      <div className="relative bg-slate-900 border border-amber-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-md overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-blue-500 to-amber-500" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-100">Request Film Baru!</h4>
                <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded font-mono">
                  BARU
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                dari <span className="text-blue-400 font-semibold">{notification.username}</span> · {notification.timestamp}
              </p>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Tutup Notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-3 p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-2 text-xs">
            <Film className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="font-bold text-slate-100 truncate">
              {notification.title}
            </p>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Penonton meminta judul ini melalui simulator bot Telegram.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => {
              onDismiss();
              onViewRequests();
            }}
            className="flex-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>Lihat Antrean</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              onDismiss();
              onQuickAddFilm(notification.title);
            }}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload Film</span>
          </button>
        </div>

        {/* Progress bar countdown */}
        <div className="absolute bottom-0 inset-x-0 h-0.5 bg-slate-800">
          <div
            className="h-full bg-amber-400 transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

interface RequestModalAlertProps {
  notification: ToastNotification | null;
  isOpen: boolean;
  onClose: () => void;
  onApproveAndUpload: (title: string) => void;
  onGoToQueue: () => void;
}

export const RequestModalAlert: React.FC<RequestModalAlertProps> = ({
  notification,
  isOpen,
  onClose,
  onApproveAndUpload,
  onGoToQueue
}) => {
  if (!isOpen || !notification) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-2xl p-6 shadow-2xl overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-blue-500 to-amber-500" />

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Request Film Baru</h3>
                <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded font-mono">
                  PENDING
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Pengguna: <span className="text-blue-400 font-semibold">{notification.username}</span> · {notification.timestamp}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Box */}
        <div className="mt-5 p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div className="flex items-center gap-2.5">
            <Film className="w-5 h-5 text-amber-400 shrink-0" />
            <h4 className="text-sm font-bold text-slate-100">{notification.title}</h4>
          </div>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Pengguna simulator baru saja mengajukan permohonan judul film ini untuk ditambahkan ke dalam basis data bot Telegram streaming Anda.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={() => {
              onClose();
              onGoToQueue();
            }}
            className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors text-center"
          >
            Buka Antrean Lengkap
          </button>
          <button
            onClick={() => {
              onClose();
              onApproveAndUpload(notification.title);
            }}
            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Upload ke Katalog</span>
          </button>
        </div>
      </div>
    </div>
  );
};
