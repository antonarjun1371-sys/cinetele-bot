import React, { useState } from 'react';
import { Film, Plus, Search, Play, Edit3, Trash2, Sparkles, Star, Eye, Check, X, Shield, Clock } from 'lucide-react';
import { Movie } from '../types';

interface CatalogManagerProps {
  movies: Movie[];
  initialAddTitle?: string | null;
  onClearInitialAddTitle?: () => void;
  onAddMovie: (movie: Omit<Movie, 'id'>) => void;
  onUpdateMovie: (id: string, updates: Partial<Movie>) => void;
  onDeleteMovie: (id: string) => void;
  onWatchMovie: (movie: Movie) => void;
}

export const CatalogManager: React.FC<CatalogManagerProps> = ({
  movies,
  initialAddTitle,
  onClearInitialAddTitle,
  onAddMovie,
  onUpdateMovie,
  onDeleteMovie,
  onWatchMovie
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('Semua');
  const [filterVipOnly, setFilterVipOnly] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formGenre, setFormGenre] = useState('Action, Sci-Fi');
  const [formYear, setFormYear] = useState(2026);
  const [formRating, setFormRating] = useState(8.5);
  const [formDuration, setFormDuration] = useState('2j 10m');
  const [formQuality, setFormQuality] = useState<'1080p FHD' | '720p HD' | '4K UHD'>('1080p FHD');
  const [formLanguage, setFormLanguage] = useState('Sub Indo');
  const [formSynopsis, setFormSynopsis] = useState('');
  const [formPosterUrl, setFormPosterUrl] = useState('/src/assets/images/hero_cinema_backdrop_1791448461059.jpg');
  const [formStreamUrl, setFormStreamUrl] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
  const [formTelegramFileId, setFormTelegramFileId] = useState('');
  const [formIsTrending, setFormIsTrending] = useState(true);
  const [formIsVip, setFormIsVip] = useState(false);

  // Genres available
  const allGenres = ['Semua', 'Action', 'Sci-Fi', 'Horror', 'Drama', 'Thriller', 'Romance', 'Petualangan'];

  // Handle incoming title from Toast / Requests
  React.useEffect(() => {
    if (initialAddTitle) {
      setEditingId(null);
      setFormTitle(initialAddTitle);
      setFormGenre('Action, Drama');
      setFormYear(2026);
      setFormRating(8.5);
      setFormDuration('2j 00m');
      setFormQuality('1080p FHD');
      setFormLanguage('Sub Indo');
      setFormSynopsis(`Sinopsis resmi untuk ${initialAddTitle} yang diminta oleh penonton.`);
      setFormPosterUrl('/src/assets/images/hero_cinema_backdrop_1791448461059.jpg');
      setFormStreamUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
      setFormTelegramFileId('');
      setFormIsTrending(false);
      setFormIsVip(false);
      setIsModalOpen(true);
      if (onClearInitialAddTitle) onClearInitialAddTitle();
    }
  }, [initialAddTitle, onClearInitialAddTitle]);

  // Filtering
  const filteredMovies = movies.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.synopsis.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre =
      selectedGenre === 'Semua' || m.genre.includes(selectedGenre);
    const matchesVip = !filterVipOnly || m.isVip;
    return matchesSearch && matchesGenre && matchesVip;
  });

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormTitle('');
    setFormGenre('Action, Sci-Fi');
    setFormYear(2026);
    setFormRating(8.5);
    setFormDuration('2j 10m');
    setFormQuality('1080p FHD');
    setFormLanguage('Sub Indo');
    setFormSynopsis('');
    setFormPosterUrl('/src/assets/images/hero_cinema_backdrop_1791448461059.jpg');
    setFormStreamUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
    setFormTelegramFileId('');
    setFormIsTrending(false);
    setFormIsVip(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (m: Movie) => {
    setEditingId(m.id);
    setFormTitle(m.title);
    setFormGenre(m.genre.join(', '));
    setFormYear(m.year);
    setFormRating(m.rating);
    setFormDuration(m.duration);
    setFormQuality(m.quality);
    setFormLanguage(m.language);
    setFormSynopsis(m.synopsis);
    setFormPosterUrl(m.posterUrl);
    setFormStreamUrl(m.streamUrl);
    setFormTelegramFileId(m.telegramFileId || '');
    setFormIsTrending(Boolean(m.isTrending));
    setFormIsVip(Boolean(m.isVip));
    setIsModalOpen(true);
  };

  const handleSaveFilm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const genreList = formGenre.split(',').map((g) => g.trim()).filter(Boolean);

    if (editingId) {
      onUpdateMovie(editingId, {
        title: formTitle,
        genre: genreList,
        year: formYear,
        rating: formRating,
        duration: formDuration,
        quality: formQuality,
        language: formLanguage,
        synopsis: formSynopsis || 'Sinopsis belum tersedia.',
        posterUrl: formPosterUrl,
        streamUrl: formStreamUrl,
        telegramFileId: formTelegramFileId,
        isTrending: formIsTrending,
        isVip: formIsVip
      });
    } else {
      onAddMovie({
        title: formTitle,
        genre: genreList,
        year: formYear,
        rating: formRating,
        duration: formDuration,
        quality: formQuality,
        language: formLanguage,
        synopsis: formSynopsis || 'Sinopsis film bioskop berkualitas tinggi.',
        posterUrl: formPosterUrl,
        streamUrl: formStreamUrl,
        telegramFileId: formTelegramFileId,
        downloadUrl: formStreamUrl,
        isTrending: formIsTrending,
        isVip: formIsVip,
        views: 120,
        addedAt: new Date().toISOString().split('T')[0]
      });
    }

    setIsModalOpen(false);
  };

  const generateSynopsisWithAi = async () => {
    if (!formTitle.trim()) return;
    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/bot/ai-recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: formTitle, type: 'synopsis' })
      });
      const data = await res.json();
      if (data && data.data) {
        if (data.data.synopsis) setFormSynopsis(data.data.synopsis);
        if (data.data.genre && Array.isArray(data.data.genre)) setFormGenre(data.data.genre.join(', '));
        if (data.data.rating) setFormRating(data.data.rating);
        if (data.data.duration) setFormDuration(data.data.duration);
      }
    } catch (err) {
      console.error('Failed to generate AI synopsis:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul film atau kata kunci..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Genre Filter Buttons */}
          <div className="hidden sm:flex items-center gap-1 overflow-x-auto py-1">
            {allGenres.slice(0, 5).map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  selectedGenre === genre
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterVipOnly(!filterVipOnly)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
              filterVipOnly
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/40'
                : 'text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            ⭐ VIP Saja
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-sm cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Film</span>
          </button>
        </div>
      </div>

      {/* Movie Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {filteredMovies.map((movie) => (
          <div
            key={movie.id}
            className="group relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-all flex flex-col"
          >
            {/* Poster Media Box */}
            <div className="relative aspect-[3/4] bg-slate-950 overflow-hidden">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

              {/* Badges */}
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1 text-[11px] font-mono">
                {movie.isVip && (
                  <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded font-bold shadow">
                    VIP
                  </span>
                )}
                {movie.isTrending && (
                  <span className="bg-rose-600 text-white px-2 py-0.5 rounded font-bold shadow">
                    TRENDING
                  </span>
                )}
              </div>

              <div className="absolute top-2.5 right-2.5 text-[11px] bg-black/70 text-slate-200 px-2 py-0.5 rounded font-mono">
                {movie.quality}
              </div>

              {/* Hover quick play button */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                <button
                  onClick={() => onWatchMovie(movie)}
                  className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 shadow-xl transition-transform hover:scale-110 cursor-pointer"
                  title="Tonton Preview"
                >
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </button>
              </div>
            </div>

            {/* Movie Info */}
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100 line-clamp-1 group-hover:text-blue-400 transition-colors">
                  {movie.title}
                </h3>

                {/* Zero-pill metadata */}
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1 font-mono">
                  <span>{movie.year}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-400 font-semibold">{movie.rating} ⭐</span>
                  <span aria-hidden="true">·</span>
                  <span>{movie.duration}</span>
                </div>

                <div className="text-[11px] text-slate-400 mt-1.5 line-clamp-1">
                  {movie.genre.join(', ')}
                </div>

                <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {movie.synopsis}
                </p>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{movie.views?.toLocaleString() || 120} views</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(movie)}
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                    title="Edit Film"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteMovie(movie.id)}
                    className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded transition-colors"
                    title="Hapus Film"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredMovies.length === 0 && (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl">
          <Film className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-200">Tidak ada film yang cocok</h4>
          <p className="text-xs text-slate-400 mt-1">Coba gunakan kata kunci pencarian atau kategori lain.</p>
        </div>
      )}

      {/* Add / Edit Film Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100">
                {editingId ? 'Edit Metadata Film' : 'Tambah Film ke Katalog Bot'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFilm} className="p-6 space-y-4">
              {/* Title with AI Autocomplete button */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Judul Film <span className="text-rose-400">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Contoh: Dune Part Two (2024)"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={generateSynopsisWithAi}
                    disabled={isGeneratingAi || !formTitle.trim()}
                    className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40"
                    title="Gunakan AI untuk membuat sinopsis dan genre otomatis"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isGeneratingAi ? 'Menulis...' : 'AI Auto-Fill'}</span>
                  </button>
                </div>
              </div>

              {/* Genre & Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Genre (pisahkan dengan koma)
                  </label>
                  <input
                    type="text"
                    value={formGenre}
                    onChange={(e) => setFormGenre(e.target.value)}
                    placeholder="Action, Sci-Fi, Thriller"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tahun Rilis
                  </label>
                  <input
                    type="number"
                    value={formYear}
                    onChange={(e) => setFormYear(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Rating, Duration, Quality */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Rating (1-10)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formRating}
                    onChange={(e) => setFormRating(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Durasi
                  </label>
                  <input
                    type="text"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    placeholder="2j 15m"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Kualitas Video
                  </label>
                  <select
                    value={formQuality}
                    onChange={(e) => setFormQuality(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="1080p FHD">1080p FHD</option>
                    <option value="720p HD">720p HD</option>
                    <option value="4K UHD">4K UHD</option>
                  </select>
                </div>
              </div>

              {/* Synopsis */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Sinopsis Bahasa Indonesia
                </label>
                <textarea
                  rows={3}
                  value={formSynopsis}
                  onChange={(e) => setFormSynopsis(e.target.value)}
                  placeholder="Ceritakan ringkasan cerita film di sini..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 leading-relaxed placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Streaming URL & Poster */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    URL Video / MP4 Streaming
                  </label>
                  <input
                    type="text"
                    value={formStreamUrl}
                    onChange={(e) => setFormStreamUrl(e.target.value)}
                    placeholder="https://domain.com/video.mp4"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    URL Poster Gambar
                  </label>
                  <input
                    type="text"
                    value={formPosterUrl}
                    onChange={(e) => setFormPosterUrl(e.target.value)}
                    placeholder="/src/assets/images/... atau https://..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Telegram File ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Telegram File ID (Opsional jika video disimpan di Telegram Bot)
                </label>
                <input
                  type="text"
                  value={formTelegramFileId}
                  onChange={(e) => setFormTelegramFileId(e.target.value)}
                  placeholder="BAACAgUAAxkBAAICcGe..._file_id"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Checkboxes */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsTrending}
                    onChange={(e) => setFormIsTrending(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0"
                  />
                  <span className="text-xs font-medium text-slate-300">Tampilkan di Trending 🔥</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsVip}
                    onChange={(e) => setFormIsVip(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0"
                  />
                  <span className="text-xs font-medium text-slate-300">Khusus Member VIP ⭐</span>
                </label>
              </div>

              {/* Submit Buttons */}
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
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  {editingId ? 'Simpan Perubahan' : 'Tambahkan ke Katalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
