import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { WEAPONS, type WeaponId } from "../game/config";
import { applyEnemyStatus } from "../game/effects";
import { getUpgradeStats } from "../game/progression";
import { getSkin, skinColor, type SkinId } from "../game/skins";
import { equippedGearRank, useGameStore } from "../game/store";
import { weaponMuzzleWorldPosition } from "../game/weaponMuzzle";

type Trace = {
  id: number;
  color: string;
  from: [number, number, number];
  to: [number, number, number];
  hit: boolean;
  startedAt: number;
  durationMs: number;
};

type Impact = {
  id: number;
  color: string;
  skin: SkinId;
  position: [number, number, number];
  sparks: [number, number, number][];
};

type HitPart = "head" | "body" | "leg";

type HitSummary = {
  damage: number;
  part: HitPart;
};

const PART_PRIORITY: Record<HitPart, number> = {
  leg: 0,
  body: 1,
  head: 2,
};

function TraceLine({ trace }: { trace: Trace }) {
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.MeshBasicMaterial>(null);
  const glow = useRef<THREE.MeshBasicMaterial>(null);
  const from = useMemo(() => new THREE.Vector3(...trace.from), [trace.from]);
  const to = useMemo(() => new THREE.Vector3(...trace.to), [trace.to]);
  const length = from.distanceTo(to);
  const direction = useMemo(() => to.clone().sub(from).normalize(), [from, to]);
  const quaternion = useMemo(
    () =>
      new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction,
      ),
    [direction],
  );

  useFrame(() => {
    if (!group.current) return;
    const progress = THREE.MathUtils.clamp((performance.now() - trace.startedAt) / trace.durationMs, 0, 1);
    const traveled = length * (1 - (1 - progress) * (1 - progress));
    // Keep the back of both cylinders exactly on the muzzle throughout the
    // animation. No detached tip geometry is allowed near the crosshair.
    group.current.position.copy(from).addScaledVector(direction, traveled / 2);
    group.current.scale.set(1, Math.max(.001, traveled), 1);
    if (core.current) core.current.opacity = (trace.hit ? .85 : .65) * (1 - progress * .85);
    if (glow.current) glow.current.opacity = .18 * (1 - progress);
  });

  return (
    <group ref={group} position={from} quaternion={quaternion} scale={[1, .001, 1]} userData={{ ignoreProjectile: true }}>
      <mesh>
        <cylinderGeometry args={[.004, .008, 1, 6]} />
        <meshBasicMaterial ref={core} color={trace.color} transparent opacity={.85} depthWrite={false} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[.018, .024, 1, 6]} />
        <meshBasicMaterial ref={glow} color={trace.color} transparent opacity={.18} depthWrite={false} />
      </mesh>
    </group>
  );
}

function ImpactBurst({ impact }: { impact: Impact }) {
  const skin=getSkin(impact.skin);
  return (
    <group position={impact.position} userData={{ ignoreProjectile: true }}>
      {impact.sparks.map((offset, index) => (
        <mesh position={offset} key={index}>
          {skin && ["pixel","redaction","hazard","cassette","blueprint"].includes(skin.motif)?<boxGeometry args={[.1,.075,.08]}/>:skin && ["ice","prism","fold","storm"].includes(skin.motif)?<tetrahedronGeometry args={[.09]}/>:<octahedronGeometry args={[index % 2 ? 0.05 : 0.075, 0]} />}
          <meshBasicMaterial
            color={index % 3 === 0 ? (skin?.accent ?? "#ffffff") : impact.color}
            transparent
            opacity={0.95}
            depthWrite={false}
          />
        </mesh>
      ))}
      <mesh>
        <ringGeometry args={[skin?.rarity==="legendary"?.11:.075,skin?.rarity==="legendary"?.17:.125,skin?.motif==="ice"||skin?.motif==="prism"?6:skin?.motif==="pixel"||skin?.motif==="redaction"?4:skin?.motif==="stars"?18:9]} />
        <meshBasicMaterial
          color={impact.color}
          side={THREE.DoubleSide}
          transparent
          opacity={0.8}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function ignoresProjectile(object: THREE.Object3D) {
  let current: THREE.Object3D | null = object;
  while (current) {
    if (current.userData.ignoreProjectile) return true;
    current = current.parent;
  }
  return false;
}

function firstProjectileIntersection(
  intersections: THREE.Intersection<THREE.Object3D>[],
) {
  return intersections.find(({ object }) => !ignoresProjectile(object));
}
function projectileMeshes(scene: THREE.Scene) {
  const meshes: THREE.Object3D[] = [];
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh && !ignoresProjectile(object)) meshes.push(object);
  });
  return meshes;
}

function inheritedUserData(object: THREE.Object3D, key: string) {
  let current: THREE.Object3D | null = object;
  while (current) {
    const value = current.userData[key] as string | undefined;
    if (value) return value;
    current = current.parent;
  }
  return undefined;
}

export function CombatSystem() {
  const { camera, scene, gl } = useThree();
  const lastShot = useRef(0);
  const aimReadyAt = useRef(0);
  const emptyAlertAt = useRef(0);
  const autoFire = useRef<number | null>(null);
  const rifleShots = useRef(0);
  const nextTraceId = useRef(1);
  const nextImpactId = useRef(1);
  const [traces, setTraces] = useState<Trace[]>([]);
  const [impacts, setImpacts] = useState<Impact[]>([]);
  const screen = useGameStore((state) => state.screen);
  const weapon = useGameStore((state) => state.weapon);
  const scoped = useGameStore((state) => state.scoped);
  const reloading = useGameStore((state) => state.reloading);
  const setScoped = useGameStore((state) => state.setScoped);
  const spendRound = useGameStore((state) => state.spendRound);
  const reload = useGameStore((state) => state.reload);
  const setWeapon = useGameStore((state) => state.setWeapon);
  const cycleWeapon = useGameStore((state) => state.cycleWeapon);

  useFrame((state) => {
    const perspective = state.camera as THREE.PerspectiveCamera;
    const current = WEAPONS[weapon];
    const wanted =
      scoped && weapon !== "knife" ? current.scopedFov : 70;
    const speed =
      weapon === "sniper"
        ? scoped
          ? 0.075
          : 0.1
        : scoped
          ? 0.17
          : 0.15;

    perspective.fov = THREE.MathUtils.lerp(perspective.fov, wanted, speed);
    perspective.updateProjectionMatrix();
  });

  useEffect(() => {
    function addTrace(from: THREE.Vector3, to: THREE.Vector3, hit: boolean) {
      const id = nextTraceId.current++;
      const durationMs = Math.min(210, Math.max(95, from.distanceTo(to) * 9));
      const color = useGameStore.getState().equippedSkins[useGameStore.getState().weapon];
      setTraces((current) => [
        ...current.slice(-10),
        {
          id,
          color: color === "default" ? hit ? "#ff6ea8" : "#5978e8" : skinColor(color),
          from: [from.x, from.y, from.z],
          to: [to.x, to.y, to.z],
          hit,
          startedAt: performance.now(),
          durationMs,
        },
      ]);

      window.setTimeout(() => {
        setTraces((current) => current.filter((trace) => trace.id !== id));
      }, durationMs);
    }

    function addImpact(position: THREE.Vector3) {
      const id = nextImpactId.current++;
      const color = useGameStore.getState().equippedSkins[useGameStore.getState().weapon];
      const sparks: [number, number, number][] = Array.from(
        { length: 8 },
        () => [
          (Math.random() - 0.5) * 0.42,
          (Math.random() - 0.5) * 0.42,
          (Math.random() - 0.5) * 0.26,
        ],
      );

      setImpacts((current) => [
        ...current.slice(-14),
        {
          id,
          color: color === "default" ? "#ff5f9d" : skinColor(color),
          skin: color,
          position: [position.x, position.y, position.z],
          sparks,
        },
      ]);

      window.setTimeout(() => {
        setImpacts((current) =>
          current.filter((impact) => impact.id !== id),
        );
      }, 100);
    }

    function emptyMagazine(currentWeapon: WeaponId) {
      const now = performance.now();
      if (now - emptyAlertAt.current < 800) return;
      emptyAlertAt.current = now;
      window.dispatchEvent(
        new CustomEvent("empty-mag", {
          detail: { weapon: currentWeapon },
        }),
      );
    }

    function fireKnife() {
      const state = useGameStore.getState();
      const stats = getUpgradeStats(state.upgrades);
      const now = performance.now();
      const cooldown =
        WEAPONS.knife.cooldownMs * stats.fireCooldown;

      if (now - lastShot.current < cooldown) return;
      lastShot.current = now;

      const raycaster = new THREE.Raycaster();
      raycaster.far = WEAPONS.knife.maxRange * (now < state.paperTrailUntil ? 1.25 : 1);
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

      const intersections = raycaster.intersectObjects(projectileMeshes(scene), false);
      const first = firstProjectileIntersection(intersections);

      if (first && first.distance <= WEAPONS.knife.maxRange * (now < state.paperTrailUntil ? 1.25 : 1)) {
        const targetId = inheritedUserData(first.object, "targetId");
        const propId = inheritedUserData(first.object, "propId");
        const destructibleId = inheritedUserData(
          first.object,
          "destructibleId",
        );

        if (targetId || propId || destructibleId) {
          addImpact(first.point);
          window.dispatchEvent(new Event("knife-impact"));
        }

        if (targetId) {
          const rawPart = first.object.userData.targetPart as
            | HitPart
            | undefined;
          const part: HitPart =
            rawPart === "head" || rawPart === "leg"
              ? rawPart
              : "body";
          const partMultiplier =
            part === "head" ? 1.6 : part === "leg" ? 0.65 : 1;
          const damage =
            WEAPONS.knife.damage * (now < state.crunchUntil ? 1.10 : 1) *
            stats.damage *
            stats.knifeDamage *
            partMultiplier;

          window.dispatchEvent(
            new CustomEvent("boss-impact", {
              detail: {
                id: targetId,
                part,
                point: [first.point.x, first.point.y, first.point.z],
              },
            }),
          );
          window.dispatchEvent(
            new CustomEvent("boss-hit", {
              detail: { id: targetId, damage, part },
            }),
          );
        } else if (propId) {
          window.dispatchEvent(
            new CustomEvent("prop-shot", {
              detail: {
                id: propId,
                direction: [
                  raycaster.ray.direction.x,
                  raycaster.ray.direction.y,
                  raycaster.ray.direction.z,
                ],
                force: 1.8,
              },
            }),
          );
        } else if (destructibleId) {
          window.dispatchEvent(
            new CustomEvent("surface-hit", {
              detail: {
                id: destructibleId,
                point: [first.point.x, first.point.y, first.point.z],
                direction: [
                  raycaster.ray.direction.x,
                  raycaster.ray.direction.y,
                  raycaster.ray.direction.z,
                ],
              },
            }),
          );
        }
      }

      window.dispatchEvent(
        new CustomEvent("weapon-fired", {
          detail: { weapon: "knife" as WeaponId },
        }),
      );
    }

    function fire(currentWeapon: WeaponId) {
      const state = useGameStore.getState();
      if (state.reloading) return;
      if (currentWeapon === "knife") {
        fireKnife();
        return;
      }

      const config = WEAPONS[currentWeapon];
      const stats = getUpgradeStats(state.upgrades);
      const now = performance.now();
      const currentAmmo = state.ammo[currentWeapon];

      if (currentAmmo.mag <= 0) {
        emptyMagazine(currentWeapon);
        return;
      }

      const cooldown = config.cooldownMs * (now < state.crunchUntil ? .85 : 1) *
        (currentWeapon === "sniper" ? Math.pow(0.85, state.upgrades.sniperBolt) : stats.fireCooldown) *
        (currentWeapon === "rifle" ? Math.pow(0.90, state.upgrades.rifleOverclock) : 1);

      if (now - lastShot.current < cooldown) return;

      const aimed = state.scoped;
      if (aimed && now < aimReadyAt.current) return;

      if (!spendRound(currentWeapon)) {
        emptyMagazine(currentWeapon);
        return;
      }

      lastShot.current = now;

      if (currentWeapon === "rifle") rifleShots.current += 1;
      const spread =
        (aimed ? config.aimedSpread : config.hipSpread) *
        stats.spread *
        (currentWeapon === "rifle" ? Math.pow(0.82, state.upgrades.riflePrecision) : 1) *
        (currentWeapon === "shotgun" ? Math.pow(0.8, state.upgrades.shotgunChoke) : 1);
      const hits = new Map<string, HitSummary>();
      const candidates = projectileMeshes(scene);
      const muzzle = weaponMuzzleWorldPosition(camera, gl.domElement, currentWeapon, aimed);

      const pelletCount = currentWeapon === "sniper" && state.upgrades.sniperTwin ? 2 :
        config.pellets + (currentWeapon === "shotgun" ? state.upgrades.shotgunPellets + state.upgrades.shotgunDouble * 2 : 0);
      for (let pellet = 0; pellet < pelletCount; pellet += 1) {
        const raycaster = new THREE.Raycaster();
        const spreadX = (Math.random() - 0.5) * spread;
        const spreadY = (Math.random() - 0.5) * spread;
        raycaster.far = config.maxRange;
        raycaster.setFromCamera(
          new THREE.Vector2(spreadX + (currentWeapon === "sniper" && pellet === 1 ? 0.003 : 0), spreadY),
          camera,
        );

        const intersections = raycaster.intersectObjects(candidates, false);
        const first = firstProjectileIntersection(intersections);
        const end = first
          ? first.point.clone()
          : raycaster.ray.origin
              .clone()
              .add(
                raycaster.ray.direction
                  .clone()
                  .multiplyScalar(config.maxRange),
              );

        const targetId = first
          ? inheritedUserData(first.object, "targetId")
          : undefined;
        const propId = first
          ? inheritedUserData(first.object, "propId")
          : undefined;
        const destructibleId = first
          ? inheritedUserData(first.object, "destructibleId")
          : undefined;

        if (muzzle && (currentWeapon !== "shotgun" || pellet < 3)) {
          addTrace(muzzle, end, Boolean(targetId || propId || destructibleId));
        }

        if (!first) continue;

        if (propId && !targetId) {
          addImpact(first.point);
          window.dispatchEvent(
            new CustomEvent("prop-shot", {
              detail: {
                id: propId,
                direction: [
                  raycaster.ray.direction.x,
                  raycaster.ray.direction.y,
                  raycaster.ray.direction.z,
                ],
                force:
                  currentWeapon === "sniper"
                    ? 3.4
                    : currentWeapon === "shotgun"
                      ? 2.35
                      : 1.15,
              },
            }),
          );
          continue;
        }

        if (destructibleId && !targetId && !propId) {
          addImpact(first.point);
          window.dispatchEvent(
            new CustomEvent("surface-hit", {
              detail: {
                id: destructibleId,
                point: [first.point.x, first.point.y, first.point.z],
                direction: [
                  raycaster.ray.direction.x,
                  raycaster.ray.direction.y,
                  raycaster.ray.direction.z,
                ],
              },
            }),
          );
          continue;
        }

        if (!targetId) continue;

        addImpact(first.point);

        const rawPart = first.object.userData.targetPart as
          | HitPart
          | undefined;
        const targetPart: HitPart =
          rawPart === "head" || rawPart === "leg"
            ? rawPart
            : "body";

        window.dispatchEvent(
          new CustomEvent("boss-impact", {
            detail: {
              id: targetId,
              part: targetPart,
              point: [first.point.x, first.point.y, first.point.z],
            },
          }),
        );

        window.dispatchEvent(
          new CustomEvent("paint-splash", {
            detail: {
              position: [first.point.x, 0.025, first.point.z],
              size: currentWeapon === "shotgun" ? 0.5 : 0.34,
            },
          }),
        );

        const partMultiplier =
          targetPart === "head"
            ? 1.6
            : targetPart === "leg"
              ? 0.65
              : 1;

        let damage =
          config.damage *
          (currentWeapon === "sniper" && pellet === 1 ? 0.45 : 1) *
          partMultiplier *
          stats.damage * (now < state.crunchUntil ? 1.10 : 1) * (1 + equippedGearRank(state, "barrel") * 0.03) * (state.freshPrintShots > 0 ? 1.05 : 1) *
          (currentWeapon === "sniper" ? (aimed ? 1 + state.upgrades.sniperFocus * 0.15 : 1) : 1) *
          (currentWeapon === "rifle" ? 1 + state.upgrades.riflePower * 0.12 : 1);

        if (currentWeapon === "shotgun") {
          const fullDamageDistance = 5.5;
          const falloffDistance = Math.max(
            0,
            first.distance - fullDamageDistance,
          );
          const falloff = THREE.MathUtils.clamp(
            1 - falloffDistance / 18,
            0.16,
            1,
          );
          damage *= falloff;
          if (first.distance < 6) damage *= 1 + state.upgrades.shotgunClose * 0.20;
        }

        const previous = hits.get(targetId);
        if (!previous) {
          hits.set(targetId, { damage, part: targetPart });
        } else {
          hits.set(targetId, {
            damage: previous.damage + damage,
            part:
              PART_PRIORITY[targetPart] > PART_PRIORITY[previous.part]
                ? targetPart
                : previous.part,
          });
        }
      }

      if (currentWeapon === "sniper" && state.upgrades.sniperPierce > 0) {
        const piercingRay = new THREE.Raycaster();
        piercingRay.far = config.maxRange;
        piercingRay.setFromCamera(new THREE.Vector2(0, 0), camera);
        const seen = new Set(hits.keys());
        for (const intersection of piercingRay.intersectObjects(candidates, false)) {
          if (ignoresProjectile(intersection.object)) continue;
          const id = inheritedUserData(intersection.object, "targetId");
          if (!id) break;
          if (seen.has(id)) continue;
          seen.add(id);
          hits.set(id, { damage: config.damage * stats.damage * 0.55 * state.upgrades.sniperPierce, part: "body" });
          addImpact(intersection.point);
          break;
        }
      }

      if (currentWeapon === "rifle" && state.upgrades.rifleSurge && rifleShots.current % 6 === 0) {
        hits.forEach((summary) => { summary.damage *= 1.65; });
      }
      hits.forEach((summary, id) => {
        window.dispatchEvent(
          new CustomEvent("boss-hit", {
            detail: {
              id,
              damage: summary.damage,
              part: summary.part,
            },
          }),
        );
        if (currentWeapon === "rifle" && state.upgrades.rifleFreeze) {
          applyEnemyStatus(id, state.runId, 800);
        }
        if (currentWeapon === "shotgun" && state.upgrades.shotgunSlow) {
          applyEnemyStatus(id, state.runId, 0, 1500, .65, 2500);
        }
        if (currentWeapon === "sniper" && state.upgrades.sniperFire) {
          for (let tick = 1; tick <= 4; tick += 1) {
            window.setTimeout(() => {
              const live = useGameStore.getState();
              if (live.runId !== state.runId || live.screen !== "playing" || live.eliminated.includes(id)) return;
              window.dispatchEvent(new CustomEvent("boss-hit", {
                detail: { id, damage: 6 * state.upgrades.sniperFire, part: "body" },
              }));
            }, tick * 1000);
          }
        }
      });

      window.dispatchEvent(
        new CustomEvent("weapon-fired", {
          detail: { weapon: currentWeapon },
        }),
      );
    }

    function stopAutoFire() {
      if (autoFire.current !== null) {
        window.clearInterval(autoFire.current);
        autoFire.current = null;
      }
      window.dispatchEvent(new Event("rifle-trigger-up"));
    }

    const mouseDown = (event: MouseEvent) => {
      const state = useGameStore.getState();
      if (state.screen !== "playing" || state.tutorialOpen) return;

      if (event.button === 2) {
        event.preventDefault();
        if (state.reloading || state.weapon === "knife") return;

        const currentWeapon = state.weapon;
        setScoped(true);
        aimReadyAt.current =
          performance.now() + WEAPONS[currentWeapon].aimDelayMs;
        return;
      }

      if (event.button !== 0 || state.reloading) return;

      const currentWeapon = state.weapon;
      if (
        currentWeapon === "rifle" &&
        state.ammo.rifle.mag > 0
      ) {
        window.dispatchEvent(new Event("rifle-trigger-down"));
      }

      fire(currentWeapon);

      if (
        currentWeapon === "rifle" &&
        autoFire.current === null
      ) {
        const stats = getUpgradeStats(state.upgrades);
        const interval = Math.max(
          55,
          WEAPONS.rifle.cooldownMs * stats.fireCooldown * Math.pow(0.90, state.upgrades.rifleOverclock),
        );

        autoFire.current = window.setInterval(() => {
          const liveState = useGameStore.getState();
          if (
            liveState.screen !== "playing" ||
            liveState.weapon !== "rifle" ||
            liveState.reloading ||
            liveState.ammo.rifle.mag <= 0
          ) {
            stopAutoFire();
            return;
          }

          fire("rifle");
        }, interval);
      }
    };

    const mouseUp = (event: MouseEvent) => {
      if (event.button === 2) {
        setScoped(false);
        aimReadyAt.current = 0;
      }
      if (event.button === 0) stopAutoFire();
    };

    const keyDown = (event: KeyboardEvent) => {
      if (useGameStore.getState().screen !== "playing" || useGameStore.getState().tutorialOpen) return;
      if (event.code === "KeyQ" && !event.repeat) useGameStore.getState().triggerScan();
      if (event.code === "KeyF" && !event.repeat) useGameStore.getState().castMagic();
      if (event.code === "Digit1") setWeapon("sniper");
      if (event.code === "Digit2") setWeapon("rifle");
      if (event.code === "Digit3") setWeapon("shotgun");
      if (event.code === "Digit4") setWeapon("knife");
      if (event.code === "KeyR") reload();
    };

    const wheel = (event: WheelEvent) => {
      if (useGameStore.getState().screen !== "playing") return;
      cycleWeapon(event.deltaY > 0 ? 1 : -1);
    };

    const contextMenu = (event: MouseEvent) =>
      event.preventDefault();

    window.addEventListener("mousedown", mouseDown);
    window.addEventListener("mouseup", mouseUp);
    window.addEventListener("keydown", keyDown);
    window.addEventListener("wheel", wheel, { passive: true });
    window.addEventListener("contextmenu", contextMenu);

    return () => {
      stopAutoFire();
      window.removeEventListener("mousedown", mouseDown);
      window.removeEventListener("mouseup", mouseUp);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("wheel", wheel);
      window.removeEventListener("contextmenu", contextMenu);
    };
  }, [
    camera,
    gl,
    cycleWeapon,
    reload,
    scene,
    setScoped,
    setWeapon,
    spendRound,
  ]);

  useEffect(() => {
    if (screen !== "playing" || reloading) {
      setScoped(false);
      aimReadyAt.current = 0;
    }
  }, [reloading, screen, setScoped]);

  return (
    <>
      {traces.map((trace) => (
        <TraceLine key={trace.id} trace={trace} />
      ))}
      {impacts.map((impact) => (
        <ImpactBurst key={impact.id} impact={impact} />
      ))}
    </>
  );
}
