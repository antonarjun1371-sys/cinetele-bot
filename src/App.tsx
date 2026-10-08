/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Bot, Film, Plus, Play, Radio, MessageSquare, BookOpen, Settings, ShieldCheck, Sparkles, Tv, Check, Bell } from 'lucide-react';
import { Movie, BotConfig, FilmRequest, TelegramAd } from './types';
import { INITIAL_MOVIES, INITIAL_REQUESTS } from './data/initialMovies';
import { INITIAL_ADS } from './data/initialAds';
import { TelegramSimulator } from './components/TelegramSimulator';
import { CatalogManager } from './components/CatalogManager';
import { BotIntegration } from './components/BotIntegration';
import { BroadcastManager } from './components/BroadcastManager';
import { FilmRequestsManager } from './components/FilmRequestsManager';
import { BotSetupGuide } from './components/BotSetupGuide';
import { CinemaPlayerModal } from './components/CinemaPlayerModal';
import { AdManager } from './components/AdManager';
import { Analytics } from './components/Analytics';
import { NotificationToast, RequestModalAlert, ToastNotification, playNotificationSound } from './components/NotificationToast';

export default function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'catalog' | 'integration' | 'broadcast' | 'requests' | 'ads' | 'analytics' | 'guide'>('simulator');
  const [movies, setMovies] = useState<Movie[]>(INITIAL_MOVIES);
  const [requests, setRequests] = useState<FilmRequest[]>(INITIAL_REQUESTS);
  const [ads, setAds] = useState<TelegramAd[]>(INITIAL_ADS);
  const [watchingMovie, setWatchingMovie] = useState<Movie | null>(null);
  const [toastNotification, setToastNotification] = useState<ToastNotification | null>(null);
  const [isModalAlertOpen, setIsModalAlertOpen] = useState(false);
  const [initialAddTitle, setInitialAddTitle] = useState<string | null>(null);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);

  const pendingRequestsCount = requests.filter((r) => r.status === 'pending').length;

  const [botConfig, setBotConfig] = useState<BotConfig>({
    botToken: '8685263385:AAHWYLnNeSmFGah00X-a7FM4UCGT-iQ3T_Y',
    botUsername: 'Nontonfilm1_bot',
    botName: 'Nonton Film HD',
    isConnected: true,
    pollingActive: true,
    webhookUrl: '',
    welcomeMessage: '🎬 Selamat datang di Bot Nonton Film HD!\nTempat nonton streaming film & series terlengkap dengan subtitle Indonesia kualitas HD & 4K.\n\nSilakan pilih menu di bawah ini untuk mulai menjelajahi film kesukaanmu!',
    forceSubEnabled: false,
    channelUsername: '@Nontonfilm1_channel',
    channelInviteLink: 'https://t.me/Nontonfilm1_bot',
    vipEnabled: true,
    vipFeeInfo: 'Rp 15.000 / Bulan (Akses Server VIP Super Cepat & Tanpa Iklan)',
    allowRequestFilm: true
  });

  // Fetch initial data from backend if available
  useEffect(() => {
    fetch('/api/bot/movies')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setMovies(data);
      })
      .catch(() => {});

    fetch('/api/bot/config')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.botName) setBotConfig((prev) => ({ ...prev, ...data }));
      })
      .catch(() => {});

    fetch('/api/bot/requests')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setRequests(data);
      })
      .catch(() => {});

    fetch('/api/bot/ads')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setAds(data);
      })
      .catch(() => {});
  }, []);

  // Check URL hash for direct movie playback (e.g. #watch=film-1)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#watch=')) {
        const id = hash.replace('#watch=', '');
        const target = movies.find((m) => m.id === id);
        if (target) setWatchingMovie(target);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [movies]);

  // CRUD Handlers for Movies
  const handleAddMovie = async (newMovie: Omit<Movie, 'id'>) => {
    try {
      const res = await fetch('/api/bot/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMovie)
      });
      const created = await res.json();
      setMovies((prev) => [created, ...prev]);
    } catch {
      const localCreated: Movie = {
        ...newMovie,
        id: `film-${Date.now()}`
      };
      setMovies((prev) => [localCreated, ...prev]);
    }
  };

  const handleUpdateMovie = async (id: string, updates: Partial<Movie>) => {
    try {
      const res = await fetch(`/api/bot/movies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const updated = await res.json();
      setMovies((prev) => prev.map((m) => (m.id === id ? updated : m)));
    } catch {
      setMovies((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
    }
  };

  const handleDeleteMovie = async (id: string) => {
    try {
      await fetch(`/api/bot/movies/${id}`, { method: 'DELETE' });
    } catch {}
    setMovies((prev) => prev.filter((m) => m.id !== id));
  };

  // Config Update Handler
  const handleUpdateConfig = async (newConfig: Partial<BotConfig>) => {
    try {
      const res = await fetch('/api/bot/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      const data = await res.json();
      if (data.ok && data.config) {
        setBotConfig((prev) => ({ ...prev, ...data.config }));
      } else {
        setBotConfig((prev) => ({ ...prev, ...newConfig }));
      }
    } catch {
      setBotConfig((prev) => ({ ...prev, ...newConfig }));
    }
  };

  // Film Request Handlers
  const handleUserRequest = async (title: string, username: string = '@penonton_telegram') => {
    const newReq: FilmRequest = {
      id: `req-${Date.now()}`,
      user: username,
      title,
      status: 'pending',
      createdAt: 'Baru saja'
    };
    setRequests((prev) => [newReq, ...prev]);

    // Play subtle audio chime for admin alert
    playNotificationSound();

    // Trigger floating Toast alert
    setToastNotification({
      id: `toast-${Date.now()}`,
      type: 'film_request',
      title,
      username,
      timestamp: 'Baru saja',
      requestItem: newReq
    });
  };

  const handleUpdateRequestStatus = async (id: string, status: FilmRequest['status']) => {
    try {
      await fetch(`/api/bot/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
    } catch {}
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  // Ads Handlers
  const handleAddAd = async (newAd: Omit<TelegramAd, 'id' | 'impressions' | 'clicks' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/bot/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAd)
      });
      const created = await res.json();
      setAds((prev) => [created, ...prev]);
    } catch {
      const fallbackAd: TelegramAd = {
        ...newAd,
        id: `ad-${Date.now()}`,
        impressions: 0,
        clicks: 0,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setAds((prev) => [fallbackAd, ...prev]);
    }
  };

  const handleUpdateAd = async (id: string, updates: Partial<TelegramAd>) => {
    try {
      const res = await fetch(`/api/bot/ads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const updated = await res.json();
      setAds((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch {
      setAds((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
    }
  };

  const handleDeleteAd = async (id: string) => {
    try {
      await fetch(`/api/bot/ads/${id}`, { method: 'DELETE' });
    } catch {}
    setAds((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAdClick = async (id: string) => {
    try {
      await fetch(`/api/bot/ads/${id}/click`, { method: 'POST' });
    } catch {}
    setAds((prev) => prev.map((a) => (a.id === id ? { ...a, clicks: (a.clicks || 0) + 1 } : a)));
  };

  // Find active pre-roll ad (or fallback to any active ad / default sponsor)
  const activePrerollAd =
    ads.find((a) => a.isActive && a.placement === 'preroll_stream') ||
    ads.find((a) => a.isActive) ||
    INITIAL_ADS[0];

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-200 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* ======================================================== */}
      {/* 1. TOP BAR CONTRACT: Brand — 4-6 nav links — 1-2 actions */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Zone 1: Brand Wordmark (Single text element) */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('simulator');
            }}
            className="text-lg font-black tracking-tight text-white font-display flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <span className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs">
              <Tv className="w-4 h-4" />
            </span>
            <span>CineTele Studio</span>
          </a>

          {/* Zone 2: 4-6 Clean text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-400">
            <button
              onClick={() => setActiveTab('simulator')}
              className={`hover:text-white transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'simulator' ? 'text-blue-400 font-bold' : ''
              }`}
            >
              Live Simulator
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`hover:text-white transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'catalog' ? 'text-blue-400 font-bold' : ''
              }`}
            >
              Katalog Film
            </button>
            <button
              onClick={() => setActiveTab('integration')}
              className={`hover:text-white transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'integration' ? 'text-blue-400 font-bold' : ''
              }`}
            >
              Integrasi Bot
            </button>
            <button
              onClick={() => setActiveTab('ads')}
              className={`hover:text-white transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'ads' ? 'text-amber-400 font-bold' : ''
              }`}
            >
              Iklan & Monetisasi
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`hover:text-white transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'analytics' ? 'text-blue-400 font-bold' : ''
              }`}
            >
              Analitik
            </button>
            <button
              onClick={() => setActiveTab('broadcast')}
              className={`hover:text-white transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'broadcast' ? 'text-blue-400 font-bold' : ''
              }`}
            >
              Broadcast
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`hover:text-white transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'requests' ? 'text-blue-400 font-bold' : ''
              }`}
            >
              <span>Antrean Request</span>
              {pendingRequestsCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-bold font-mono rounded bg-amber-500 text-slate-950 animate-pulse">
                  {pendingRequestsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`hover:text-white transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'guide' ? 'text-blue-400 font-bold' : ''
              }`}
            >
              Panduan Setup
            </button>
          </nav>

          {/* Zone 3: 1-2 primary actions */}
          <div className="flex items-center gap-2.5">
            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationDropdownOpen(!isNotificationDropdownOpen)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors relative cursor-pointer"
                title="Notifikasi Request Film Baru"
              >
                <Bell className="w-4 h-4" />
                {pendingRequestsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                )}
                {pendingRequestsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full" />
                )}
              </button>

              {isNotificationDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2 px-1">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-amber-400" />
                      <span>Notifikasi Request</span>
                    </span>
                    <span className="text-[10px] text-amber-400 font-mono font-semibold">
                      {pendingRequestsCount} Menunggu
                    </span>
                  </div>

                  {requests.filter(r => r.status === 'pending').length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">
                      Tidak ada request film yang belum ditangani.
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-56 overflow-y-auto">
                      {requests.filter(r => r.status === 'pending').slice(0, 4).map((req) => (
                        <div
                          key={req.id}
                          onClick={() => {
                            setIsNotificationDropdownOpen(false);
                            setActiveTab('requests');
                          }}
                          className="p-2 rounded-xl hover:bg-slate-800/80 cursor-pointer transition-colors text-xs space-y-0.5 border border-slate-800/50"
                        >
                          <p className="font-bold text-slate-200 truncate">{req.title}</p>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                            <span className="text-blue-400">{req.user}</span>
                            <span>{req.createdAt}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setIsNotificationDropdownOpen(false);
                      setActiveTab('requests');
                    }}
                    className="w-full mt-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold rounded-lg text-center transition-colors block cursor-pointer"
                  >
                    Buka Semua Antrean Request →
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setActiveTab('catalog');
              }}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shadow-sm cursor-pointer"
            >
              + Tambah Film
            </button>
          </div>
        </div>
      </header>

      {/* Hero Header Section */}
      <section className="relative border-b border-slate-800/80 bg-slate-950 overflow-hidden">
        {/* Subtle backdrop */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <img
            src="/src/assets/images/hero_cinema_backdrop_1791448461059.jpg"
            alt="Cinema backdrop"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-8 sm:py-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight text-balance">
                Pusat Kontrol & Simulator Bot Telegram Nonton Film
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Kelola katalog video bioskop HD, aktifkan proteksi Force Subscribe sponsor channel, uji bot langsung di simulator Telegram interaktif, dan hubungkan token resmi @BotFather Anda.
              </p>
            </div>

            {/* Quick Stats (Unboxed text) */}
            <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
              <div>
                <span className="text-base font-bold text-white tabular-nums">{movies.length}</span>
                <span className="block text-[11px] text-slate-500">Judul Film</span>
              </div>
              <span className="text-slate-700" aria-hidden="true">|</span>
              <div>
                <span className="text-base font-bold text-emerald-400 tabular-nums">
                  {botConfig.pollingActive ? 'LIVE' : 'READY'}
                </span>
                <span className="block text-[11px] text-slate-500">Status Bot</span>
              </div>
              <span className="text-slate-700" aria-hidden="true">|</span>
              <div>
                <span className="text-base font-bold text-amber-400 tabular-nums">
                  {ads.filter(a => a.isActive).length}
                </span>
                <span className="block text-[11px] text-slate-500">Iklan Aktif</span>
              </div>
              <span className="text-slate-700" aria-hidden="true">|</span>
              <div>
                <span className="text-base font-bold text-blue-400 tabular-nums">{requests.length}</span>
                <span className="block text-[11px] text-slate-500">Request User</span>
              </div>
            </div>
          </div>

          {/* Mobile Tab Scroller */}
          <div className="flex md:hidden items-center gap-2 mt-6 overflow-x-auto pb-1 border-t border-slate-800/60 pt-4">
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                activeTab === 'simulator' ? 'bg-blue-600 text-white' : 'text-slate-400 bg-slate-900'
              }`}
            >
              Simulator
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                activeTab === 'catalog' ? 'bg-blue-600 text-white' : 'text-slate-400 bg-slate-900'
              }`}
            >
              Katalog ({movies.length})
            </button>
            <button
              onClick={() => setActiveTab('integration')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                activeTab === 'integration' ? 'bg-blue-600 text-white' : 'text-slate-400 bg-slate-900'
              }`}
            >
              Integrasi Token
            </button>
            <button
              onClick={() => setActiveTab('ads')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                activeTab === 'ads' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 bg-slate-900'
              }`}
            >
              Iklan ({ads.filter(a => a.isActive).length})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                activeTab === 'analytics' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 bg-slate-900'
              }`}
            >
              Analitik
            </button>
            <button
              onClick={() => setActiveTab('broadcast')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                activeTab === 'broadcast' ? 'bg-blue-600 text-white' : 'text-slate-400 bg-slate-900'
              }`}
            >
              Broadcast
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                activeTab === 'requests' ? 'bg-blue-600 text-white' : 'text-slate-400 bg-slate-900'
              }`}
            >
              Request ({requests.length})
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                activeTab === 'guide' ? 'bg-blue-600 text-white' : 'text-slate-400 bg-slate-900'
              }`}
            >
              Panduan
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'simulator' && (
          <TelegramSimulator
            movies={movies}
            botConfig={botConfig}
            ads={ads}
            onWatchMovie={(movie) => setWatchingMovie(movie)}
            onRequestFilm={handleUserRequest}
            onAdClick={handleAdClick}
          />
        )}

        {activeTab === 'catalog' && (
          <CatalogManager
            movies={movies}
            initialAddTitle={initialAddTitle}
            onClearInitialAddTitle={() => setInitialAddTitle(null)}
            onAddMovie={handleAddMovie}
            onUpdateMovie={handleUpdateMovie}
            onDeleteMovie={handleDeleteMovie}
            onWatchMovie={(movie) => setWatchingMovie(movie)}
          />
        )}

        {activeTab === 'integration' && (
          <BotIntegration
            config={botConfig}
            onUpdateConfig={handleUpdateConfig}
          />
        )}

        {activeTab === 'ads' && (
          <AdManager
            ads={ads}
            onAddAd={handleAddAd}
            onUpdateAd={handleUpdateAd}
            onDeleteAd={handleDeleteAd}
            onAdClick={handleAdClick}
          />
        )}

        {activeTab === 'analytics' && (
          <Analytics
            movies={movies}
            ads={ads}
          />
        )}

        {activeTab === 'broadcast' && (
          <BroadcastManager
            movies={movies}
            config={botConfig}
          />
        )}

        {activeTab === 'requests' && (
          <FilmRequestsManager
            requests={requests}
            onUpdateStatus={handleUpdateRequestStatus}
            onQuickAddToCatalog={(title) => {
              setActiveTab('catalog');
            }}
          />
        )}

        {activeTab === 'guide' && (
          <BotSetupGuide config={botConfig} />
        )}
      </main>

      {/* Cinema Stream Player Modal */}
      <CinemaPlayerModal
        movie={watchingMovie}
        ad={activePrerollAd}
        onAdClick={handleAdClick}
        onClose={() => {
          setWatchingMovie(null);
          if (window.location.hash.startsWith('#watch=')) {
            window.location.hash = '';
          }
        }}
      />

      {/* Floating Admin Alert Toast for New User Film Requests */}
      <NotificationToast
        notification={toastNotification}
        onDismiss={() => setToastNotification(null)}
        onViewRequests={() => {
          setActiveTab('requests');
          setToastNotification(null);
        }}
        onQuickAddFilm={(title) => {
          setActiveTab('catalog');
          setInitialAddTitle(title);
          setToastNotification(null);
        }}
      />

      {/* Interactive Admin Alert Modal for New User Film Requests */}
      <RequestModalAlert
        isOpen={isModalAlertOpen}
        notification={toastNotification}
        onClose={() => setIsModalAlertOpen(false)}
        onGoToQueue={() => {
          setActiveTab('requests');
          setIsModalAlertOpen(false);
        }}
        onApproveAndUpload={(title) => {
          setActiveTab('catalog');
          setInitialAddTitle(title);
          setIsModalAlertOpen(false);
        }}
      />

      {/* Clean Uncluttered Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-6 px-6 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 CineTele Bot Studio · Engine Streaming & Manajemen Bot Telegram Film</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Telegram Bot API 7.0+</span>
            <span aria-hidden="true">·</span>
            <span>Sub Indo & Audio HD</span>
            <span aria-hidden="true">·</span>
            <span>Force Subscribe Protection</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
