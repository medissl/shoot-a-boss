import { Edges } from "@react-three/drei";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { ARENA_HALF_SIZE } from "../game/config";
import { getLevelDefinition } from "../game/levels";
import { useGameStore } from "../game/store";
import { Arena } from "./Arena";
import { ReactiveFoliage } from "./Foliage";

const BLUE = "#2548b8";
const PAPER = "#fbfaf4";
const GREEN = "#78a85d";
const GREEN_DARK = "#3f754b";
const BARK = "#856846";

function WorldBase({
  floor,
  wall,
  background,
  grid = BLUE,
}: {
  floor: string;
  wall: string;
  background: string;
  grid?: string;
}) {
  const size = ARENA_HALF_SIZE * 2;

  return (
    <>
      <color attach="background" args={[background]} />
      <fog attach="fog" args={[background, 84, 155]} />
      <hemisphereLight intensity={1.7} color="#ffffff" groundColor={wall} />
      <directionalLight
        castShadow
        position={[18, 27, 12]}
        intensity={1.85}
        color="#ffffff"
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

function JungleBigTree() {
  return (
    <group position={[0, 0, -8]}>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[1.55, 3.25, 1.55]} position={[0, 3.25, 0]} />
        <mesh position={[0, 3.25, 0]} castShadow>
          <cylinderGeometry args={[1.2, 1.6, 6.5, 10]} />
          <meshStandardMaterial color={BARK} roughness={1} />
          <Edges color={BLUE} threshold={8} />
        </mesh>
      </RigidBody>

      {[
        [-1.8, 5.7, 0.1, 2.3],
        [1.8, 5.9, 0.2, 2.35],
        [0, 7.35, -0.2, 2.8],
      ].map(([x, y, z, radius], index) => (
        <mesh key={index} position={[x, y, z]} castShadow>
          <icosahedronGeometry args={[radius, 1]} />
          <meshStandardMaterial
            color={index === 1 ? GREEN_DARK : GREEN}
            roughness={1}
          />
          <Edges color={BLUE} threshold={10} />
        </mesh>
      ))}

      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[2.5, 0.16, 2.2]} position={[0.1, 6.45, 0]} />
        <mesh position={[0.1, 6.45, 0]} castShadow>
          <boxGeometry args={[5, 0.32, 4.4]} />
          <meshStandardMaterial color={PAPER} roughness={1} />
          <Edges color={BLUE} threshold={8} />
        </mesh>
      </RigidBody>

      <group position={[2.15, 0, 0]}>
        <mesh position={[0, 3.55, -0.68]}>
          <boxGeometry args={[0.1, 7.1, 0.1]} />
          <meshBasicMaterial color={BLUE} />
        </mesh>
        <mesh position={[0, 3.55, 0.68]}>
          <boxGeometry args={[0.1, 7.1, 0.1]} />
          <meshBasicMaterial color={BLUE} />
        </mesh>
        {Array.from({ length: 14 }, (_, index) => (
          <mesh key={index} position={[0, 0.5 + index * 0.48, 0]}>
            <boxGeometry args={[0.1, 0.07, 1.38]} />
            <meshBasicMaterial color={index % 4 === 0 ? "#d77b16" : BLUE} />
          </mesh>
        ))}
      </group>
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
      <JungleBigTree />
      {JUNGLE_TREES.map((position, index) => (
        <JungleTree
          key={index}
          position={[
            position[0] + (index % 2 ? drift * 0.25 : 0),
            position[1],
            position[2],
          ]}
          scale={0.82 + (index % 3) * 0.08}
        />
      ))}
      <ReactiveFoliage />
    </>
  );
}

const GEM_ROCKS: [number, number, number, number][] = [
  [-28, 0, -22, 4.6],
  [21, 0, -27, 4.2],
  [31, 0, 14, 4.8],
  [3, 0, 28, 5.2],
  [-29, 0, 22, 4.1],
  [-2, 0, -4, 3.2],
];

const GEM_COLORS = ["#59b8ff", "#ef5b73", "#69c27b", "#ffd45e"];

function GemRock({
  position,
  radius,
  hell = false,
  index,
}: {
  position: [number, number, number];
  radius: number;
  hell?: boolean;
  index: number;
}) {
  const color = hell
    ? index % 2
      ? "#6b1313"
      : "#a32323"
    : "#dfe5f4";

  return (
    <group position={position}>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[radius, radius * 0.72, radius]} position={[0, radius * 0.72, 0]} />
        <mesh position={[0, radius * 0.72, 0]} castShadow receiveShadow>
          <coneGeometry args={[radius, radius * 1.55, 6]} />
          <meshStandardMaterial color={color} roughness={1} />
          <Edges color={hell ? "#531010" : BLUE} threshold={8} />
        </mesh>
      </RigidBody>

      {Array.from({ length: 4 }, (_, gemIndex) => {
        const angle = gemIndex * 1.57 + index * 0.43;
        const distance = radius * 0.72;
        const gemColor = hell
          ? gemIndex % 2
            ? "#ff7b31"
            : "#ff334d"
          : GEM_COLORS[(index + gemIndex) % GEM_COLORS.length];

        return (
          <mesh
            key={gemIndex}
            position={[
              Math.cos(angle) * distance,
              0.65 + (gemIndex % 2) * 0.35,
              Math.sin(angle) * distance,
            ]}
            rotation={[0.2, angle, 0.18]}
            castShadow
          >
            <octahedronGeometry args={[0.72 + (gemIndex % 2) * 0.18, 0]} />
            <meshStandardMaterial
              color={gemColor}
              emissive={gemColor}
              emissiveIntensity={hell ? 0.24 : 0.1}
              roughness={0.72}
            />
            <Edges color={hell ? "#501010" : BLUE} threshold={6} />
          </mesh>
        );
      })}
    </group>
  );
}

function GemArena({ hell = false, level }: { hell?: boolean; level: number }) {
  const shift = ((level * 11) % 5) * 0.22;

  return (
    <>
      <WorldBase
        floor={hell ? "#651515" : "#e2e8f3"}
        wall={hell ? "#7a1717" : "#cdd8ec"}
        background={hell ? "#310909" : "#f4f7fb"}
        grid={hell ? "#ff6048" : BLUE}
      />
      {GEM_ROCKS.map(([x, y, z, radius], index) => (
        <GemRock
          key={index}
          position={[x + (index % 2 ? shift : -shift), y, z]}
          radius={radius}
          hell={hell}
          index={index}
        />
      ))}

      {hell &&
        [
          [-40, 0, 38],
          [39, 0, -35],
          [0, 0, 42],
        ].map(([x, y, z], index) => (
          <group key={index} position={[x, y, z]}>
            <mesh position={[0, 2.2, 0]} castShadow>
              <cylinderGeometry args={[0.35, 0.6, 4.4, 7]} />
              <meshStandardMaterial color="#3b1812" roughness={1} />
              <Edges color="#ff6048" threshold={8} />
            </mesh>
            <mesh position={[-0.8, 4.1, 0]} rotation={[0, 0, 0.65]}>
              <coneGeometry args={[0.55, 2.5, 5]} />
              <meshStandardMaterial color="#7a1717" roughness={1} />
              <Edges color="#ff6048" threshold={8} />
            </mesh>
            <mesh position={[0.85, 3.9, 0]} rotation={[0, 0, -0.7]}>
              <coneGeometry args={[0.5, 2.2, 5]} />
              <meshStandardMaterial color="#7a1717" roughness={1} />
              <Edges color="#ff6048" threshold={8} />
            </mesh>
          </group>
        ))}
    </>
  );
}

export function LevelArena() {
  const level = useGameStore((state) => state.currentLevel);
  const definition = getLevelDefinition(level);

  if (definition.theme === "playground") return <Arena />;
  if (definition.theme === "jungle") return <JungleArena level={level} />;
  if (definition.theme === "gems") return <GemArena level={level} />;
  return <GemArena hell level={level} />;
}
