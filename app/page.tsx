import { getSession } from '@/lib/auth';
import { getKnifeTypes, getSkinsFromJson, getWeaponsFromArray, getAgentsFromJson, getGlovesFromJson, getMusicFromJson, getPinsFromJson, parseStickerString } from '@/lib/utils';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import Link from 'next/link';
import { LogIn, LogOut, Settings2 } from 'lucide-react';
import { TeamSection } from '@/components/TeamSection';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { getDictionary } from '@/lib/i18n';
import { cookies } from 'next/headers';
import { PlayerSkin, PlayerKnife, PlayerAgent, PlayerGlove, PlayerMusic, PlayerPin } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const steamid = await getSession();
  const locale = (await cookies()).get('locale')?.value || 'en';
  const t = getDictionary(locale);

  // Load datasets based on locale
  const weapons = getWeaponsFromArray(locale);
  const skins = getSkinsFromJson(locale);
  const knifes = getKnifeTypes(locale);
  const agentsDict = getAgentsFromJson(locale);
  const glovesDict = getGlovesFromJson(locale);
  const musicDict = getMusicFromJson(locale);
  const pinsDict = getPinsFromJson(locale);

  const ctSkins: Record<number, PlayerSkin> = {};
  const tSkins: Record<number, PlayerSkin> = {};
  let ctKnife: PlayerKnife | null = null;
  let tKnife: PlayerKnife | null = null;
  let ctAgent: PlayerAgent | null = null;
  let tAgent: PlayerAgent | null = null;
  let ctGlove: PlayerGlove | null = null;
  let tGlove: PlayerGlove | null = null;
  let ctMusic: PlayerMusic | null = null;
  let tMusic: PlayerMusic | null = null;
  let ctPin: PlayerPin | null = null;
  let tPin: PlayerPin | null = null;

  if (steamid) {
    try {
      const [skinsRows] = await pool.query<RowDataPacket[]>(
        `SELECT weapon_defindex, weapon_team, weapon_paint_id, weapon_wear, weapon_seed,
                weapon_nametag, weapon_stattrak, weapon_stattrak_count,
                weapon_sticker_0, weapon_sticker_1, weapon_sticker_2, weapon_sticker_3, weapon_sticker_4
         FROM wp_player_skins
         WHERE steamid = ?`,
        [steamid]
      );

      const ctSkinsAll: Record<number, PlayerSkin> = {};
      const tSkinsAll: Record<number, PlayerSkin> = {};

      for (const row of skinsRows) {
        const stickers = [
          parseStickerString(row.weapon_sticker_0 || '0;0;0;0;0;0;0'),
          parseStickerString(row.weapon_sticker_1 || '0;0;0;0;0;0;0'),
          parseStickerString(row.weapon_sticker_2 || '0;0;0;0;0;0;0'),
          parseStickerString(row.weapon_sticker_3 || '0;0;0;0;0;0;0'),
          parseStickerString(row.weapon_sticker_4 || '0;0;0;0;0;0;0'),
        ];

        const skinData: PlayerSkin = {
          weapon_paint_id: row.weapon_paint_id,
          weapon_wear: row.weapon_wear,
          weapon_seed: row.weapon_seed,
          weapon_nametag: row.weapon_nametag || null,
          weapon_stattrak: row.weapon_stattrak === 1,
          weapon_stattrak_count: row.weapon_stattrak_count || 0,
          weapon_stickers: stickers,
        };

        if (row.weapon_team === 3) {
          ctSkinsAll[row.weapon_defindex] = skinData;
          if (row.weapon_defindex < 500) {
            ctSkins[row.weapon_defindex] = skinData;
          }
        } else if (row.weapon_team === 2) {
          tSkinsAll[row.weapon_defindex] = skinData;
          if (row.weapon_defindex < 500) {
            tSkins[row.weapon_defindex] = skinData;
          }
        }
      }

      const [knifeRows] = await pool.query<RowDataPacket[]>(
        "SELECT * FROM wp_player_knife WHERE steamid = ?",
        [steamid]
      );

      for (const row of knifeRows) {
        // Find the defindex for this knife model to look up its skin
        const knifesLocal = getKnifeTypes('en');
        const knifeDefindexStr = Object.keys(knifesLocal).find(k => knifesLocal[parseInt(k, 10)].weapon_name === row.knife);
        const knifeDefindex = knifeDefindexStr ? parseInt(knifeDefindexStr, 10) : 0;

        if (row.weapon_team === 3) {
          const skin = ctSkinsAll[knifeDefindex];
          ctKnife = { 
            knife: row.knife, 
            weapon_team: row.weapon_team,
            weapon_paint_id: skin?.weapon_paint_id || 0,
            weapon_wear: skin?.weapon_wear || 0,
            weapon_seed: skin?.weapon_seed || 0,
            weapon_nametag: skin?.weapon_nametag,
            weapon_stattrak: skin?.weapon_stattrak
          };
        } else if (row.weapon_team === 2) {
          const skin = tSkinsAll[knifeDefindex];
          tKnife = { 
            knife: row.knife, 
            weapon_team: row.weapon_team,
            weapon_paint_id: skin?.weapon_paint_id || 0,
            weapon_wear: skin?.weapon_wear || 0,
            weapon_seed: skin?.weapon_seed || 0,
            weapon_nametag: skin?.weapon_nametag,
            weapon_stattrak: skin?.weapon_stattrak
          };
        }
      }

      const [agentRows] = await pool.query<RowDataPacket[]>(
        "SELECT * FROM wp_player_agents WHERE steamid = ?",
        [steamid]
      );

      if (agentRows.length > 0) {
        const row = agentRows[0];
        if (row.agent_ct) ctAgent = { agent: row.agent_ct, weapon_team: 3 };
        if (row.agent_t) tAgent = { agent: row.agent_t, weapon_team: 2 };
      }

      const [gloveRows] = await pool.query<RowDataPacket[]>(
        "SELECT * FROM wp_player_gloves WHERE steamid = ?",
        [steamid]
      );

      for (const row of gloveRows) {
        if (row.weapon_team === 3) {
          const skin = ctSkinsAll[row.weapon_defindex];
          ctGlove = { 
            weapon_defindex: row.weapon_defindex, 
            weapon_paint_id: skin ? skin.weapon_paint_id : 0, 
            weapon_wear: skin ? skin.weapon_wear : 0, 
            weapon_seed: skin ? skin.weapon_seed : 0, 
            weapon_team: row.weapon_team 
          };
        } else if (row.weapon_team === 2) {
          const skin = tSkinsAll[row.weapon_defindex];
          tGlove = { 
            weapon_defindex: row.weapon_defindex, 
            weapon_paint_id: skin ? skin.weapon_paint_id : 0, 
            weapon_wear: skin ? skin.weapon_wear : 0, 
            weapon_seed: skin ? skin.weapon_seed : 0, 
            weapon_team: row.weapon_team 
          };
        }
      }

      const [musicRows] = await pool.query<RowDataPacket[]>(
        "SELECT * FROM wp_player_music WHERE steamid = ?",
        [steamid]
      );

      for (const row of musicRows) {
        if (row.weapon_team === 3) ctMusic = { music_id: row.music_id, weapon_team: row.weapon_team };
        else if (row.weapon_team === 2) tMusic = { music_id: row.music_id, weapon_team: row.weapon_team };
      }

      const [pinRows] = await pool.query<RowDataPacket[]>(
        "SELECT * FROM wp_player_pins WHERE steamid = ?",
        [steamid]
      );

      for (const row of pinRows) {
        if (row.weapon_team === 3) ctPin = { id: row.id, weapon_team: row.weapon_team };
        else if (row.weapon_team === 2) tPin = { id: row.id, weapon_team: row.weapon_team };
      }
    } catch (err) {
      console.error("Database error:", err);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 p-4 md:p-8 selection:bg-rose-500/30 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-3xl bg-neutral-900/50 border border-neutral-800 backdrop-blur-md">
          <div>
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent">
              {t.title}
            </h1>
            <p className="text-neutral-400 font-medium mt-1">{t.subtitle}</p>
          </div>
          
          <div className="flex items-center gap-4">
            <LocaleSwitcher locale={locale} />

            {!steamid ? (
              <Link
                href="/api/auth/steam"
                className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-100 hover:bg-white text-neutral-900 font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:-translate-y-0.5"
              >
                <LogIn className="w-5 h-5" />
                {t.signIn}
              </Link>
            ) : (
              <div className="flex items-center gap-4">
                <div className="px-4 py-2 rounded-lg bg-neutral-800/50 border border-neutral-700 text-sm font-medium">
                  {steamid}
                </div>
                <Link
                  href="/api/auth/logout"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  {t.logout}
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        {!steamid ? (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
            <div className="w-24 h-24 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4">
              <Settings2 className="w-10 h-10 text-neutral-600" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-300">{t.authRequired}</h2>
            <p className="text-neutral-500 max-w-md">
              {t.authDesc}
            </p>
          </div>
        ) : (
          <div className="space-y-12 pb-20">
            {/* CT Section */}
            <TeamSection
              teamId={3}
              teamName={t.teamCT}
              customizedSkins={ctSkins}
              knife={ctKnife}
              agent={ctAgent}
              glove={ctGlove}
              music={ctMusic}
              pin={ctPin}
              weapons={weapons}
              skins={skins}
              knifes={knifes}
              agents={agentsDict}
              gloves={glovesDict}
              musics={musicDict}
              pins={pinsDict}
              locale={locale}
              t={t}
            />

            {/* T Section */}
            <TeamSection
              teamId={2}
              teamName={t.teamT}
              customizedSkins={tSkins}
              knife={tKnife}
              agent={tAgent}
              glove={tGlove}
              music={tMusic}
              pin={tPin}
              weapons={weapons}
              skins={skins}
              knifes={knifes}
              agents={agentsDict}
              gloves={glovesDict}
              musics={musicDict}
              pins={pinsDict}
              locale={locale}
              t={t}
            />
          </div>
        )}
      </div>
    </main>
  );
}
