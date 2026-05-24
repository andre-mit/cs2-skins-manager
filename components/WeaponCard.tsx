'use client';

import { useState, useTransition } from 'react';
import { Settings, Loader2, Search, Hash, Tag } from 'lucide-react';
import { updateSkin, updateAgent, updateGlove, updateMusic, updatePin, removeItem, updateKnifeWithSkin } from '@/app/actions';
import { Dictionary, SkinData, WeaponData, AgentData, StickerSlot } from '@/lib/types';
import { StickerEditor } from './StickerEditor';
import Image from 'next/image';

type CardItemData = {
  weapon_name?: string;
  paint_name?: string;
  agent_name?: string;
  name?: string;
  image_url?: string | null;
};

type SelectedItemData = {
  knife?: string;
  agent?: string;
  music_id?: number;
  id?: number;
  weapon_defindex?: number;
  weapon_paint_id?: number;
  weapon_wear?: number;
  weapon_seed?: number;
  weapon_stattrak?: boolean | number;
  weapon_nametag?: string | null;
  weapon_stickers?: StickerSlot[];
};

interface WeaponCardProps {
  type: 'knife' | 'weapon' | 'agent' | 'glove' | 'music' | 'pin';
  defindex: number;
  items: Record<string | number, CardItemData>;
  selectedItem: SelectedItemData | null;
  defaultWeapon?: WeaponData;
  teamId: number;
  knifeSkins?: Record<number, Record<number, SkinData>>; // For knife: all skins indexed by defindex
  locale?: string;
  t: Dictionary;
}

const DEFAULT_STICKERS: StickerSlot[] = Array.from({ length: 5 }, () => ({
  id: 0, schema: 0, x: 0, y: 0, wear: 0, scale: 0, rotation: 0,
}));

export function WeaponCard({ type, defindex, items, selectedItem, defaultWeapon, teamId, knifeSkins, locale = 'en', t }: WeaponCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState('');

  // --- Knife two-step state ---
  const [knifeStep, setKnifeStep] = useState<'model' | 'skin'>('model');
  const [selectedKnifeDefindex, setSelectedKnifeDefindex] = useState<number | null>(() => {
    if (type === 'knife' && selectedItem && 'knife' in selectedItem) {
      // Find the defindex matching the selected knife weapon_name
      const match = Object.entries(items).find(([, k]: [string, CardItemData]) => k.weapon_name === selectedItem.knife);
      return match ? parseInt(match[0], 10) : null;
    }
    return null;
  });

  // Local state for modal
  const [selectedId, setSelectedId] = useState<string>(
    type === 'agent' && selectedItem && 'agent' in selectedItem
      ? selectedItem.agent
      : type === 'glove' && selectedItem && 'weapon_paint_id' in selectedItem
        ? `${selectedItem.weapon_defindex}-${selectedItem.weapon_paint_id}`
        : type === 'music' && selectedItem && 'music_id' in selectedItem
          ? String(selectedItem.music_id)
          : type === 'pin' && selectedItem && 'id' in selectedItem
            ? String(selectedItem.id)
            : type === 'knife' && selectedItem && 'knife' in selectedItem
              ? Object.keys(items).find(k => items[k as keyof typeof items]?.weapon_name === selectedItem.knife) || Object.keys(items)[0]
              : selectedItem && 'weapon_paint_id' in selectedItem ? String(selectedItem.weapon_paint_id) : "0"
  );

  const [wear, setWear] = useState<string>(
    selectedItem && 'weapon_wear' in selectedItem ? selectedItem.weapon_wear.toFixed(2) : "0.00"
  );
  const [seed, setSeed] = useState<string>(
    selectedItem && 'weapon_seed' in selectedItem ? String(selectedItem.weapon_seed) : "0"
  );

  // --- StatTrak & NameTag state ---
  const [stattrak, setStattrak] = useState<boolean>(
    selectedItem && 'weapon_stattrak' in selectedItem ? !!selectedItem.weapon_stattrak : false
  );
  const [nametag, setNametag] = useState<string>(
    selectedItem && 'weapon_nametag' in selectedItem && selectedItem.weapon_nametag ? selectedItem.weapon_nametag : ''
  );

  // --- Sticker state ---
  const [stickers, setStickers] = useState<StickerSlot[]>(
    selectedItem && 'weapon_stickers' in selectedItem && Array.isArray(selectedItem.weapon_stickers)
      ? selectedItem.weapon_stickers
      : [...DEFAULT_STICKERS]
  );

  // --- Knife skin selection state ---
  const [selectedKnifePaintId, setSelectedKnifePaintId] = useState<string>("0");
  const [knifeSearch, setKnifeSearch] = useState('');

  const handleSave = () => {
    startTransition(() => {
      if (type === 'agent') {
        updateAgent(selectedId, teamId);
      } else if (type === 'glove') {
        updateGlove(selectedId, wear, seed, teamId);
      } else if (type === 'music') {
        updateMusic(parseInt(selectedId, 10), teamId);
      } else if (type === 'pin') {
        updatePin(parseInt(selectedId, 10), teamId);
      } else if (type === 'knife') {
        const knifeDefindex = selectedKnifeDefindex || 0;
        const paintId = parseInt(selectedKnifePaintId, 10) || 0;
        updateKnifeWithSkin(knifeDefindex, paintId, wear, seed, teamId, nametag || null, stattrak);
      } else {
        const forma = `${defindex}-${selectedId}`;
        updateSkin(forma, wear, seed, teamId, nametag || null, stattrak, stickers);
      }
      setIsModalOpen(false);
    });
  };

  const handleRemove = () => {
    startTransition(() => {
      removeItem(type, defindex, teamId);
      setIsModalOpen(false);
    });
  };

  let currentItems = items || {};
  if (type === 'agent') {
    const agents = items as Record<string, AgentData>;
    currentItems = Object.fromEntries(
      Object.entries(agents).filter(([, agent]) => agent.team === teamId)
    );
  }

  const filteredItems = Object.entries(currentItems).filter(([, item]: [string, CardItemData]) => {
    const name = type === 'knife' ? item.weapon_name : type === 'agent' ? item.agent_name : item.name || item.paint_name;
    return name?.toLowerCase().includes(search.toLowerCase());
  });

  // Knife skins for the selected knife model
  const knifeSkinItems = type === 'knife' && selectedKnifeDefindex && knifeSkins
    ? knifeSkins[selectedKnifeDefindex] || {}
    : {};

  const filteredKnifeSkins = Object.entries(knifeSkinItems).filter(([, skin]: [string, CardItemData]) => {
    return skin.paint_name?.toLowerCase().includes(knifeSearch.toLowerCase());
  });

  // Determine current display info
  const currentDisplay = getDisplayInfo(type, selectedItem, items, defaultWeapon, defindex, knifeSkins);

  // Get the weapon image URL for the sticker editor
  const weaponImageUrl = currentDisplay.image;

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="group relative flex flex-col items-center p-4 bg-neutral-900 border border-neutral-800 rounded-2xl hover:border-neutral-600 transition-all cursor-pointer hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:-translate-y-1"
      >
        <button className="absolute top-3 right-3 p-1.5 rounded-full bg-neutral-800 text-neutral-400 opacity-0 group-hover:opacity-100 transition-all hover:text-white hover:bg-neutral-700">
          <Settings className="w-4 h-4" />
        </button>

        <div className="w-full h-32 flex items-center justify-center p-2 mb-4">
          {currentDisplay.image && (
            <Image
              src={currentDisplay.image}
              alt={currentDisplay.name}
              width={200}
              height={100}
              className="max-w-full max-h-full object-contain drop-shadow-2xl transition-transform group-hover:scale-110"
              priority
            />
          )}
        </div>

        <div className="text-center w-full">
          {type === 'weapon' && (
            <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">
              {currentDisplay.weaponName}
            </div>
          )}
          <div className="font-semibold text-neutral-200 truncate px-2">
            {currentDisplay.name}
          </div>
          {/* StatTrak badge */}
          {(type === 'weapon' || type === 'knife') && selectedItem && 'weapon_stattrak' in selectedItem && selectedItem.weapon_stattrak && (
            <div className="mt-1">
              <span className="text-[10px] font-bold text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded">StatTrak™</span>
            </div>
          )}
          {/* NameTag badge */}
          {(type === 'weapon' || type === 'knife') && selectedItem && 'weapon_nametag' in selectedItem && selectedItem.weapon_nametag && (
            <div className="mt-1">
              <span className="text-[10px] text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded truncate max-w-full inline-block">
                &ldquo;{selectedItem.weapon_nametag}&rdquo;
              </span>
            </div>
          )}
          {(type === 'weapon' || type === 'glove') && selectedItem && 'weapon_wear' in selectedItem && (
            <div className="mt-2 flex items-center justify-center gap-2 text-xs text-neutral-500">
              <span className="bg-neutral-800 px-2 py-0.5 rounded-md">W: {selectedItem.weapon_wear}</span>
              <span className="bg-neutral-800 px-2 py-0.5 rounded-md">S: {selectedItem.weapon_seed}</span>
            </div>
          )}
          {/* Sticker indicators */}
          {type === 'weapon' && selectedItem && 'weapon_stickers' in selectedItem && (
            <div className="mt-2 flex items-center justify-center gap-1">
              {selectedItem.weapon_stickers.filter((s: StickerSlot) => s.id > 0).length > 0 && (
                <span className="text-[9px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                  {selectedItem.weapon_stickers.filter((s: StickerSlot) => s.id > 0).length} sticker(s)
                </span>
              )}
            </div>
          )}
        </div>

        {isPending && (
          <div className="absolute inset-0 bg-neutral-900/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-neutral-800 flex-shrink-0">
              <h3 className="text-xl font-bold text-white">
                {type === 'knife'
                  ? (knifeStep === 'model' ? t.selectKnifeModel : t.selectKnifeSkin)
                  : type === 'agent' ? 'Agent Settings'
                    : type === 'glove' ? 'Glove Settings'
                      : type === 'music' ? 'Music Kit Settings'
                        : type === 'pin' ? 'Pin Settings'
                          : currentDisplay.weaponName}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* --- KNIFE: Two-step flow --- */}
              {type === 'knife' && knifeStep === 'model' && (
                <div className="space-y-4">
                  <label className="text-sm font-medium text-neutral-400">{t.selectKnifeModel}</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type="text"
                      placeholder={t.searchSkin}
                      className="w-full bg-neutral-950 border border-neutral-800 text-sm rounded-xl pl-10 pr-4 py-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
                    {filteredItems.map(([id, item]: [string, CardItemData]) => (
                      <button
                        key={id}
                        onClick={() => {
                          const knifeId = parseInt(id, 10);
                          setSelectedKnifeDefindex(knifeId);
                          setSelectedId(id);
                          if (knifeId === 0) {
                            // Default knife, no skin step needed
                            // Will save directly
                          } else {
                            setKnifeStep('skin');
                            setKnifeSearch('');
                            setSelectedKnifePaintId("0");
                          }
                        }}
                        className={`flex flex-col items-center p-3 rounded-xl border text-left transition-colors ${selectedKnifeDefindex === parseInt(id, 10)
                          ? 'bg-rose-500/10 border-rose-500 text-white'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                          }`}
                      >
                        {item.image_url && (
                          <Image src={item.image_url} alt={item.paint_name || item.weapon_name || ''} width={128} height={64} className="w-full h-16 object-contain mb-2 drop-shadow-lg" loading="lazy" />
                        )}
                        <span className="text-xs font-semibold truncate w-full text-center">
                          {item.paint_name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* --- KNIFE: Step 2 — Select Skin --- */}
              {type === 'knife' && knifeStep === 'skin' && selectedKnifeDefindex && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setKnifeStep('model')}
                      className="text-sm text-rose-400 hover:text-rose-300 font-medium"
                    >
                      ← {t.selectKnifeModel}
                    </button>
                  </div>

                  <label className="text-sm font-medium text-neutral-400">{t.selectKnifeSkin}</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type="text"
                      placeholder={t.searchSkin}
                      className="w-full bg-neutral-950 border border-neutral-800 text-sm rounded-xl pl-10 pr-4 py-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                      value={knifeSearch}
                      onChange={(e) => setKnifeSearch(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[250px] overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
                    {filteredKnifeSkins.map(([paintId, skin]: [string, CardItemData]) => (
                      <button
                        key={paintId}
                        onClick={() => setSelectedKnifePaintId(paintId)}
                        className={`flex flex-col items-center p-3 rounded-xl border text-left transition-colors ${selectedKnifePaintId === paintId
                          ? 'bg-rose-500/10 border-rose-500 text-white'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                          }`}
                      >
                        {skin.image_url && (
                          <Image src={skin.image_url} alt={skin.paint_name || ''} width={128} height={64} className="w-full h-16 object-contain mb-2 drop-shadow-lg" loading="lazy" />
                        )}
                        <span className="text-xs font-semibold truncate w-full text-center">
                          {skin.paint_name}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Wear/Seed for knife skin */}
                  {selectedKnifePaintId !== "0" && (
                    <div className="space-y-4 pt-4 border-t border-neutral-800">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-400">Preset {t.wear}</label>
                        <select
                          className="w-full bg-neutral-950 border border-neutral-800 text-sm rounded-xl px-4 py-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                          onChange={(e) => setWear(e.target.value)}
                          value={wear}
                        >
                          <option value="0.00">{t.factoryNew} (0.00)</option>
                          <option value="0.07">{t.minimalWear} (0.07)</option>
                          <option value="0.15">{t.fieldTested} (0.15)</option>
                          <option value="0.38">{t.wellWorn} (0.38)</option>
                          <option value="0.45">{t.battleScarred} (0.45)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-neutral-400">{t.wear}</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            className="w-full bg-neutral-950 border border-neutral-800 text-sm rounded-xl px-4 py-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                            value={wear}
                            onChange={(e) => setWear(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-neutral-400">{t.seed}</label>
                          <input
                            type="number"
                            min="1"
                            max="1000"
                            className="w-full bg-neutral-950 border border-neutral-800 text-sm rounded-xl px-4 py-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                            value={seed}
                            onChange={(e) => setSeed(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* StatTrak & NameTag for knife */}
                  <div className="space-y-4 pt-4 border-t border-neutral-800">
                    {/* StatTrak Toggle */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-orange-400" />
                        <span className="text-sm font-medium text-neutral-300">{t.stattrak}</span>
                      </div>
                      <button
                        onClick={() => setStattrak(!stattrak)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${stattrak ? 'bg-orange-500' : 'bg-neutral-700'
                          }`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${stattrak ? 'translate-x-[22px]' : 'translate-x-0.5'
                          }`} />
                      </button>
                    </div>

                    {/* NameTag */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-cyan-400" />
                        <label className="text-sm font-medium text-neutral-300">{t.nametag}</label>
                      </div>
                      <input
                        type="text"
                        maxLength={128}
                        placeholder={t.nametagPlaceholder}
                        className="w-full bg-neutral-950 border border-neutral-800 text-sm rounded-xl px-4 py-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                        value={nametag}
                        onChange={(e) => setNametag(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* --- NON-KNIFE types: original item selector --- */}
              {type !== 'knife' && (
                <div className="space-y-4">
                  <label className="text-sm font-medium text-neutral-400">{t.selectSkin}</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type="text"
                      placeholder={t.searchSkin}
                      className="w-full bg-neutral-950 border border-neutral-800 text-sm rounded-xl pl-10 pr-4 py-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
                    {filteredItems.map(([id, item]: [string, CardItemData]) => (
                      <button
                        key={id}
                        onClick={() => setSelectedId(id)}
                        className={`flex flex-col items-center p-3 rounded-xl border text-left transition-colors ${selectedId === id
                          ? 'bg-rose-500/10 border-rose-500 text-white'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                          }`}
                      >
                        {item.image_url && (
                          <Image src={item.image_url} alt={item.paint_name || item.weapon_name || item.agent_name || item.name || ''} width={128} height={64} className="w-full h-16 object-contain mb-2 drop-shadow-lg" loading="lazy" />
                        )}
                        <span className="text-xs font-semibold truncate w-full text-center">
                          {type === 'agent' ? item.agent_name : item.name || item.paint_name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* --- Wear/Seed for weapon & glove --- */}
              {(type === 'weapon' || type === 'glove') && (
                <div className="space-y-4 pt-4 border-t border-neutral-800">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-400">Preset {t.wear}</label>
                    <select
                      className="w-full bg-neutral-950 border border-neutral-800 text-sm rounded-xl px-4 py-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                      onChange={(e) => setWear(e.target.value)}
                      value={wear}
                    >
                      <option value="0.00">{t.factoryNew} (0.00)</option>
                      <option value="0.07">{t.minimalWear} (0.07)</option>
                      <option value="0.15">{t.fieldTested} (0.15)</option>
                      <option value="0.38">{t.wellWorn} (0.38)</option>
                      <option value="0.45">{t.battleScarred} (0.45)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-neutral-400">{t.wear}</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        className="w-full bg-neutral-950 border border-neutral-800 text-sm rounded-xl px-4 py-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                        value={wear}
                        onChange={(e) => setWear(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-neutral-400">{t.seed}</label>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        className="w-full bg-neutral-950 border border-neutral-800 text-sm rounded-xl px-4 py-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                        value={seed}
                        onChange={(e) => setSeed(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* --- StatTrak & NameTag for weapons --- */}
              {type === 'weapon' && (
                <div className="space-y-4 pt-4 border-t border-neutral-800">
                  {/* StatTrak Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-orange-400" />
                      <span className="text-sm font-medium text-neutral-300">{t.stattrak}</span>
                    </div>
                    <button
                      onClick={() => setStattrak(!stattrak)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${stattrak ? 'bg-orange-500' : 'bg-neutral-700'
                        }`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${stattrak ? 'translate-x-[22px]' : 'translate-x-0.5'
                        }`} />
                    </button>
                  </div>

                  {/* NameTag */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-cyan-400" />
                      <label className="text-sm font-medium text-neutral-300">{t.nametag}</label>
                    </div>
                    <input
                      type="text"
                      maxLength={128}
                      placeholder={t.nametagPlaceholder}
                      className="w-full bg-neutral-950 border border-neutral-800 text-sm rounded-xl px-4 py-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                      value={nametag}
                      onChange={(e) => setNametag(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* --- Stickers for weapons only --- */}
              {type === 'weapon' && (
                <div className="pt-4 border-t border-neutral-800">
                  <StickerEditor
                    weaponImageUrl={weaponImageUrl}
                    stickers={stickers}
                    onChange={setStickers}
                    locale={locale}
                    t={t}
                  />
                </div>
              )}
            </div>

            <div className="p-4 bg-neutral-950/50 border-t border-neutral-800 flex justify-end gap-3 flex-shrink-0">
              {selectedItem && (
                <button
                  onClick={handleRemove}
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl font-medium text-red-400 hover:text-white hover:bg-red-500/20 transition-colors mr-auto"
                >
                  {t.remove || 'Remove'}
                </button>
              )}
              <button
                onClick={() => { setIsModalOpen(false); if (type === 'knife') setKnifeStep('model'); }}
                className="px-5 py-2.5 rounded-xl font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="px-5 py-2.5 rounded-xl font-bold bg-rose-500 hover:bg-rose-600 text-white transition-colors flex items-center gap-2"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Helper to compute display info for the card thumbnail
function getDisplayInfo(type: string, selectedItem: SelectedItemData | null, items: Record<string | number, CardItemData>, defaultWeapon: WeaponData | undefined, defindex: number, knifeSkins?: Record<number, Record<number, SkinData>>) {
  if (type === 'agent') {
    const agentId = selectedItem && 'agent' in selectedItem ? selectedItem.agent : null;
    if (agentId && items[agentId]) {
      return {
        name: items[agentId].agent_name,
        image: items[agentId].image_url || '/img/skins/agent-5601.png',
        weaponName: undefined,
      };
    }
    return { name: 'Default Agent', image: '/img/skins/agent-5601.png', weaponName: undefined };
  }

  if (type === 'glove') {
    const gloveId = selectedItem && 'weapon_defindex' in selectedItem ? selectedItem.weapon_defindex : null;
    const paintId = selectedItem && 'weapon_paint_id' in selectedItem ? selectedItem.weapon_paint_id : null;
    if (gloveId && paintId && items[`${gloveId}-${paintId}`]) {
      return {
        name: items[`${gloveId}-${paintId}`].paint_name,
        image: items[`${gloveId}-${paintId}`].image_url || '/img/skins/default_glove.png',
        weaponName: undefined,
      };
    }
    return { name: 'Default Gloves', image: '/img/skins/default_glove.png', weaponName: undefined };
  }

  if (type === 'music') {
    const musicId = selectedItem && 'music_id' in selectedItem ? selectedItem.music_id : null;
    if (musicId && items[musicId]) {
      return { name: items[musicId].name, image: items[musicId].image_url || '/img/skins/default_music.png', weaponName: undefined };
    }
    return { name: 'Default Music Kit', image: '/img/skins/default_music.png', weaponName: undefined };
  }

  if (type === 'pin') {
    const pinId = selectedItem && 'id' in selectedItem ? selectedItem.id : null;
    if (pinId && items[pinId]) {
      return { name: items[pinId].name, image: items[pinId].image_url || '/img/skins/default_pin.png', weaponName: undefined };
    }
    return { name: 'Default Pin', image: '/img/skins/default_pin.png', weaponName: undefined };
  }

  if (type === 'knife') {
    const knifeIdStr = selectedItem && 'knife' in selectedItem
      ? Object.keys(items).find(k => items[k as keyof typeof items]?.weapon_name === selectedItem.knife)
      : null;
    const knifeId = knifeIdStr ? parseInt(knifeIdStr, 10) : null;

    // Check if there is a skin applied
    if (knifeId && selectedItem && 'weapon_paint_id' in selectedItem && selectedItem.weapon_paint_id > 0) {
      const skin = knifeSkins?.[knifeId]?.[selectedItem.weapon_paint_id];
      if (skin) {
        return {
          name: skin.paint_name,
          image: skin.image_url || '/img/skins/weapon_knife.png',
          weaponName: items[knifeId as keyof typeof items]?.paint_name,
        };
      }
    }

    // Fallback to base model
    if (knifeId && items[knifeId as keyof typeof items]) {
      return {
        name: items[knifeId as keyof typeof items]?.paint_name || 'Default Knife',
        image: items[knifeId as keyof typeof items]?.image_url || '/img/skins/weapon_knife.png',
        weaponName: undefined,
      };
    }
    return { name: 'Default Knife', image: '/img/skins/weapon_knife.png', weaponName: undefined };
  }

  // weapon
  if (selectedItem && 'weapon_paint_id' in selectedItem && items && selectedItem.weapon_paint_id !== undefined && items[selectedItem.weapon_paint_id]) {
    const skin = items[selectedItem.weapon_paint_id];
    return {
      name: skin.paint_name,
      weaponName: defaultWeapon?.paint_name?.split('|')[0]?.trim() || skin.weapon_name,
      image: skin.image_url || '/img/skins/weapon_knife.png',
    };
  }
  return {
    name: 'Default',
    weaponName: defaultWeapon?.paint_name?.split('|')[0]?.trim() || `Weapon ${defindex}`,
    image: defaultWeapon?.image_url || '/img/skins/weapon_knife.png',
  };
}
