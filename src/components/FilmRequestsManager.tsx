import React from 'react';
import { Film, CheckCircle, Clock, Check, Plus, MessageSquare } from 'lucide-react';
import { FilmRequest } from '../types';

interface FilmRequestsManagerProps {
  requests: FilmRequest[];
  onUpdateStatus: (id: string, status: FilmRequest['status']) => void;
  onQuickAddToCatalog: (title: string) => void;
}

export const FilmRequestsManager: React.FC<FilmRequestsManagerProps> = ({
  requests,
  onUpdateStatus,
  onQuickAddToCatalog
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Antrean Request Film Penonton</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Daftar film yang diminta oleh pengguna bot melalui perintah /request
            </p>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="p-12 text-center">
            <Film className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">Belum ada request film dari penonton.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800 mt-2">
            {requests.map((req) => (
              <div key={req.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-100">{req.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-mono">
                    <span className="text-blue-400">{req.user}</span>
                    <span aria-hidden="true">·</span>
                    <span>{req.createdAt}</span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={`text-[11px] font-semibold ${
                        req.status === 'available'
                          ? 'text-emerald-400'
                          : req.status === 'approved'
                          ? 'text-amber-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {req.status === 'available' ? '✅ Tersedia di Katalog' : req.status === 'approved' ? '⏳ Sedang Dicari' : 'Menunggu Review'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {req.status !== 'available' && (
                    <button
                      onClick={() => onQuickAddToCatalog(req.title)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Upload Film</span>
                    </button>
                  )}

                  <select
                    value={req.status}
                    onChange={(e) => onUpdateStatus(req.id, e.target.value as any)}
                    className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="pending">Menunggu</option>
                    <option value="approved">Disetujui</option>
                    <option value="available">Tersedia</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
