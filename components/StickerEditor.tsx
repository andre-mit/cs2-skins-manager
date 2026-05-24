'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Search, X, Loader2, Plus, Settings2 } from 'lucide-react';
import Image from 'next/image';
import { StickerSlot, StickerData, Dictionary } from '@/lib/types';

interface StickerEditorProps {
  stickers: StickerSlot[];
  onChange: (stickers: StickerSlot[]) => void;
  locale: string;
  t: Dictionary;
}

export function StickerEditor({ stickers, onChange, locale, t }: StickerEditorProps) {
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [stickerCatalog, setStickerCatalog] = useState<StickerData[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // State to toggle advanced settings visibility per slot
  const [expandedSlots, setExpandedSlots] = useState<Record<number, boolean>>({});

  // Fetch stickers from API
  const fetchStickers = useCallback(async (searchQuery: string, offset: number, append: boolean = false) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        locale,
        search: searchQuery,
        offset: String(offset),
        limit: '50',
      });
      const res = await fetch(`/api/stickers?${params}`);
      const data = await res.json();
      
      if (append) {
        setStickerCatalog(prev => [...prev, ...data.stickers]);
      } else {
        setStickerCatalog(data.stickers);
      }
      setHasMore(data.hasMore);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to fetch stickers:', err);
    } finally {
      setIsLoading(false);
    }
  }, [locale]);

  // Load stickers when picker opens
  useEffect(() => {
    if (showPicker) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchStickers(search, 0);
    }
  }, [showPicker]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  useEffect(() => {
    if (!showPicker) return;
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchStickers(search, 0);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite scroll
  const handleScroll = useCallback(() => {
    if (!scrollRef.current || isLoading || !hasMore) return;
    const el = scrollRef.current;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
      fetchStickers(search, stickerCatalog.length, true);
    }
  }, [isLoading, hasMore, search, stickerCatalog.length, fetchStickers]);

  // Select sticker for active slot
  const handleSelectSticker = (sticker: StickerData) => {
    if (activeSlot === null) return;
    const newStickers = [...stickers];
    newStickers[activeSlot] = {
      id: sticker.id,
      schema: 0,
      x: 0,
      y: 0,
      wear: 0,
      scale: 1,
      rotation: 0,
    };
    onChange(newStickers);
    setShowPicker(false);
    setActiveSlot(null);
  };

  // Remove sticker from slot
  const handleRemoveSticker = (slotIndex: number) => {
    const newStickers = [...stickers];
    newStickers[slotIndex] = { id: 0, schema: 0, x: 0, y: 0, wear: 0, scale: 0, rotation: 0 };
    onChange(newStickers);
  };

  // Update specific field of a sticker
  const handleUpdateStickerField = (slotIndex: number, field: keyof StickerSlot, value: number) => {
    const newStickers = [...stickers];
    newStickers[slotIndex] = { ...newStickers[slotIndex], [field]: value };
    onChange(newStickers);
  };

  const toggleExpanded = (slotIndex: number) => {
    setExpandedSlots(prev => ({ ...prev, [slotIndex]: !prev[slotIndex] }));
  };

  // Find sticker image by ID from catalog (used for display)
  const [stickerImages, setStickerImages] = useState<Record<number, string>>({});
  
  useEffect(() => {
    const neededIds = stickers.filter(s => s.id > 0 && !stickerImages[s.id]).map(s => s.id);
    if (neededIds.length === 0) return;

    const fetchStickerImages = async () => {
      try {
        const res = await fetch(`/api/stickers?locale=${locale}&search=&offset=0&limit=10000`);
        const data = await res.json();
        const map: Record<number, string> = {};
        for (const s of data.stickers) {
          if (neededIds.includes(s.id)) {
            map[s.id] = s.image_url || '';
          }
        }
        setStickerImages(prev => ({ ...prev, ...map }));
      } catch { /* ignore */ }
    };
    fetchStickerImages();
  }, [stickers, locale]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium text-neutral-400">{t.stickers}</label>
      
      <div className="space-y-3">
        {stickers.map((sticker, index) => (
          <div key={index} className="border border-neutral-800 rounded-xl bg-neutral-900/50 overflow-hidden">
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-500">
                  {index + 1}
                </div>
                {sticker.id > 0 ? (
                  <div className="flex items-center gap-2">
                    {stickerImages[sticker.id] ? (
                      <Image src={stickerImages[sticker.id]} alt="" width={32} height={32} className="w-8 h-8 object-contain drop-shadow-md" />
                    ) : (
                      <div className="w-8 h-8 flex items-center justify-center"><Loader2 className="w-4 h-4 text-neutral-500 animate-spin" /></div>
                    )}
                    <span className="text-sm font-medium text-neutral-300">Sticker Selected</span>
                  </div>
                ) : (
                  <span className="text-sm text-neutral-500">No sticker</span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {sticker.id > 0 ? (
                  <>
                    <button
                      onClick={() => toggleExpanded(index)}
                      className={`p-1.5 rounded-lg transition-colors ${expandedSlots[index] ? 'bg-rose-500/10 text-rose-400' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
                      title="Advanced Settings"
                    >
                      <Settings2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveSticker(index)}
                      className="p-1.5 rounded-lg text-red-400 hover:text-white hover:bg-red-500/20 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setActiveSlot(index);
                      setShowPicker(true);
                      setSearch('');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors text-xs font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                )}
              </div>
            </div>

            {/* Advanced Settings Panel */}
            {sticker.id > 0 && expandedSlots[index] && (
              <div className="p-3 border-t border-neutral-800 bg-neutral-950 grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-neutral-500 font-bold">Wear</label>
                  <input 
                    type="number" step="0.01" min="0" max="1"
                    className="w-full bg-neutral-900 border border-neutral-800 text-xs rounded-lg px-2 py-1.5 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    value={sticker.wear}
                    onChange={(e) => handleUpdateStickerField(index, 'wear', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-neutral-500 font-bold">X Offset</label>
                  <input 
                    type="number" step="0.01"
                    className="w-full bg-neutral-900 border border-neutral-800 text-xs rounded-lg px-2 py-1.5 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    value={sticker.x}
                    onChange={(e) => handleUpdateStickerField(index, 'x', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-neutral-500 font-bold">Y Offset</label>
                  <input 
                    type="number" step="0.01"
                    className="w-full bg-neutral-900 border border-neutral-800 text-xs rounded-lg px-2 py-1.5 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    value={sticker.y}
                    onChange={(e) => handleUpdateStickerField(index, 'y', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-neutral-500 font-bold">Scale</label>
                  <input 
                    type="number" step="0.01"
                    className="w-full bg-neutral-900 border border-neutral-800 text-xs rounded-lg px-2 py-1.5 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    value={sticker.scale}
                    onChange={(e) => handleUpdateStickerField(index, 'scale', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-neutral-500 font-bold">Rotation</label>
                  <input 
                    type="number" step="1"
                    className="w-full bg-neutral-900 border border-neutral-800 text-xs rounded-lg px-2 py-1.5 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    value={sticker.rotation}
                    onChange={(e) => handleUpdateStickerField(index, 'rotation', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Sticker picker modal (overlay over the slots) */}
      {showPicker && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between flex-shrink-0">
              <span className="font-bold text-white">
                {t.selectSticker} — {t.stickerSlot} {(activeSlot ?? 0) + 1}
              </span>
              <button 
                onClick={() => { setShowPicker(false); setActiveSlot(null); }}
                className="p-2 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  placeholder={t.searchSticker}
                  className="w-full bg-neutral-950 border border-neutral-800 text-sm rounded-xl pl-10 pr-4 py-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="text-xs text-neutral-600">
                {total > 0 ? `${total} stickers` : ''}
              </div>

              <div 
                ref={scrollRef}
                onScroll={handleScroll}
                className="grid grid-cols-3 sm:grid-cols-5 gap-3 max-h-[300px] overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent"
              >
                {stickerCatalog.map((sticker) => (
                  <button
                    key={sticker.id}
                    onClick={() => handleSelectSticker(sticker)}
                    className="flex flex-col items-center p-3 rounded-xl border border-neutral-800 bg-neutral-950 hover:border-rose-500/50 hover:bg-rose-500/10 transition-colors"
                  >
                    {sticker.image_url && (
                      <Image 
                        src={sticker.image_url} 
                        alt={sticker.name} 
                        width={48}
                        height={48}
                        className="w-12 h-12 object-contain mb-2 drop-shadow-md"
                        loading="lazy"
                        draggable={false}
                      />
                    )}
                    <span className="text-[10px] text-neutral-400 font-semibold truncate w-full text-center">
                      {sticker.name.replace('Sticker | ', '')}
                    </span>
                  </button>
                ))}
                
                {isLoading && (
                  <div className="col-span-full flex justify-center py-4">
                    <Loader2 className="w-6 h-6 text-neutral-500 animate-spin" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
