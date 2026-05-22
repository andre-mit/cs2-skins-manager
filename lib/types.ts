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

export interface Dictionary {
  [key: string]: string;
}
