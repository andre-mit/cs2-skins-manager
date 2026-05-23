export interface SkinData {
  weapon_name: string;
  paint_name: string;
  image_url: string | null;
}

export interface WeaponData {
  weapon_name: string;
  paint_name: string;
  image_url: string | null;
}

export interface KnifeData {
  weapon_name: string;
  paint_name: string;
  image_url: string | null;
}

export interface PlayerSkin {
  weapon_paint_id: number;
  weapon_wear: number;
  weapon_seed: number;
}

export interface PlayerKnife {
  steamid?: string;
  knife: string;
  weapon_team: number;
}

export interface AgentData {
  team: number;
  image_url: string | null;
  model: string;
  agent_name: string;
}

export interface GloveData {
  weapon_defindex: number;
  paint: number;
  image_url: string | null;
  paint_name: string;
}

export interface PlayerAgent {
  steamid?: string;
  agent: string;
  weapon_team: number;
}

export interface PlayerGlove {
  steamid?: string;
  weapon_defindex: number;
  weapon_paint_id: number;
  weapon_wear: number;
  weapon_seed: number;
  weapon_team: number;
}

export interface MusicData {
  id: number;
  name: string;
  image_url: string | null;
}

export interface PinData {
  id: number;
  name: string;
  image_url: string | null;
}

export interface PlayerMusic {
  steamid?: string;
  music_id: number;
  weapon_team: number;
}

export interface PlayerPin {
  steamid?: string;
  id: number;
  weapon_team: number;
}

export interface Dictionary {
  [key: string]: string;
}
