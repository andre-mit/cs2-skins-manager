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
      const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM `wp_player_knife` WHERE steamid = ? AND weapon_team = ?", [steamid, team]);
      
      if (rows.length > 0) {
        await pool.query("UPDATE `wp_player_knife` SET `knife` = ? WHERE `steamid` = ? AND `weapon_team` = ?", [knife.weapon_name, steamid, team]);
      } else {
        await pool.query("INSERT INTO `wp_player_knife` (`steamid`, `knife`, `weapon_team`) VALUES(?, ?, ?)", [steamid, knife.weapon_name, team]);
      }
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

export async function updateAgent(model: string, team: number) {
  const steamid = await getSession();
  if (!steamid) return;

  if (model) {
    const column = team === 2 ? 'agent_ct' : 'agent_t';
    const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM `wp_player_agents` WHERE steamid = ?", [steamid]);
    
    if (rows.length > 0) {
      await pool.query(`UPDATE wp_player_agents SET ${column} = ? WHERE steamid = ?`, [model, steamid]);
    } else {
      await pool.query(`INSERT INTO wp_player_agents (steamid, ${column}) VALUES (?, ?)`, [steamid, model]);
    }
  }

  revalidatePath('/');
}

export async function updateMusic(musicId: number, team: number) {
  const steamid = await getSession();
  if (!steamid) return;

  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM wp_player_music WHERE steamid = ? AND weapon_team = ?",
    [steamid, team]
  );

  if (rows.length > 0) {
    await pool.query(
      "UPDATE wp_player_music SET music_id = ? WHERE steamid = ? AND weapon_team = ?",
      [musicId, steamid, team]
    );
  } else {
    await pool.query(
      "INSERT INTO wp_player_music (`steamid`, `weapon_team`, `music_id`) VALUES (?, ?, ?)",
      [steamid, team, musicId]
    );
  }

  revalidatePath('/');
}

export async function updatePin(pinId: number, team: number) {
  const steamid = await getSession();
  if (!steamid) return;

  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM wp_player_pins WHERE steamid = ? AND weapon_team = ?",
    [steamid, team]
  );

  if (rows.length > 0) {
    await pool.query(
      "UPDATE wp_player_pins SET id = ? WHERE steamid = ? AND weapon_team = ?",
      [pinId, steamid, team]
    );
  } else {
    await pool.query(
      "INSERT INTO wp_player_pins (`steamid`, `weapon_team`, `id`) VALUES (?, ?, ?)",
      [steamid, team, pinId]
    );
  }

  revalidatePath('/');
}

export async function updateGlove(defindexAndPaint: string, wearStr: string, seedStr: string, team: number) {
  const steamid = await getSession();
  if (!steamid) return;

  const [defindexStr, paintIdStr] = defindexAndPaint.split('-');
  const weaponDefIndex = parseInt(defindexStr, 10);
  const paintId = parseInt(paintIdStr, 10);
  const wear = parseFloat(wearStr);
  const seed = parseInt(seedStr, 10);

  if (!isNaN(wear) && wear >= 0 && wear <= 1 && !isNaN(seed)) {
    // 1. Update wp_player_gloves (Equip the base glove item)
    const [gloveRows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM wp_player_gloves WHERE steamid = ? AND weapon_team = ?",
      [steamid, team]
    );

    if (gloveRows.length > 0) {
      await pool.query(
        "UPDATE wp_player_gloves SET weapon_defindex = ? WHERE steamid = ? AND weapon_team = ?",
        [weaponDefIndex, steamid, team]
      );
    } else {
      await pool.query(
        "INSERT INTO wp_player_gloves (`steamid`, `weapon_defindex`, `weapon_team`) VALUES (?, ?, ?)",
        [steamid, weaponDefIndex, team]
      );
    }

    // 2. Update wp_player_skins (Apply the paint to the glove)
    const [skinRows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM wp_player_skins WHERE steamid = ? AND weapon_defindex = ? AND weapon_team = ?",
      [steamid, weaponDefIndex, team]
    );

    if (skinRows.length > 0) {
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

export async function removeItem(type: 'knife' | 'weapon' | 'agent' | 'glove' | 'music' | 'pin', defindex: number | null, team: number) {
  const steamid = await getSession();
  if (!steamid) return;

  if (type === 'knife') {
    await pool.query("DELETE FROM wp_player_knife WHERE steamid = ? AND weapon_team = ?", [steamid, team]);
  } else if (type === 'weapon' && defindex !== null) {
    await pool.query("DELETE FROM wp_player_skins WHERE steamid = ? AND weapon_defindex = ? AND weapon_team = ?", [steamid, defindex, team]);
  } else if (type === 'glove') {
    await pool.query("DELETE FROM wp_player_gloves WHERE steamid = ? AND weapon_team = ?", [steamid, team]);
  } else if (type === 'music') {
    await pool.query("DELETE FROM wp_player_music WHERE steamid = ? AND weapon_team = ?", [steamid, team]);
  } else if (type === 'pin') {
    await pool.query("DELETE FROM wp_player_pins WHERE steamid = ? AND weapon_team = ?", [steamid, team]);
  } else if (type === 'agent') {
    const column = team === 2 ? 'agent_ct' : 'agent_t';
    await pool.query(`UPDATE wp_player_agents SET ${column} = NULL WHERE steamid = ?`, [steamid]);
  }

  revalidatePath('/');
}
