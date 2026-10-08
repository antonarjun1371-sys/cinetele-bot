import React, { useState, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  TrendingUp, Users, Eye, MousePointerClick, Film, DollarSign,
  Calendar, ArrowUpRight, BarChart3, PieChart as PieIcon, Layers
} from 'lucide-react';
import { Movie, TelegramAd } from '../types';

interface AnalyticsProps {
  movies: Movie[];
  ads: TelegramAd[];
}

export const Analytics: React.FC<AnalyticsProps> = ({ movies, ads }) => {
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d'>('7d');
  const [chartView, setChartView] = useState<'all' | 'users' | 'ads'>('all');

  // Aggregated Totals
  const totalImpressions = useMemo(() => ads.reduce((acc, a) => acc + (a.impressions || 0), 0), [ads]);
  const totalClicks = useMemo(() => ads.reduce((acc, a) => acc + (a.clicks || 0), 0), [ads]);
  const overallCtr = useMemo(() => totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00', [totalImpressions, totalClicks]);
  const totalMovieViews = useMemo(() => movies.reduce((acc, m) => acc + (m.views || 0), 0), [movies]);

  // Estimated revenue based on average CPM and CPC in Telegram movie bots
  const estimatedRevenue = useMemo(() => {
    // Estimasi Rp 15 per tayangan + Rp 350 per klik iklan sponsor
    const cpmRev = (totalImpressions / 1000) * 15000;
    const cpcRev = totalClicks * 350;
    return Math.round(cpmRev + cpcRev);
  }, [totalImpressions, totalClicks]);

  // Generate Daily Trends based on timeRange
  const trendData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;
    const data = [];
    const baseDate = new Date(2026, 3, 8); // Current simulated baseline date

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      const dateLabel = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

      // Daily dynamic coefficients based on catalog size and ads count
      const variance = 0.85 + Math.sin(i * 1.2) * 0.25;
      const dau = Math.round((2800 + movies.length * 240) * variance);
      const streams = Math.round((4200 + movies.length * 480) * variance);
      const impressions = Math.round((totalImpressions / 12) * variance);
      const clicks = Math.round((totalClicks / 12) * variance);
      const ctr = impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0;

      data.push({
        date: dateLabel,
        dau,
        streams,
        impressions,
        clicks,
        ctr
      });
    }
    return data;
  }, [timeRange, movies.length, totalImpressions, totalClicks]);

  // Ad Campaign Breakdown Data for BarChart
  const campaignData = useMemo(() => {
    if (ads.length === 0) return [];
    return ads.map((ad) => {
      const ctr = ad.impressions > 0 ? Number(((ad.clicks / ad.impressions) * 100).toFixed(1)) : 0;
      return {
        name: ad.title.length > 20 ? `${ad.title.slice(0, 18)}...` : ad.title,
        sponsor: ad.sponsorName,
        tayang: ad.impressions,
        klik: ad.clicks,
        ctr,
        placement: ad.placement
      };
    });
  }, [ads]);

  // Placement Performance Data
  const placementData = useMemo(() => {
    const map: Record<string, { label: string; impressions: number; clicks: number }> = {
      movie_footer: { label: 'Bawah Kartu Film', impressions: 0, clicks: 0 },
      preroll_stream: { label: 'Pre-roll Video', impressions: 0, clicks: 0 },
      start_menu: { label: 'Menu /start', impressions: 0, clicks: 0 },
      inline_button: { label: 'Tombol Inline', impressions: 0, clicks: 0 }
    };

    ads.forEach((ad) => {
      if (map[ad.placement]) {
        map[ad.placement].impressions += ad.impressions;
        map[ad.placement].clicks += ad.clicks;
      }
    });

    return Object.values(map).map((p) => ({
      ...p,
      ctr: p.impressions > 0 ? Number(((p.clicks / p.impressions) * 100).toFixed(1)) : 0
    }));
  }, [ads]);

  // Genre Popularity from Movies Catalog
  const genreData = useMemo(() => {
    const counts: Record<string, number> = {};
    movies.forEach((m) => {
      m.genre.forEach((g) => {
        counts[g] = (counts[g] || 0) + (m.views || 100);
      });
    });

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'];
    return Object.entries(counts).map(([name, value], idx) => ({
      name,
      value,
      color: colors[idx % colors.length]
    })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [movies]);

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700/80 p-3 rounded-xl shadow-2xl text-xs space-y-1 z-50">
          <p className="font-semibold text-slate-200 border-b border-slate-800 pb-1 mb-1 font-mono">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4 font-mono">
              <span style={{ color: entry.color || entry.stroke }}>{entry.name}:</span>
              <span className="font-bold text-white tabular-nums">
                {entry.name.includes('CTR') || entry.name.includes('Rasio')
                  ? `${entry.value}%`
                  : entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Analitik Performa & Monetisasi Bot</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualisasi tren pengguna harian (DAU), tayangan iklan, rasio klik (CTR), dan katalog film
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Time range selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
            {(['7d', '14d', '30d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {range === '7d' ? '7 Hari' : range === '14d' ? '14 Hari' : '30 Hari'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards (Clean unboxed layout with tabular numerals) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-400" />
              <span>Pengguna Aktif (DAU)</span>
            </span>
            <span className="text-emerald-400 font-mono text-[11px] flex items-center">
              +14.2% <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-2xl font-bold text-white font-mono tabular-nums">
            {(3420 + movies.length * 180).toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Rata-rata interaksi chat bot harian</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-purple-400" />
              <span>Tayangan Iklan (Impressions)</span>
            </span>
            <span className="text-emerald-400 font-mono text-[11px] flex items-center">
              +28.5% <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-2xl font-bold text-white font-mono tabular-nums">
            {totalImpressions.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Total tampilan banner & sponsor bot</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1.5">
              <MousePointerClick className="w-4 h-4 text-amber-400" />
              <span>Klik & Rata-rata CTR</span>
            </span>
            <span className="text-emerald-400 font-mono text-[11px] flex items-center">
              {overallCtr}% CTR
            </span>
          </div>
          <p className="text-2xl font-bold text-amber-400 font-mono tabular-nums">
            {totalClicks.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Total klik tautan sponsor telegram</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Estimasi Monetisasi</span>
            </span>
            <span className="text-emerald-400 font-mono text-[11px]">CPM + CPC</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            Rp {estimatedRevenue.toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Potensi pendapatan iklan & sponsor</p>
        </div>
      </div>

      {/* Chart 1: DAU & Streaming Activity Trends (AreaChart) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
          <div>
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span>Tren Pertumbuhan Pengguna Aktif (DAU) & Pemutaran Film</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Fluktuasi harian pengguna yang menggunakan bot dan memulai sesi nonton film
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-500 inline-block" />
              <span>DAU Bot</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
              <span>Stream Ditonton</span>
            </div>
          </div>
        </div>

        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="dauGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="streamGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="dau"
                name="Pengguna Aktif"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#dauGradient)"
              />
              <Area
                type="monotone"
                dataKey="streams"
                name="Pemutaran Film"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#streamGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row with Two Columns: Ad Impressions vs Clicks + Placement CTR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 2: Performa Kampanye Iklan (BarChart) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <span>Tayangan & Klik per Kampanye Iklan</span>
              </h4>
            </div>
            <p className="text-xs text-slate-400">
              Perbandingan total tayang (kiri) vs total klik (kanan) untuk tiap sponsor aktif
            </p>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campaignData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  formatter={(value) => <span className="text-slate-300">{value}</span>}
                />
                <Bar dataKey="tayang" name="Tayangan Iklan" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="klik" name="Klik Pengguna" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Click-Through Rate (CTR %) Tren Harian (LineChart) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Tren Rasio Klik Iklan (CTR %)</span>
              </h4>
            </div>
            <p className="text-xs text-slate-400">
              Persentase konversi klik pengguna dari total tayangan iklan per hari
            </p>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 11, fontFamily: 'monospace' }}
                  unit="%"
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="ctr"
                  name="CTR (%)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#10b981' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Posisi Penempatan Iklan vs Distribusi Genre Film */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Placement Performance Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="pb-2 border-b border-slate-800">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Efektivitas Posisi Penempatan Iklan</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Analisis performa posisi iklan yang paling sering diklik oleh penonton
            </p>
          </div>

          <div className="space-y-3 pt-1">
            {placementData.map((pos) => {
              const maxImp = Math.max(...placementData.map((p) => p.impressions), 1);
              const pct = Math.round((pos.impressions / maxImp) * 100);
              return (
                <div key={pos.label} className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-200">{pos.label}</span>
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-slate-400">{pos.impressions.toLocaleString()} views</span>
                      <span className="text-blue-400">{pos.clicks.toLocaleString()} klik</span>
                      <span className="text-emerald-400 font-bold">{pos.ctr}% CTR</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Genre Popularity Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="pb-2 border-b border-slate-800">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-purple-400" />
              <span>Distribusi Minat Genre Film ({movies.length} Judul)</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Kategori film yang paling banyak dicari dan ditonton di katalog bot
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 h-64">
            <div className="w-full sm:w-1/2 h-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genreData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {genreData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="w-full sm:w-1/2 space-y-2 text-xs">
              {genreData.map((g) => (
                <div key={g.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color }} />
                    <span className="text-slate-300 font-medium">{g.name}</span>
                  </div>
                  <span className="font-mono text-slate-400 tabular-nums">
                    {g.value.toLocaleString()} views
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
