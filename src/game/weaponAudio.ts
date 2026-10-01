import type { WeaponId } from "./config";
import { playSkinAccent, type SkinAction } from "./skinSound";
import type { SkinId } from "./skins";

type SoundFile = { path: string; gain: number; boost?: number };
const files: Record<WeaponId, Partial<Record<SkinAction, SoundFile>>> = {
  rifle: {
    fire: { path: "/audio/RifleShoot1Time.mp3", gain: .75 },
    cock: { path: "/audio/RifleCocking.mp3", gain: .72 },
    reload: { path: "/audio/RifleReload.mp3", gain: .8 },
  },
  shotgun: {
    fire: { path: "/audio/ShotgunShoot.mp3", gain: .85 },
    cock: { path: "/audio/ShotgunCocking.mp3", gain: .72 },
    reload: { path: "/audio/ShotgunReload.m4a", gain: .75 },
  },
  sniper: {
    fire: { path: "/audio/SniperShoot.mp3", gain: .95, boost: 1.6 },
    cock: { path: "/audio/SniperCocking.mp3", gain: .72 },
    reload: { path: "/audio/SniperReload.mp3", gain: .9 },
  },
  knife: {
    equip: { path: "/audio/TakeOutKnife.mp3", gain: .8 },
    "knife-hit": { path: "/audio/KnifeStab.mp3", gain: .9 },
  },
};

export function playWeaponEvent(
  weapon: WeaponId,
  skin: SkinId,
  action: SkinAction,
  playFile: (path: string, gain: number, boost?: number) => void,
  context?: AudioContext,
  accentVolume = .5,
) {
  const file = files[weapon][action];
  if (file) playFile(file.path, file.gain, file.boost);
  if (skin !== "default" && context) playSkinAccent(context, skin, action, accentVolume, weapon);
}
