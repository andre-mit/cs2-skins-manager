'use client';

import { useState, useTransition } from 'react';
import { updateSkin } from '@/app/actions';
import { Loader2, Search } from 'lucide-react';
import Image from 'next/image';
import { SkinData, WeaponData, Dictionary } from '@/lib/types';

interface AddWeaponModalProps {
  onClose: () => void;
  teamId: number;
  weapons: Record<number, WeaponData>;
  skins: Record<number, Record<number, SkinData>>;
  t: Dictionary;
}

export function AddWeaponModal({ onClose, teamId, weapons, skins, t }: AddWeaponModalProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedWeaponDefindex, setSelectedWeaponDefindex] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  
  const [wear, setWear] = useState<string>("0.00");
  const [seed, setSeed] = useState<string>("0");

  const [selectedSkinId, setSelectedSkinId] = useState<string | null>(null);

  const availableSkins = selectedWeaponDefindex ? skins[selectedWeaponDefindex] : null;

  const filteredSkins = availableSkins 
    ? Object.entries(availableSkins).filter(([, skin]: [string, SkinData]) => 
        skin.paint_name.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const CT_ONLY_WEAPONS = [3, 8, 10, 16, 27, 32, 34, 38, 60, 61];
  const T_ONLY_WEAPONS = [4, 7, 11, 13, 17, 29, 30, 39];

  // Filter out knives (defindex >= 500) and team-specific weapons from the weapon list
  const filteredWeapons = Object.entries(weapons).filter(([defindexStr]) => {
    const defindex = parseInt(defindexStr, 10);
    if (defindex >= 500) return false;
    
    // teamId 3 is CT, teamId 2 is T
    if (teamId === 3 && T_ONLY_WEAPONS.includes(defindex)) return false;
    if (teamId === 2 && CT_ONLY_WEAPONS.includes(defindex)) return false;
    
    return true;
  });

  const handleSave = () => {
    if (!selectedWeaponDefindex || !selectedSkinId) return;
    
    startTransition(async () => {
      const forma = `${selectedWeaponDefindex}-${selectedSkinId}`;
      await updateSkin(forma, wear, seed, teamId);
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-neutral-800 flex-shrink-0">
          <h3 className="text-xl font-bold text-white">{t.addWeapon}</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-400">{t.selectWeapon}</label>
            <select 
              className="w-full bg-neutral-950 border border-neutral-800 text-sm rounded-xl px-4 py-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
              value={selectedWeaponDefindex || ''}
              onChange={(e) => {
                setSelectedWeaponDefindex(parseInt(e.target.value, 10));
                setSelectedSkinId(null);
                setSearch('');
              }}
            >
              <option value="" disabled>{t.selectWeapon}</option>
              {filteredWeapons.map(([defindex, weapon]: [string, WeaponData]) => {
                const displayName = weapon.paint_name ? weapon.paint_name.split('|')[0].trim() : weapon.weapon_name;
                return (
                  <option key={defindex} value={defindex}>{displayName}</option>
                );
              })}
            </select>
          </div>

          {selectedWeaponDefindex && (
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

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[250px] overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
                {filteredSkins.map(([paintId, skin]: [string, SkinData]) => (
                  <button
                    key={paintId}
                    onClick={() => setSelectedSkinId(paintId)}
                    className={`flex flex-col items-center p-3 rounded-xl border text-left transition-colors ${
                      selectedSkinId === paintId 
                        ? 'bg-rose-500/10 border-rose-500 text-white' 
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    {skin.image_url && (
                      <Image src={skin.image_url} alt={skin.paint_name} width={128} height={64} className="w-full h-16 object-contain mb-2 drop-shadow-lg" loading="lazy" />
                    )}
                    <span className="text-xs font-semibold truncate w-full text-center">{skin.paint_name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedSkinId && (
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
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            {t.cancel}
          </button>
          <button 
            onClick={handleSave}
            disabled={isPending || !selectedWeaponDefindex || !selectedSkinId}
            className="px-5 py-2.5 rounded-xl font-bold bg-rose-500 hover:bg-rose-600 text-white transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}
