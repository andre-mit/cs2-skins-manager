import fs from 'fs';
import path from 'path';
import { SkinData, WeaponData, KnifeData } from './types';

export function getSkinsFromJson(locale: string = 'en'): Record<number, Record<number, SkinData>> {
  const allowedLocales = ['en', 'pt-BR'];
  const safeLocale = allowedLocales.includes(locale) ? locale : 'en';
  
  const fileName = `skins_${safeLocale}.json`;
  let filePath = path.join(process.cwd(), 'data', fileName);
  
  if (!fs.existsSync(filePath)) {
    filePath = path.join(process.cwd(), 'data', 'skins_en.json');
  }

  const data = fs.readFileSync(filePath, 'utf8');
  const json = JSON.parse(data);

  const skins: Record<number, Record<number, SkinData>> = {};

  for (const skin of json) {
    const defindex = parseInt(skin.weapon_defindex, 10);
    const paint = parseInt(skin.paint, 10);
    
    if (!skins[defindex]) {
      skins[defindex] = {};
    }
    
    skins[defindex][paint] = {
      weapon_name: skin.weapon_name,
      paint_name: skin.paint_name,
      image_url: skin.image ? skin.image.replace('https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/', '/img/skins/') : null,
    };
  }

  return skins;
}

export function getWeaponsFromArray(locale: string = 'en'): Record<number, WeaponData> {
  const weapons: Record<number, WeaponData> = {};
  const temp = getSkinsFromJson(locale);

  for (const keyStr in temp) {
    const key = parseInt(keyStr, 10);
    const value = temp[key];
    if (weapons[key]) continue;

    weapons[key] = {
      weapon_name: value[0]?.weapon_name,
      paint_name: value[0]?.paint_name,
      image_url: value[0]?.image_url,
    };
  }

  return weapons;
}

export function getKnifeTypes(locale: string = 'en'): Record<number, KnifeData> {
  const knifes: Record<number, KnifeData> = {};
  const temp = getWeaponsFromArray(locale);

  const allowedKnives = [
    500, 503, 505, 506, 507, 508, 509, 512, 514, 515, 516, 517, 518, 519, 520, 521, 522, 523, 525, 526
  ];

  for (const keyStr in temp) {
    const key = parseInt(keyStr, 10);
    const weapon = temp[key];

    if (!allowedKnives.includes(key)) continue;

    knifes[key] = {
      weapon_name: weapon.weapon_name,
      paint_name: weapon.paint_name?.split("|")[0]?.trim(),
      image_url: weapon.image_url,
    };
  }

  knifes[0] = {
    weapon_name: "weapon_knife",
    paint_name: "Default knife",
    image_url: "/img/skins/weapon_knife.png", // Changed from original github link
  };

  return knifes;
}
