import React, { useState } from 'react';
import { Megaphone, Plus, ExternalLink, Edit3, Trash2, Eye, MousePointerClick, TrendingUp, Check, X, Shield, Radio, Sparkles } from 'lucide-react';
import { TelegramAd, AdPlacement } from '../types';

interface AdManagerProps {
  ads: TelegramAd[];
  onAddAd: (ad: Omit<TelegramAd, 'id' | 'impressions' | 'clicks' | 'createdAt'>) => void;
  onUpdateAd: (id: string, updates: Partial<TelegramAd>) => void;
  onDeleteAd: (id: string) => void;
  onAdClick: (id: string) => void;
}

export const AdManager: React.FC<AdManagerProps> = ({
  ads,
  onAddAd,
  onUpdateAd,
  onDeleteAd,
  onAdClick
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formSponsor, setFormSponsor] = useState('');
  const [formText, setFormText] = useState('');
  const [formButtonText, setFormButtonText] = useState('');
  const [formTargetUrl, setFormTargetUrl] = useState('');
  const [formPlacement, setFormPlacement] = useState<AdPlacement>('movie_footer');
  const [formIsActive, setFormIsActive] = useState(true);

  // Aggregated Stats
  const totalImpressions = ads.reduce((acc, a) => acc + (a.impressions || 0), 0);
  const totalClicks = ads.reduce((acc, a) => acc + (a.clicks || 0), 0);
  const averageCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '0.0';
  const activeAdsCount = ads.filter(a => a.isActive).length;

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormTitle('');
    setFormSponsor('');
    setFormText('');
    setFormButtonText('👉 Lihat Penawaran Sponsor');
    setFormTargetUrl('https://t.me/telegram');
    setFormPlacement('movie_footer');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ad: TelegramAd) => {
    setEditingId(ad.id);
    setFormTitle(ad.title);
    setFormSponsor(ad.sponsorName);
    setFormText(ad.text);
    setFormButtonText(ad.buttonText);
    setFormTargetUrl(ad.targetUrl);
    setFormPlacement(ad.placement);
    setFormIsActive(ad.isActive);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formButtonText.trim() || !formTargetUrl.trim()) return;

    if (editingId) {
      onUpdateAd(editingId, {
        title: formTitle,
        sponsorName: formSponsor || 'Sponsor',
        text: formText,
        buttonText: formButtonText,
        targetUrl: formTargetUrl,
        placement: formPlacement,
        isActive: formIsActive
      });
    } else {
      onAddAd({
        title: formTitle,
        sponsorName: formSponsor || 'Sponsor',
        text: formText,
        buttonText: formButtonText,
        targetUrl: formTargetUrl,
        placement: formPlacement,
        isActive: formIsActive
      });
    }

    setIsModalOpen(false);
  };

  const getPlacementLabel = (p: AdPlacement) => {
    switch (p) {
      case 'movie_footer':
        return 'Di Bawah Detail Film';
      case 'preroll_stream':
        return 'Pre-Roll Video (Sebelum Nonton)';
      case 'start_menu':
        return 'Menu Awal (/start)';
      case 'inline_button':
        return 'Tombol Inline Khusus';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Monetization Header & Metrics */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Manajemen Iklan Telegram (Monetisasi Bot)</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Sisipkan slot iklan berbayar, safelink sponsor, atau promosi channel afiliasi ke bot Anda
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-lg cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Slot Iklan</span>
          </button>
        </div>

        {/* Key Metrics Grid (Zero-pill layout) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Eye className="w-3.5 h-3.5" />
              <span>Total Tayang</span>
            </div>
            <p className="text-xl font-bold text-white font-mono tabular-nums">
              {totalImpressions.toLocaleString()}
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <MousePointerClick className="w-3.5 h-3.5" />
              <span>Total Klik</span>
            </div>
            <p className="text-xl font-bold text-blue-400 font-mono tabular-nums">
              {totalClicks.toLocaleString()}
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Rata-rata CTR</span>
            </div>
            <p className="text-xl font-bold text-emerald-400 font-mono tabular-nums">
              {averageCtr}%
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Megaphone className="w-3.5 h-3.5" />
              <span>Iklan Berjalan</span>
            </div>
            <p className="text-xl font-bold text-amber-400 font-mono tabular-nums">
              {activeAdsCount} / {ads.length}
            </p>
          </div>
        </div>
      </div>

      {/* Ads List */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-slate-200">Daftar Slot Iklan & Kampanye Sponsor</h4>

        {ads.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl">
            <Megaphone className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">Belum ada iklan. Klik tombol "Tambah Slot Iklan" di atas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ads.map((ad) => {
              const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : '0.0';
              return (
                <div
                  key={ad.id}
                  className={`bg-slate-900 border rounded-xl p-5 flex flex-col justify-between transition-all ${
                    ad.isActive ? 'border-slate-800' : 'border-slate-800/40 opacity-70'
                  }`}
                >
                  <div>
                    {/* Top Row: Sponsor & Toggle */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-amber-400">
                          {ad.sponsorName}
                        </span>
                        <span className="text-slate-600" aria-hidden="true">·</span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {getPlacementLabel(ad.placement)}
                        </span>
                      </div>

                      <button
                        onClick={() => onUpdateAd(ad.id, { isActive: !ad.isActive })}
                        className={`text-[11px] px-2.5 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
                          ad.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {ad.isActive ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </div>

                    <h4 className="text-sm font-bold text-slate-100">{ad.title}</h4>
                    {ad.text && (
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                        {ad.text}
                      </p>
                    )}

                    {/* Preview Button */}
                    <div className="mt-3 p-2.5 bg-slate-950 rounded-lg border border-slate-800/80">
                      <div className="text-[10px] text-slate-500 mb-1">Tampilan Tombol di Telegram:</div>
                      <a
                        href={ad.targetUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => onAdClick(ad.id)}
                        className="w-full text-center block px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-300 hover:text-white border border-slate-700 transition-colors truncate"
                      >
                        {ad.buttonText} ↗
                      </a>
                    </div>
                  </div>

                  {/* Bottom Stats & Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                    <div className="flex items-center gap-3">
                      <span>{ad.impressions.toLocaleString()} views</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-blue-400">{ad.clicks.toLocaleString()} klik</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-400">{ctr}% CTR</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(ad)}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                        title="Edit Iklan"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteAd(ad.id)}
                        className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded transition-colors"
                        title="Hapus Iklan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Ad Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100">
                {editingId ? 'Edit Iklan Telegram' : 'Tambah Iklan / Sponsor Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Kampanye / Judul Iklan <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Contoh: Promo Top Up Game Diskon 50%"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Brand / Sponsor
                </label>
                <input
                  type="text"
                  value={formSponsor}
                  onChange={(e) => setFormSponsor(e.target.value)}
                  placeholder="Contoh: FastVPN Asia atau Toko Voucher"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Posisi Penempatan Iklan
                </label>
                <select
                  value={formPlacement}
                  onChange={(e) => setFormPlacement(e.target.value as AdPlacement)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="movie_footer">Di Bawah Detail Film (Setiap kirim kartu film)</option>
                  <option value="preroll_stream">Pre-Roll Video (Hitung mundur 5s sebelum film diputar)</option>
                  <option value="start_menu">Menu Sambutan /start Bot</option>
                  <option value="inline_button">Tombol Inline Tambahan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Pesan Iklan (Copywriting Singkat)
                </label>
                <textarea
                  rows={3}
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  placeholder="Tuliskan ajakan pesan promosi di sini..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Teks Tombol Telegram <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formButtonText}
                    onChange={(e) => setFormButtonText(e.target.value)}
                    placeholder="Contoh: ⚡ Buka Penawaran"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Target URL / Safelink <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={formTargetUrl}
                    onChange={(e) => setFormTargetUrl(e.target.value)}
                    placeholder="https://t.me/... atau link safelink"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0"
                  />
                  <span className="text-xs font-medium text-slate-300">Aktifkan Iklan Ini Sekarang</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  {editingId ? 'Simpan Perubahan' : 'Terbitkan Iklan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
