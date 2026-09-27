import { Edges } from "@react-three/drei";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { ARENA_HALF_SIZE } from "../game/config";
import { getLevelDefinition, JUNGLE_SMALL_TREES } from "../game/levels";
import { useGameStore } from "../game/store";
import { Arena } from "./Arena";
import { ReactiveFoliage } from "./Foliage";
import { JungleHuts, JungleLogs, JungleTowers, JungleUndergrowth } from "./WorldFeatures";
import { GemCavern } from "./GemCavern";
import { HellHazards, HellMountain } from "./HellFeatures";

const BLUE = "#2548b8";
const GREEN = "#78a85d";
const BARK = "#856846";

function WorldBase({
  floor,
  wall,
  background,
  grid = BLUE,
  dark = false,
}: {
  floor: string;
  wall: string;
  background: string;
  grid?: string;
  dark?: boolean;
}) {
  const size = ARENA_HALF_SIZE * 2;

  return (
    <>
      <color attach="background" args={[background]} />
      <fog attach="fog" args={[background, dark ? 25 : 84, dark ? 82 : 155]} />
      <hemisphereLight intensity={dark ? 0.055 : 1.7} color={dark ? "#8889cc" : "#ffffff"} groundColor={wall} />
      <directionalLight
        castShadow
        position={[18, 27, 12]}
        intensity={dark ? 0.11 : 1.85}
        color={dark ? "#6e80c0" : "#ffffff"}
        shadow-mapSize={[2048, 2048]}
      />

      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider
          args={[ARENA_HALF_SIZE, 0.2, ARENA_HALF_SIZE]}
          position={[0, -0.2, 0]}
        />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[size, size, 32, 32]} />
          <meshStandardMaterial color={floor} roughness={1} />
        </mesh>
        <gridHelper
          args={[size, 52, grid, grid]}
          position={[0, 0.012, 0]}
          material-opacity={0.18}
          material-transparent
        />
      </RigidBody>

      {[
        [0, 3, -ARENA_HALF_SIZE, size, 6, 0.7],
        [0, 3, ARENA_HALF_SIZE, size, 6, 0.7],
        [-ARENA_HALF_SIZE, 3, 0, 0.7, 6, size],
        [ARENA_HALF_SIZE, 3, 0, 0.7, 6, size],
      ].map(([x, y, z, w, h, d], index) => (
        <RigidBody type="fixed" colliders={false} key={index}>
          <CuboidCollider
            args={[w / 2, h / 2, d / 2]}
            position={[x, y, z]}
          />
          <mesh position={[x, y, z]} castShadow receiveShadow>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial color={wall} roughness={1} />
            <Edges color={grid} threshold={10} />
          </mesh>
        </RigidBody>
      ))}
    </>
  );
}

const JUNGLE_TREES: [number, number, number][] = [
  [-31, 0, -22],
  [-8, 0, -30],
  [22, 0, -28],
  [34, 0, -4],
  [26, 0, 26],
  [2, 0, 31],
  [-27, 0, 27],
  [-38, 0, 5],
];

function JungleTree({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[0.85, 2.3, 0.85]} position={[0, 2.3, 0]} />
        <mesh position={[0, 2.3, 0]} castShadow>
          <cylinderGeometry args={[0.58, 0.82, 4.6, 8]} />
          <meshStandardMaterial color={BARK} roughness={1} />
          <Edges color={BLUE} threshold={8} />
        </mesh>
      </RigidBody>
      {[
        [-1.2, 4.9, 0.2, 1.7],
        [1.2, 5.0, -0.1, 1.8],
        [0, 6.1, 0, 2.1],
      ].map(([x, y, z, radius], index) => (
        <mesh key={index} position={[x, y, z]} castShadow>
          <icosahedronGeometry args={[radius, 1]} />
          <meshStandardMaterial
            color={index % 2 ? GREEN : "#a4c875"}
            roughness={1}
          />
          <Edges color={BLUE} threshold={10} />
        </mesh>
      ))}
    </group>
  );
}

function JungleArena({ level }: { level: number }) {
  const drift = ((level * 13) % 7) - 3;

  return (
    <>
      <WorldBase
        floor="#dbe8b9"
        wall="#c7d99f"
        background="#f2f4df"
        grid="#4b7b58"
      />
      <JungleTowers />
      <JungleHuts />
      <JungleLogs />
      <JungleUndergrowth />
      {[...JUNGLE_TREES, ...JUNGLE_SMALL_TREES.map(([x,z]): [number,number,number] => [x, 0, z])].map((position, index) => (
        <JungleTree
          key={index}
          position={[
            position[0] + (index % 2 ? drift * 0.25 : 0),
            position[1],
            position[2],
          ]}
          scale={index < JUNGLE_TREES.length ? 0.82 + (index % 3) * 0.08 : 0.48 + (index % 4) * 0.07}
        />
      ))}
      <ReactiveFoliage />
    </>
  );
}

function GemArena({ hell = false }: { hell?: boolean }) {
  return (
    <>
      <WorldBase
        floor={hell ? "#4b2322" : "#151324"}
        wall={hell ? "#602522" : "#25283e"}
        background={hell ? "#210d15" : "#101423"}
        grid={hell ? "#ff6048" : BLUE}
        dark={!hell}
      />
      {hell ? <><HellMountain /><HellHazards /></> : <GemCavern />}
    </>
  );
}

export function LevelArena() {
  const level = useGameStore((state) => state.currentLevel);
  const definition = getLevelDefinition(level);

  if (definition.theme === "playground") return <Arena />;
  if (definition.theme === "jungle") return <JungleArena level={level} />;
  if (definition.theme === "gems") return <GemArena />;
  return <GemArena hell />;
}
