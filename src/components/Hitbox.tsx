import type { Ref } from "react";
import type * as THREE from "three";

const debug=typeof window!=="undefined"&&new URLSearchParams(window.location.search).get("debugBalance")==="1";
const colors={head:"#ff527d",body:"#328cff",leg:"#4ddd8e",special:"#f6c54e"};

export function Hitbox({id,part,position,size,ref}:{id:string;part:keyof typeof colors;position:[number,number,number];size:[number,number,number];ref?:Ref<THREE.Mesh>}){
  return <mesh ref={ref} position={position} userData={{targetId:id,targetPart:part==="special"?"body":part}}>
    <boxGeometry args={size}/>
    {debug?<meshBasicMaterial color={colors[part]} wireframe transparent opacity={.8} depthTest={false}/>:<meshBasicMaterial colorWrite={false} depthWrite={false}/>}
  </mesh>;
}
