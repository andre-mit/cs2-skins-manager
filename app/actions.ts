'use server'

import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { RowDataPacket } from 'mysql2';
import { getKnifeTypes } from '@/lib/utils';

export async function updateSkin(forma: string, wearStr: string, seedStr: string, team: number) {
  const steamid = await getSession();
  if (!steamid) return;

  const [type, id] = forma.split('-');

  if (type === 'knife') {
    const locale = (await cookies()).get('locale')?.value || 'en';
    const knifes = getKnifeTypes(locale);
    const knifeId = parseInt(id, 10);
    const knife = knifes[knifeId];
    
    if (knife && knife.weapon_name) {
      await pool.query(
        "INSERT INTO `wp_player_knife` (`steamid`, `knife`, `weapon_team`) VALUES(?, ?, ?) ON DUPLICATE KEY UPDATE `knife` = ?",
        [steamid, knife.weapon_name, team, knife.weapon_name]
      );
    }
  } else {
    const weaponDefIndex = parseInt(type, 10);
    const paintId = parseInt(id, 10);
    const wear = parseFloat(wearStr);
    const seed = parseInt(seedStr, 10);

    if (!isNaN(wear) && wear >= 0 && wear <= 1 && !isNaN(seed)) {
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT * FROM wp_player_skins WHERE steamid = ? AND weapon_defindex = ? AND weapon_team = ?",
        [steamid, weaponDefIndex, team]
      );

      if (rows.length > 0) {
        await pool.query(
          "UPDATE wp_player_skins SET weapon_paint_id = ?, weapon_wear = ?, weapon_seed = ? WHERE steamid = ? AND weapon_defindex = ? AND weapon_team = ?",
          [paintId, wear, seed, steamid, weaponDefIndex, team]
        );
      } else {
        await pool.query(
          "INSERT INTO wp_player_skins (`steamid`, `weapon_defindex`, `weapon_paint_id`, `weapon_wear`, `weapon_seed`, `weapon_team`) VALUES (?, ?, ?, ?, ?, ?)",
          [steamid, weaponDefIndex, paintId, wear, seed, team]
        );
      }
    }
  }

  revalidatePath('/');
}

export async function changeLocale(locale: string) {
  (await cookies()).set('locale', locale, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 365 * 24 * 60 * 60,
  });
  revalidatePath('/');
}
