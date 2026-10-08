import React, { useState } from 'react';
import { Bot, Key, CheckCircle, AlertTriangle, Radio, Globe, Shield, RefreshCw, ExternalLink, Copy, Check, Power, Send } from 'lucide-react';
import { BotConfig } from '../types';

interface BotIntegrationProps {
  config: BotConfig;
  onUpdateConfig: (newConfig: Partial<BotConfig>) => Promise<void>;
}

export const BotIntegration: React.FC<BotIntegrationProps> = ({ config, onUpdateConfig }) => {
  const [tokenInput, setTokenInput] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isTestingToken, setIsTestingToken] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; botDetails?: any } | null>(null);
  
  // Local editable fields
  const [welcomeText, setWelcomeText] = useState(config.welcomeMessage);
  const [forceSub, setForceSub] = useState(config.forceSubEnabled);
  const [channelUser, setChannelUser] = useState(config.channelUsername);
  const [channelLink, setChannelLink] = useState(config.channelInviteLink);
  const [vipEnabled, setVipEnabled] = useState(config.vipEnabled);
  const [vipFee, setVipFee] = useState(config.vipFeeInfo);
  const [allowReq, setAllowReq] = useState(config.allowRequestFilm);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isTogglingPolling, setIsTogglingPolling] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const handleTestToken = async () => {
    const tokenToTest = tokenInput.trim();
    if (!tokenToTest) {
      setTestResult({ ok: false, message: 'Harap masukkan Bot Token Telegram terlebih dahulu.' });
      return;
    }

    setIsTestingToken(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/bot/test-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenToTest })
      });
      const data = await res.json();

      if (data.ok && data.bot) {
        setTestResult({
          ok: true,
          message: `Koneksi Berhasil! Terhubung ke @${data.bot.username} (${data.bot.name})`,
          botDetails: data.bot
        });
      } else {
        setTestResult({
          ok: false,
          message: data.error || 'Token ditolak oleh Telegram Bot API. Periksa kembali token dari @BotFather.'
        });
      }
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: err.message || 'Gagal menghubungi server Telegram.'
      });
    } finally {
      setIsTestingToken(false);
    }
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateConfig({
        ...(tokenInput.trim() ? { botToken: tokenInput.trim() } : {}),
        welcomeMessage: welcomeText,
        forceSubEnabled: forceSub,
        channelUsername: channelUser,
        channelInviteLink: channelLink,
        vipEnabled: vipEnabled,
        vipFeeInfo: vipFee,
        allowRequestFilm: allowReq
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const togglePolling = async () => {
    setIsTogglingPolling(true);
    try {
      const res = await fetch('/api/bot/polling/toggle', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        await onUpdateConfig({ pollingActive: data.pollingActive });
      } else {
        alert(data.error || 'Gagal mengubah status polling');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTogglingPolling(false);
    }
  };

  const handleSetWebhook = async () => {
    try {
      const res = await fetch('/api/bot/set-webhook', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        alert(`Webhook Telegram berhasil didaftarkan ke: ${data.webhookUrl}`);
        await onUpdateConfig({ webhookUrl: data.webhookUrl });
      } else {
        alert(data.error || 'Gagal mendaftarkan webhook');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyWebhookUrl = () => {
    const fullUrl = `${window.location.origin}/api/bot/webhook`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Bot Connection Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">{config.botName}</h3>
                <span className="text-xs font-mono text-blue-400">@{config.botUsername}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Konfigurasi Telegram Bot API, Webhook, dan Live Polling Engine
              </p>
            </div>
          </div>

          {/* Real Live Polling Switch */}
          <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-200 block">
                Live Polling di Telegram
              </span>
              <span className="text-[10px] text-slate-400">
                {config.pollingActive ? 'Bot aktif di aplikasi Telegram' : 'Mode offline / stand-by'}
              </span>
            </div>
            <button
              onClick={togglePolling}
              disabled={isTogglingPolling}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                config.pollingActive
                  ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
              title={config.pollingActive ? 'Matikan Polling' : 'Nyalakan Polling'}
            >
              <Power className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Token Input Section */}
        <div className="mt-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Telegram Bot Token (dari @BotFather)</span>
              </label>
              <a
                href="https://t.me/BotFather"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>Buka @BotFather</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex gap-2">
              <input
                type={showToken ? 'text' : 'password'}
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder={config.botToken ? `Token tersimpan: ${config.botToken}` : 'Contoh: 7891234567:AAFnGqX...'}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 font-mono placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 rounded-lg"
              >
                {showToken ? 'Sembunyikan' : 'Lihat'}
              </button>
              <button
                type="button"
                onClick={handleTestToken}
                disabled={isTestingToken}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingToken ? 'animate-spin' : ''}`} />
                <span>{isTestingToken ? 'Mengecek...' : 'Tes Koneksi'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Jika belum punya token, ketik <code>/newbot</code> di akun resmi Telegram <b>@BotFather</b> lalu salin API token yang diberikan.
            </p>
          </div>

          {/* Test Status Banner */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                testResult.ok
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
              }`}
            >
              {testResult.ok ? (
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="text-xs">
                <p className="font-semibold">{testResult.message}</p>
                {testResult.botDetails && (
                  <div className="mt-1 text-[11px] text-emerald-400/80 font-mono">
                    ID: {testResult.botDetails.id} · Username: @{testResult.botDetails.username} · Izin Grup: Aktif
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Webhook Info Card */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-slate-200">Endpoint Webhook Bot</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono break-all">
                {window.location.origin}/api/bot/webhook
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={copyWebhookUrl}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
              >
                {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedWebhook ? 'Tersalin' : 'Salin URL'}</span>
              </button>
              <button
                type="button"
                onClick={handleSetWebhook}
                className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Daftarkan Webhook</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* Force Subscribe (FSub) Gate */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-emerald-400" />
              <div>
                <h4 className="text-sm font-bold text-slate-100">Force Subscribe (Wajib Join Channel)</h4>
                <p className="text-[11px] text-slate-400">Pengguna wajib join channel Telegram sebelum bisa membuka link nonton</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={forceSub}
                onChange={(e) => setForceSub(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Username Channel Sponsor
              </label>
              <input
                type="text"
                value={channelUser}
                onChange={(e) => setChannelUser(e.target.value)}
                placeholder="@CinemaIndo_Official"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Link Undangan Channel (Invite Link)
              </label>
              <input
                type="text"
                value={channelLink}
                onChange={(e) => setChannelLink(e.target.value)}
                placeholder="https://t.me/nama_channel"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            *Pastikan akun Bot Anda telah dijadikan <b>Admin</b> di channel tersebut agar bot dapat memverifikasi status anggota secara otomatis.
          </p>
        </div>

        {/* Welcome Message Customizer */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h4 className="text-sm font-bold text-slate-100">Pesan Selamat Datang (/start)</h4>
            <p className="text-[11px] text-slate-400">Pesan otomatis yang dikirim ketika penonton pertama kali mengetik /start</p>
          </div>

          <div>
            <textarea
              rows={4}
              value={welcomeText}
              onChange={(e) => setWelcomeText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 font-mono leading-relaxed focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* VIP & Request Settings */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h4 className="text-sm font-bold text-slate-100">Monetisasi VIP & Permintaan Film</h4>
            <p className="text-[11px] text-slate-400">Opsi berlangganan film 4K tanpa antrean dan fitur /request</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Keterangan Biaya VIP
              </label>
              <input
                type="text"
                value={vipFee}
                onChange={(e) => setVipFee(e.target.value)}
                placeholder="Rp 15.000 / Bulan"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-col justify-center space-y-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={vipEnabled}
                  onChange={(e) => setVipEnabled(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0"
                />
                <span className="text-xs font-medium text-slate-300">Aktifkan Menu Akses VIP di Bot</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowReq}
                  onChange={(e) => setAllowReq(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0"
                />
                <span className="text-xs font-medium text-slate-300">Izinkan Penonton Mengirim /request Film</span>
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {saveSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              <span>Pengaturan Berhasil Disimpan!</span>
            </span>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-lg cursor-pointer disabled:opacity-50"
          >
            {isSaving ? 'Menyimpan...' : 'Simpan Semua Konfigurasi'}
          </button>
        </div>
      </form>
    </div>
  );
};
