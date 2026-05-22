'use client';

import { useState, useTransition } from 'react';
import { Settings, Loader2, Search } from 'lucide-react';
import { updateSkin } from '@/app/actions';
import { Dictionary, KnifeData, PlayerKnife, PlayerSkin, SkinData, WeaponData } from '@/lib/types';

interface WeaponCardProps {
  type: 'knife' | 'weapon';
  defindex: number;
  items: Record<number, SkinData> | Record<number, KnifeData>;
  selectedItem: PlayerSkin | PlayerKnife | null;
  defaultWeapon?: WeaponData;
  teamId: number;
  t: Dictionary;
}

export function WeaponCard({ type, defindex, items, selectedItem, defaultWeapon, teamId, t }: WeaponCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState('');

  // Local state for modal
  const [selectedId, setSelectedId] = useState<string>(
    type === 'knife' && selectedItem && 'knife' in selectedItem
      ? Object.keys(items).find(k => items[k as any].weapon_name === selectedItem.knife) || Object.keys(items)[0]
      : selectedItem && 'weapon_paint_id' in selectedItem ? String(selectedItem.weapon_paint_id) : "0"
  );

  const [wear, setWear] = useState<string>(
    selectedItem && 'weapon_wear' in selectedItem ? selectedItem.weapon_wear.toFixed(2) : "0.00"
  );
  const [seed, setSeed] = useState<string>(
    selectedItem && 'weapon_seed' in selectedItem ? String(selectedItem.weapon_seed) : "0"
  );

  const handleSave = () => {
    startTransition(() => {
      const forma = type === 'knife' ? `knife-${selectedId}` : `${defindex}-${selectedId}`;
      updateSkin(forma, wear, seed, teamId);
      setIsModalOpen(false);
    });
  };

  const filteredItems = Object.entries(items || {}).filter(([_, item]: [string, SkinData | KnifeData]) => {
    const name = type === 'knife' ? item.weapon_name : item.paint_name;
    return name?.toLowerCase().includes(search.toLowerCase());
  });

  // Determine current display info
  let currentDisplay = null;
  if (type === 'knife') {
    const knifeId = selectedItem && 'knife' in selectedItem ? Object.keys(items).find(k => items[k as any].weapon_name === selectedItem.knife) : null;
    if (knifeId && items[knifeId as any]) {
      currentDisplay = {
        name: items[knifeId as any].paint_name,
        image: items[knifeId as any].image_url || '/img/skins/weapon_knife.png'
      };
    } else {
      currentDisplay = {
        name: 'Default Knife',
        image: '/img/skins/weapon_knife.png'
      };
    }
  } else {
    if (selectedItem && 'weapon_paint_id' in selectedItem && items && items[selectedItem.weapon_paint_id as any]) {
      const skin = items[selectedItem.weapon_paint_id as any] as SkinData;
      currentDisplay = {
        name: skin.paint_name,
        weaponName: defaultWeapon?.paint_name?.split('|')[0]?.trim() || skin.weapon_name,
        image: skin.image_url || '/img/skins/weapon_knife.png'
      };
    } else {
      currentDisplay = {
        name: 'Default',
        weaponName: defaultWeapon?.paint_name?.split('|')[0]?.trim() || `Weapon ${defindex}`,
        image: defaultWeapon?.image_url || '/img/skins/weapon_knife.png'
      };
    }
  }

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
          <img 
            src={currentDisplay.image} 
            alt={currentDisplay.name}
            className="max-w-full max-h-full object-contain drop-shadow-2xl transition-transform group-hover:scale-110"
            loading="lazy"
          />
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
          {type === 'weapon' && selectedItem && 'weapon_wear' in selectedItem && (
            <div className="mt-2 flex items-center justify-center gap-2 text-xs text-neutral-500">
              <span className="bg-neutral-800 px-2 py-0.5 rounded-md">W: {selectedItem.weapon_wear}</span>
              <span className="bg-neutral-800 px-2 py-0.5 rounded-md">S: {selectedItem.weapon_seed}</span>
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
                {type === 'knife' ? 'Knife Settings' : currentDisplay.weaponName}
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                  {filteredItems.map(([id, item]: [string, SkinData | KnifeData]) => (
                    <button
                      key={id}
                      onClick={() => setSelectedId(id)}
                      className={`flex flex-col items-center p-3 rounded-xl border text-left transition-colors ${
                        selectedId === id 
                          ? 'bg-rose-500/10 border-rose-500 text-white' 
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      {item.image_url && (
                        <img src={item.image_url} alt={item.paint_name || item.weapon_name} className="w-full h-16 object-contain mb-2 drop-shadow-lg" loading="lazy" />
                      )}
                      <span className="text-xs font-semibold truncate w-full text-center">
                        {item.paint_name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {type === 'weapon' && (
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
            </div>
            
            <div className="p-4 bg-neutral-950/50 border-t border-neutral-800 flex justify-end gap-3 flex-shrink-0">
              <button 
                onClick={() => setIsModalOpen(false)}
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
