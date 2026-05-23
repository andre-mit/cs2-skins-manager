import fs from 'fs';
import path from 'path';
import { SkinData, WeaponData, KnifeData, AgentData, GloveData, MusicData, PinData } from './types';

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

export function getAgentsFromJson(locale: string = 'en'): Record<string, AgentData> {
  const allowedLocales = ['en', 'pt-BR'];
  const safeLocale = allowedLocales.includes(locale) ? locale : 'en';
  
  const fileName = `agents_${safeLocale}.json`;
  let filePath = path.join(process.cwd(), 'data', fileName);
  
  if (!fs.existsSync(filePath)) {
    filePath = path.join(process.cwd(), 'data', 'agents_en.json');
  }

  const data = fs.readFileSync(filePath, 'utf8');
  const json = JSON.parse(data);

  const agents: Record<string, AgentData> = {};

  for (const agent of json) {
    agents[agent.model] = {
      team: agent.team,
      model: agent.model,
      agent_name: agent.agent_name,
      image_url: agent.image ? agent.image.replace('https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/', '/img/skins/') : null,
    };
  }

  return agents;
}

export function getGlovesFromJson(locale: string = 'en'): Record<string, GloveData> {
  const allowedLocales = ['en', 'pt-BR'];
  const safeLocale = allowedLocales.includes(locale) ? locale : 'en';
  
  const fileName = `gloves_${safeLocale}.json`;
  let filePath = path.join(process.cwd(), 'data', fileName);
  
  if (!fs.existsSync(filePath)) {
    filePath = path.join(process.cwd(), 'data', 'gloves_en.json');
  }

  const data = fs.readFileSync(filePath, 'utf8');
  const json = JSON.parse(data);

  const gloves: Record<string, GloveData> = {};

  for (const glove of json) {
    const defindex = parseInt(glove.weapon_defindex, 10);
    const paint = parseInt(glove.paint, 10);
    const key = `${defindex}-${paint}`;
    
    gloves[key] = {
      weapon_defindex: defindex,
      paint: paint,
      paint_name: glove.paint_name,
      image_url: glove.image ? glove.image.replace('https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/', '/img/skins/') : null,
    };
  }

  return gloves;
}

export function getMusicFromJson(locale: string = 'en'): Record<number, MusicData> {
  const allowedLocales = ['en', 'pt-BR'];
  const safeLocale = allowedLocales.includes(locale) ? locale : 'en';
  
  const fileName = `music_${safeLocale}.json`;
  let filePath = path.join(process.cwd(), 'data', fileName);
  
  if (!fs.existsSync(filePath)) {
    filePath = path.join(process.cwd(), 'data', 'music_en.json');
  }

  const data = fs.readFileSync(filePath, 'utf8');
  const json = JSON.parse(data);

  const musics: Record<number, MusicData> = {};

  for (const music of json) {
    const id = parseInt(music.id, 10);
    musics[id] = {
      id: id,
      name: music.name,
      image_url: music.image ? music.image.replace('https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/', '/img/skins/') : null,
    };
  }

  return musics;
}

export function getPinsFromJson(locale: string = 'en'): Record<number, PinData> {
  const allowedLocales = ['en', 'pt-BR'];
  const safeLocale = allowedLocales.includes(locale) ? locale : 'en';
  
  const fileName = `collectibles_${safeLocale}.json`;
  let filePath = path.join(process.cwd(), 'data', fileName);
  
  if (!fs.existsSync(filePath)) {
    filePath = path.join(process.cwd(), 'data', 'collectibles_en.json');
  }

  const data = fs.readFileSync(filePath, 'utf8');
  const json = JSON.parse(data);

  const pins: Record<number, PinData> = {};

  for (const pin of json) {
    const id = parseInt(pin.id, 10);
    pins[id] = {
      id: id,
      name: pin.name,
      image_url: pin.image ? pin.image.replace('https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/', '/img/skins/') : null,
    };
  }

  return pins;
}
