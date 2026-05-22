'use client';

import { useState } from 'react';
import { WeaponCard } from './WeaponCard';
import { AddWeaponModal } from './AddWeaponModal';
import { Plus } from 'lucide-react';
import { SkinData, WeaponData, KnifeData, PlayerSkin, PlayerKnife, Dictionary } from '@/lib/types';

interface TeamSectionProps {
  teamId: number;
  teamName: string;
  customizedSkins: Record<number, PlayerSkin>;
  knife: PlayerKnife | null;
  weapons: Record<number, WeaponData>;
  skins: Record<number, Record<number, SkinData>>;
  knifes: Record<number, KnifeData>;
  t: Dictionary;
}

export function TeamSection({ teamId, teamName, customizedSkins, knife, weapons, skins, knifes, t }: TeamSectionProps) {
  const [isAdding, setIsAdding] = useState(false);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-neutral-100 to-neutral-400 bg-clip-text text-transparent">
          {teamName}
        </h2>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold rounded-xl transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          {t.addWeapon}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        <WeaponCard 
          type="knife"
          defindex={0}
          items={knifes}
          selectedItem={knife}
          teamId={teamId}
          t={t}
        />

        {Object.entries(customizedSkins).map(([defindexStr, selectedSkinInfo]: [string, PlayerSkin]) => {
          const defindex = parseInt(defindexStr, 10);
          const defaultWeapon = weapons[defindex];
          
          return (
            <WeaponCard
              key={defindex}
              type="weapon"
              defindex={defindex}
              items={skins[defindex]}
              selectedItem={selectedSkinInfo}
              defaultWeapon={defaultWeapon}
              teamId={teamId}
              t={t}
            />
          );
        })}
      </div>

      {isAdding && (
        <AddWeaponModal 
          onClose={() => setIsAdding(false)} 
          teamId={teamId} 
          weapons={weapons} 
          skins={skins}
          t={t}
        />
      )}
    </section>
  );
}
