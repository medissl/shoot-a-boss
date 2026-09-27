import { Edges } from "@react-three/drei";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { ARENA_HALF_SIZE, ARENA_OBSTACLES } from "../game/config";
import { ReactiveFoliage } from "./Foliage";

const BLUE = "#2548b8";
const PAPER = "#fbfaf4";
const PALE_BLUE = "#e7ecff";
const SHADOW_BLUE = "#cbd7ff";
const DARK_BLUE = "#17378f";
const ORANGE = "#d77b16";
const GREEN = "#5f9c5a";
const GREEN_LIGHT = "#a4c875";
const BARK = "#8b714d";

function DoodleBox({
  position,
  scale,
  color = PAPER,
  shade = true,
}: {
  position: [number, number, number];
  scale: [number, number, number];
  color?: string;
  shade?: boolean;
}) {
  const destructibleId = `surface:${position.join(":")}:${scale.join(":")}`;

  return (
    <RigidBody type="fixed" colliders={false} position={position}>
      <CuboidCollider args={[scale[0] / 2, scale[1] / 2, scale[2] / 2]} />
      <group>
        <mesh
          scale={scale}
          castShadow
          receiveShadow
          userData={{ destructibleId }}
        >
          <boxGeometry />
          <meshStandardMaterial color={color} roughness={0.96} />
          <Edges color={BLUE} threshold={10} />
        </mesh>
        {shade && (
          <>
            <mesh
              position={[scale[0] / 2 + 0.006, -scale[1] * 0.08, 0]}
              rotation={[0, Math.PI / 2, 0]}
            >
              <planeGeometry args={[scale[2] * 0.97, scale[1] * 0.78]} />
              <meshBasicMaterial
                color={SHADOW_BLUE}
                transparent
                opacity={0.2}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
            <mesh position={[0, -scale[1] * 0.17, scale[2] / 2 + 0.006]}>
              <planeGeometry args={[scale[0] * 0.94, scale[1] * 0.58]} />
              <meshBasicMaterial
                color={BLUE}
                transparent
                opacity={0.055}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
          </>
        )}
      </group>
    </RigidBody>
  );
}

function DoodleWindow({
  position,
  rotation = [0, 0, 0],
  scale = [2.5, 1.5],
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={[scale[0] + 0.18, scale[1] + 0.18, 0.16]} />
        <meshStandardMaterial color={DARK_BLUE} roughness={0.9} />
        <Edges color={BLUE} threshold={5} />
      </mesh>
      <mesh position={[0, 0, 0.09]}>
        <planeGeometry args={scale} />
        <meshBasicMaterial color="#b9d6df" transparent opacity={0.75} />
      </mesh>
      <mesh position={[0, 0, 0.105]}>
        <boxGeometry args={[0.06, scale[1], 0.03]} />
        <meshBasicMaterial color={BLUE} />
      </mesh>
    </group>
  );
}

function FilingCabinet({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <DoodleBox position={[0, 1.3, 0]} scale={[2.2, 2.6, 1.45]} color={PAPER} />
      {[0.65, 1.3, 1.95].map((y, index) => (
        <group key={y}>
          <mesh position={[0, y, 0.735]}>
            <planeGeometry args={[1.72, 0.48]} />
            <meshBasicMaterial color={index % 2 ? PALE_BLUE : PAPER} />
            <Edges color={BLUE} threshold={4} />
          </mesh>
          <mesh position={[0, y, 0.75]}>
            <boxGeometry args={[0.34, 0.06, 0.03]} />
            <meshBasicMaterial color={BLUE} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function GiantCoffee({ position }: { position: [number, number, number] }) {
  return (
    <RigidBody type="fixed" colliders="hull" position={position}>
      <group>
        <mesh position={[0, 1.15, 0]} castShadow>
          <cylinderGeometry args={[1.4, 1.15, 2.3, 16]} />
          <meshStandardMaterial color={PAPER} roughness={1} />
          <Edges color={BLUE} threshold={8} />
        </mesh>
        <mesh position={[1.42, 1.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.65, 0.16, 8, 18]} />
          <meshStandardMaterial color={PAPER} />
          <Edges color={BLUE} threshold={8} />
        </mesh>
        <mesh position={[0, 2.28, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.15, 24]} />
          <meshBasicMaterial color={ORANGE} />
        </mesh>
      </group>
    </RigidBody>
  );
}

function DeskCluster({
  position,
  rotation = 0,
}: {
  position: [number, number, number];
  rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <DoodleBox position={[0, 0.72, 0]} scale={[4.2, 0.18, 1.6]} color={PAPER} />
      <DoodleBox position={[-1.55, 0.35, 0]} scale={[0.18, 0.7, 1.35]} color={PALE_BLUE} />
      <DoodleBox position={[1.55, 0.35, 0]} scale={[0.18, 0.7, 1.35]} color={PALE_BLUE} />
      <mesh position={[0, 1.34, -0.15]} rotation={[0, 0, -0.03]}>
        <planeGeometry args={[1.45, 0.9]} />
        <meshBasicMaterial color={PALE_BLUE} />
        <Edges color={BLUE} threshold={4} />
      </mesh>
    </group>
  );
}

function PaperStack({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {Array.from({ length: 6 }, (_, index) => (
        <mesh
          key={index}
          position={[index % 2 ? 0.07 : -0.05, index * 0.085, 0]}
          rotation={[0, index % 2 ? 0.04 : -0.03, index % 3 ? 0.015 : -0.02]}
        >
          <boxGeometry args={[1.25, 0.08, 0.9]} />
          <meshBasicMaterial color={index % 2 ? PALE_BLUE : PAPER} />
          <Edges color={BLUE} threshold={3} />
        </mesh>
      ))}
    </group>
  );
}

function OfficeChair({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <DoodleBox position={[0, 0.62, 0]} scale={[1.1, 0.12, 1.05]} color={PALE_BLUE} />
      <DoodleBox position={[0, 1.2, -0.46]} scale={[1.05, 1.1, 0.12]} color={PAPER} />
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.8, 7]} />
        <meshStandardMaterial color={BLUE} />
      </mesh>
    </group>
  );
}

function EnterableHouse() {
  return (
    <group position={[-39, 0, -34]}>
      <DoodleBox position={[0, 0.12, 0]} scale={[16, 0.24, 14]} color={PALE_BLUE} />

      <DoodleBox position={[-7.75, 2.45, 0]} scale={[0.5, 4.9, 14]} />
      <DoodleBox position={[7.75, 2.45, 0]} scale={[0.5, 4.9, 14]} />
      <DoodleBox position={[0, 2.45, -6.75]} scale={[16, 4.9, 0.5]} />
      <DoodleBox position={[-5.2, 2.45, 6.75]} scale={[5.6, 4.9, 0.5]} />
      <DoodleBox position={[5.2, 2.45, 6.75]} scale={[5.6, 4.9, 0.5]} />
      <DoodleBox position={[0, 4.18, 6.75]} scale={[4.8, 1.45, 0.5]} color={PALE_BLUE} />

      <DoodleBox
        position={[-4.05, 5.15, 0]}
        scale={[8.25, 0.36, 15.3]}
        color={PAPER}
      />
      <DoodleBox
        position={[4.05, 5.15, 0]}
        scale={[8.25, 0.36, 15.3]}
        color={PAPER}
      />

      <DoodleWindow position={[-7.49, 2.75, -2.7]} rotation={[0, Math.PI / 2, 0]} />
      <DoodleWindow position={[7.49, 2.75, 2.6]} rotation={[0, -Math.PI / 2, 0]} />
      <DoodleWindow position={[-4.2, 2.8, -6.49]} />
      <DoodleWindow position={[4.2, 2.8, -6.49]} />

      <mesh position={[0, 3.25, 6.48]}>
        <planeGeometry args={[3.4, 0.75]} />
        <meshBasicMaterial color={DARK_BLUE} />
        <Edges color={BLUE} threshold={4} />
      </mesh>
      <mesh position={[0, 3.25, 6.5]}>
        <planeGeometry args={[2.75, 0.45]} />
        <meshBasicMaterial color={PAPER} />
      </mesh>

      <DeskCluster position={[-3.4, 0.18, -1.9]} rotation={0.25} />
      <DeskCluster position={[2.8, 0.18, 1.9]} rotation={-0.2} />
      <OfficeChair position={[-3.6, 0.05, 0.1]} />
      <OfficeChair position={[2.8, 0.05, 3.7]} />
      <FilingCabinet position={[4.8, 0.1, -4.2]} />
      <FilingCabinet position={[-5.5, 0.1, 4.1]} />
      <PaperStack position={[2.1, 0.22, -2.4]} />
      <PaperStack position={[-5.2, 0.22, -4.0]} />
      <GiantCoffee position={[5.1, 0.05, 3.7]} />
      <mesh position={[-0.2, 2.8, -6.46]}>
        <planeGeometry args={[3.5, 1.55]} />
        <meshBasicMaterial color={PALE_BLUE} />
        <Edges color={BLUE} threshold={4} />
      </mesh>
      <mesh position={[-0.2, 2.8, -6.43]}>
        <planeGeometry args={[2.85, 0.95]} />
        <meshBasicMaterial color={PAPER} />
      </mesh>

      <mesh position={[0, 4.72, 0]}>
        <boxGeometry args={[0.85, 0.12, 0.85]} />
        <meshBasicMaterial color={ORANGE} />
      </mesh>
      <pointLight position={[0, 4.55, 0]} color="#ffd9a0" intensity={5.2} distance={9} />
    </group>
  );
}

function OfficeTower() {
  const stairStartX = 13.8;
  const stairEndX = 26.05;
  const stairBaseY = 0.05;
  const stairTopY = 8.56;
  const stairWidth = 4.6;
  const stairSteps = 31;
  const stairRun = stairEndX - stairStartX;
  const stairRise = stairTopY - stairBaseY;
  const stairAngle = Math.atan2(stairRise, stairRun);
  const stairLength = Math.hypot(stairRun, stairRise);

  return (
    <group>
      <group position={[35, 0, -34]}>
        {/* Hollow shell: no giant solid cube blocking the stair approach. */}
        <DoodleBox position={[0, 0.16, 0]} scale={[17.5, 0.32, 17.5]} color={PALE_BLUE} />
        <DoodleBox position={[0, 4.1, -8.5]} scale={[17.5, 8.2, 0.5]} color={PALE_BLUE} />
        <DoodleBox position={[0, 4.1, 8.5]} scale={[17.5, 8.2, 0.5]} color={PALE_BLUE} />
        <DoodleBox position={[8.5, 4.1, 0]} scale={[0.5, 8.2, 17.5]} color={PALE_BLUE} />
        <DoodleBox position={[-8.5, 4.1, -5.65]} scale={[0.5, 8.2, 6.15]} color={PALE_BLUE} />
        <DoodleBox position={[-8.5, 4.1, 5.65]} scale={[0.5, 8.2, 6.15]} color={PALE_BLUE} />

        {/* The roof itself is the stair landing. */}
        <DoodleBox position={[0, 8.38, 0]} scale={[17.9, 0.34, 17.9]} color={PAPER} />

        {[-5.2, 0, 5.2].map((x) => (
          <DoodleWindow key={x} position={[x, 3.1, 8.76]} scale={[3.0, 1.65]} />
        ))}
        {[-4.8, 4.8].map((z) => (
          <DoodleWindow
            key={z}
            position={[8.76, 3.05, z]}
            rotation={[0, -Math.PI / 2, 0]}
            scale={[2.7, 1.55]}
          />
        ))}

        <DoodleBox position={[0, 9.0, -8.55]} scale={[12.2, 1.3, 0.45]} color={PAPER} />
        <DoodleBox position={[-5.7, 9.0, 8.55]} scale={[6.1, 1.3, 0.45]} color={PAPER} />
        <DoodleBox position={[5.7, 9.0, 8.55]} scale={[6.1, 1.3, 0.45]} color={PAPER} />
        <DoodleBox position={[8.55, 9.0, -5.9]} scale={[0.45, 1.3, 5.0]} color={PAPER} />
        <DoodleBox position={[8.55, 9.0, 5.9]} scale={[0.45, 1.3, 5.0]} color={PAPER} />

        <DoodleBox position={[0, 9.45, -5.7]} scale={[6.7, 2.0, 3.7]} color={PAPER} />
        <DoodleWindow position={[0, 9.45, -3.82]} scale={[3.0, 0.9]} />

        <DoodleBox position={[-4.9, 0.65, 1.9]} scale={[4.4, 0.16, 1.6]} color={PAPER} />
        <DoodleBox position={[2.6, 0.65, -1.6]} scale={[4.1, 0.16, 1.6]} color={PAPER} />
        <FilingCabinet position={[5.6, 0.1, 5.2]} />
        <PaperStack position={[-3.0, 0.22, -3.5]} />
      </group>

      {/* Smooth physical ramp + thin visual treads. No jumping on risers. */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider
          args={[stairLength / 2, 0.16, stairWidth / 2]}
          position={[
            (stairStartX + stairEndX) / 2,
            (stairBaseY + stairTopY) / 2 - 0.03,
            -34,
          ]}
          rotation={[0, 0, stairAngle]}
        />

        {Array.from({ length: stairSteps }, (_, index) => {
          const t = index / (stairSteps - 1);
          const x = THREE.MathUtils.lerp(stairStartX, stairEndX, t);
          const y = THREE.MathUtils.lerp(stairBaseY, stairTopY, t);

          return (
            <mesh
              key={index}
              position={[x, y - 0.055, -34]}
              castShadow
              receiveShadow
              userData={{ destructibleId: `stair-${index}` }}
            >
              <boxGeometry args={[0.46, 0.11, stairWidth]} />
              <meshStandardMaterial
                color={index % 2 ? PAPER : PALE_BLUE}
                roughness={1}
              />
              <Edges color={BLUE} threshold={8} />
            </mesh>
          );
        })}
      </RigidBody>

      <group position={[44.35, 0, -34]}>
        <mesh position={[0, 4.8, -0.76]}>
          <boxGeometry args={[0.12, 9.6, 0.12]} />
          <meshBasicMaterial color={BLUE} />
        </mesh>
        <mesh position={[0, 4.8, 0.76]}>
          <boxGeometry args={[0.12, 9.6, 0.12]} />
          <meshBasicMaterial color={BLUE} />
        </mesh>
        {Array.from({ length: 19 }, (_, index) => (
          <mesh key={index} position={[0, 0.52 + index * 0.49, 0]}>
            <boxGeometry args={[0.12, 0.08, 1.55]} />
            <meshBasicMaterial color={index % 4 === 0 ? ORANGE : BLUE} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function GreenTree({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <RigidBody type="fixed" colliders="hull">
        <mesh position={[0, 1.55, 0]} castShadow>
          <cylinderGeometry args={[0.42, 0.58, 3.1, 8]} />
          <meshStandardMaterial color={BARK} roughness={1} />
          <Edges color={BLUE} threshold={8} />
        </mesh>
      </RigidBody>
      {[
        [-0.75, 3.3, 0.1, 1.25],
        [0.7, 3.55, -0.2, 1.35],
        [0.05, 4.25, 0.15, 1.5],
      ].map(([x, y, z, radius], index) => (
        <mesh key={index} position={[x, y, z]} castShadow>
          <icosahedronGeometry args={[radius, 1]} />
          <meshStandardMaterial color={index % 2 ? GREEN_LIGHT : GREEN} roughness={1} />
          <Edges color={BLUE} threshold={10} />
        </mesh>
      ))}
    </group>
  );
}

function ClimbableBigTree() {
  return (
    <group position={[-32, 0, 35]}>
      <RigidBody type="fixed" colliders="hull">
        <mesh position={[0, 3.1, 0]} castShadow>
          <cylinderGeometry args={[1.25, 1.65, 6.2, 10]} />
          <meshStandardMaterial color={BARK} roughness={1} />
          <Edges color={BLUE} threshold={8} />
        </mesh>
      </RigidBody>

      {[
        [-1.9, 5.5, 0.2, 2.2],
        [1.8, 5.7, 0.3, 2.3],
        [0.1, 7.25, -0.4, 2.65],
        [-0.5, 8.2, 1.1, 1.9],
      ].map(([x, y, z, radius], index) => (
        <mesh key={index} position={[x, y, z]} castShadow>
          <icosahedronGeometry args={[radius, 1]} />
          <meshStandardMaterial color={index % 2 ? GREEN_LIGHT : GREEN} roughness={1} />
          <Edges color={BLUE} threshold={10} />
        </mesh>
      ))}

      <DoodleBox position={[0.1, 6.45, 0]} scale={[5.2, 0.32, 4.6]} color={PAPER} />
      <DoodleBox position={[0.1, 6.95, -2.0]} scale={[5.2, 0.9, 0.18]} color={PALE_BLUE} />

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
            <meshBasicMaterial color={index % 4 === 0 ? ORANGE : BLUE} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function DreamDome() {
  return (
    <group position={[0, -5.5, 0]}>
      <mesh>
        <sphereGeometry args={[76, 28, 13, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial
          color={BLUE}
          wireframe
          transparent
          opacity={0.12}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export function Arena() {
  const size = ARENA_HALF_SIZE * 2;

  return (
    <>
      <color attach="background" args={[PAPER]} />
      <fog attach="fog" args={[PAPER, 82, 155]} />
      <hemisphereLight intensity={1.7} color="#ffffff" groundColor="#dce2f4" />
      <directionalLight
        castShadow
        position={[18, 27, 12]}
        intensity={1.8}
        color="#ffffff"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-58}
        shadow-camera-right={58}
        shadow-camera-top={58}
        shadow-camera-bottom={-58}
      />

      <DreamDome />

      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[ARENA_HALF_SIZE, 0.2, ARENA_HALF_SIZE]} position={[0, -0.2, 0]} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[size, size, 38, 38]} />
          <meshStandardMaterial color={PAPER} roughness={1} />
        </mesh>
        <gridHelper args={[size, 52, BLUE, "#9daee9"]} position={[0, 0.012, 0]} />
      </RigidBody>

      <DoodleBox position={[0, 3, -ARENA_HALF_SIZE]} scale={[size, 6, 0.7]} />
      <DoodleBox position={[0, 3, ARENA_HALF_SIZE]} scale={[size, 6, 0.7]} />
      <DoodleBox position={[-ARENA_HALF_SIZE, 3, 0]} scale={[0.7, 6, size]} />
      <DoodleBox position={[ARENA_HALF_SIZE, 3, 0]} scale={[0.7, 6, size]} />

      {ARENA_OBSTACLES.map((obstacle, index) => (
        <DoodleBox
          key={index}
          position={[obstacle.x, obstacle.h / 2, obstacle.z]}
          scale={[obstacle.w, obstacle.h, obstacle.d]}
          color={obstacle.color === "blue" ? PALE_BLUE : PAPER}
        />
      ))}

      <EnterableHouse />
      <OfficeTower />
      <ClimbableBigTree />
      <ReactiveFoliage />

      <FilingCabinet position={[-34, 0, 13]} />
      <FilingCabinet position={[32, 0, -18]} />
      <FilingCabinet position={[18, 0, 31]} />
      <FilingCabinet position={[-47, 0, 39]} />
      <FilingCabinet position={[44, 0, 37]} />
      <GiantCoffee position={[3, 0, -34]} />
      <GiantCoffee position={[-47, 0, -10]} />

      <DeskCluster position={[-4, 0, 12]} rotation={0.12} />
      <DeskCluster position={[10, 0, 4]} rotation={-0.3} />
      <DeskCluster position={[-24, 0, -22]} rotation={0.46} />
      <DeskCluster position={[25, 0, -12]} rotation={-0.4} />
      <DeskCluster position={[41, 0, 21]} rotation={0.3} />
      <DeskCluster position={[-44, 0, 17]} rotation={-0.2} />

      <PaperStack position={[-8, 0.08, 7]} />
      <PaperStack position={[19, 0.08, 21]} />
      <PaperStack position={[-26, 0.08, 29]} />
      <PaperStack position={[40, 0.08, 45]} />
      <PaperStack position={[-45, 0.08, 45]} />

      {[
        [-33, 24, 0.9],
        [31, 40, 0.84],
        [-47, -18, 0.58],
        [46, -12, 0.56],
        [-19, 45, 0.62],
        [3, 31, 0.5],
        [-12, 20, 0.52],
      ].map(([x, z, scale], index) => (
        <GreenTree
          key={index}
          position={[x, 0, z]}
          scale={scale}
        />
      ))}
    </>
  );
}
