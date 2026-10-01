import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { OfficeKind } from "../game/officeEnemies";

export type DoodleKind = OfficeKind | "fly" | "statue" | "dragon";
const ink = "#244783", paper = "#fffcf2", red = "#df5665";
function drawArt(kind: DoodleKind, dead: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = kind === "dragon" ? 1024 : 512;
  canvas.height = kind === "dragon" ? 768 : 512;
  const g = canvas.getContext("2d")!;
  const dragon = kind === "dragon";
  if (dragon) g.scale(2, 1.5);
  g.lineJoin = "round"; g.lineCap = "round"; g.lineWidth = 8; g.strokeStyle = ink;
  const path = (points: number[], fill = paper, closed = true) => {
    g.beginPath(); g.moveTo(points[0],points[1]);
    for(let i=2;i<points.length;i+=2)g.lineTo(points[i],points[i+1]);
    if(closed)g.closePath(); g.fillStyle=fill; g.fill();g.stroke();
  };
  const line = (points:number[], color=ink, width=7) => {g.beginPath();g.moveTo(points[0],points[1]);for(let i=2;i<points.length;i+=2)g.lineTo(points[i],points[i+1]);g.strokeStyle=color;g.lineWidth=width;g.stroke();g.strokeStyle=ink;g.lineWidth=8;};
  const ellipse=(x:number,y:number,rx:number,ry:number,fill=paper)=>{g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=fill;g.fill();g.stroke();};
  const text=(value:string,x:number,y:number,size=18,color=ink)=>{g.fillStyle=color;g.font=`900 ${size}px ui-monospace, monospace`;g.textAlign="center";g.fillText(value,x,y);};
  const face=(x:number,y:number,spread=28)=>{
    if(dead){for(const side of [-1,1]){line([x+side*spread-9,y-9,x+side*spread+9,y+9]);line([x+side*spread+9,y-9,x+side*spread-9,y+9]);}} 
    else {ellipse(x-spread,y,5,7,ink);ellipse(x+spread,y,5,7,ink);line([x-spread-11,y-22,x-spread+8,y-26],red,5);line([x+spread-8,y-26,x+spread+11,y-22],red,5);}
    line([x-17,y+33,x,y+26,x+17,y+33],ink,4);
  };
  const bolt=(x:number,y:number)=>{path([x,y,x+12,y+9,x+5,y+21,x+19,y+29],"#f4ca63",false);};
  if(kind==="sticky"){
    for(let i=0;i<8;i++){const x=120+(i%3)*80+(i%2)*9, y=135+Math.floor(i/3)*80;path([x,y,x+85,y-12,x+94,y+70,x+20,y+82],i%3===0?"#ffe883":"#fff5af");line([x+16,y+24,x+54,y+18],"#daa451",3);}
    path([186,63,323,72,312,178,213,183],"#ffe279");path([310,75,323,72,312,96],"#fff4bb");face(252,120,27);text("URGENT!",252,311,21,red);
    line([154,281,86,337,133,351]);line([350,284,415,327,383,348]);path([187,371,228,379,208,417,173,407]);path([294,375,336,371,353,404,314,420]);
  } else if(kind==="stapler"){
    line([110,342,80,375,112,390,133,372]);
    path([87,210,154,159,360,155,413,212,398,254,319,242,151,258],"#a9b8ca");
    path([92,258,357,253,416,302,370,343,101,344],"#f5f5f0");ellipse(167,254,16,16,"#d4e2ed");
    path([354,215,429,231,456,270,394,285],"#d5dce6");
    for(let i=0;i<5;i++)line([340+i*19,282,350+i*19,299],ink,3);
    for(const x of [155,347]){line([x,343,x-17,394,x+18,398]);line([x-10,361,x+14,375],ink,3);}face(305,209,22);bolt(208,215);
  } else if(kind==="highlighter"){
    for(let i=0;i<3;i++)line([117+i*130,326,89+i*130,375,133+i*130,403],"#d6ef73",11);
    path([190,74,319,79,321,126,188,127],"#e7f37a");
    path([172,151,336,148,351,338,308,381,189,365,160,330],"#eff6a6");
    path([190,363,307,375,283,424,215,418],"#bacb47");
    path([164,152,179,114,325,115,341,149],"#b6ca4a");
    path([172,265,99,287,87,328,162,301]);path([344,268,421,287,430,325,352,299]);face(252,242,39);text("MARK",254,334,22);
  } else if(kind==="shredder"){
    for(const x of [150,359]){ellipse(x,394,33,33,"#6d83a9");ellipse(x,394,12,12,"#e1edfb");}
    path([85,143,414,143,430,370,72,370],"#f7f6ed");path([75,124,427,124,418,185,80,185],"#7188ad");
    path([114,196,395,196,377,235,133,235],"#1d365f");
    for(let i=0;i<7;i++)line([145+i*35,238,152+i*35,267],paper,4);
    for(let i=0;i<5;i++)path([147+i*47,306,172+i*47,309,166+i*47,402,143+i*47,388],"#d9e6f5");
    ellipse(379,107,15,18,red);face(249,109,46);text("JAM!",252,294,20,red);
  } else if(kind==="clipboard"){
    line([91,247,39,318,92,329]);line([424,249,475,314,425,329]);
    line([168,389,149,444,195,447]);line([339,389,362,447,314,445]);
    path([94,82,416,82,426,404,81,402],"#bd976b");path([120,109,391,109,399,374,108,374],"#fffdf1");
    path([201,64,310,64,327,106,185,106],"#9ab0c2");ellipse(256,65,14,13,"#fffdf0");
    for(let i=0;i<4;i++)line([143,286+i*21,367,286+i*21],"#a5bce1",3);
    face(251,180,43);text("APPROVED?",253,359,16,red);
  } else if(kind==="fly"){
    path([186,198,41,103,67,271,174,294],"#d6eafa");path([329,198,470,105,450,280,331,294],"#d6eafa");
    for(let i=0;i<3;i++){line([100+i*19,161,148+i*14,236],"#82a9db",3);line([412-i*19,160,369-i*14,238],"#82a9db",3);}
    path([181,121,323,121,357,353,271,432,159,347],"#fffdf1");path([211,74,300,73,327,124,184,124],"#f0bb9e");
    line([192,370,174,442,210,421]);line([318,370,342,444,304,418]);face(252,203,43);text("AIR MAIL",252,304,22,red);bolt(228,332);
  } else if(kind==="statue"){
    path([83,393,429,393,450,441,60,441],"#b8c7d6");path([120,340,391,340,417,394,93,394],"#dce5eb");
    path([160,137,352,138,370,348,141,346],"#e8e8dc");path([210,47,304,47,326,143,186,143],"#f0ede0");
    path([244,77,294,87,286,111,235,109],red);face(254,189,45);
    line([150,279,358,279],"#87a2c9",4);text("DEADLINE",255,325,25,ink);
    for(let i=0;i<3;i++)line([172+i*66,388,190+i*66,361,198+i*66,388],red,3);
  } else if(kind==="hr"){
    // Wide ink suit, oversized red stamp, and a clipboard under one arm.
    path([96,189,177,142,337,145,426,205,410,424,100,424],"#294977");
    path([175,153,251,216,332,154,319,385,187,384],"#fffdf1");
    path([249,210,219,275,251,372,286,275],red);
    path([158,65,354,70,346,226,164,227],"#fffdf2");path([129,62,376,62,361,89,148,90],"#294977");
    path([50,242,137,210,145,359,65,387],"#faf4e5");text("HR",103,312,26,red);
    path([386,206,469,182,480,348,408,368],"#fff0e6");path([393,174,471,166,479,239,395,247],red);text("STAMP",438,217,16,paper);
    ellipse(386,144,25,17,"#eed2b8");line([386,142,420,126],red,5);
    line([168,398,149,455,188,454]);line([347,396,365,454,325,453]);face(251,149,47);
    for(const x of [205,297]){line([x-18,130,x+17,130],ink,3);line([x-17,139,x+18,139],ink,3);}
    text("REJECTED",254,407,20,red);
  } else if(kind==="auditor"){
    // Tall paper suit with sharp folds, crystal invoices and an open ledger.
    for(const x of [134,369])path([x-20,143,x+2,94,x+25,151],"#a8e1ec");
    path([202,143,304,143,327,432,184,432],"#f4f8f4");
    for(const x of [216,238,262,284])line([x,194,x+4,399],"#80a9c4",2);
    path([223,45,287,49,305,161,203,160],"#fffdf4");
    ellipse(251,118,44,62,"#fffdf5");face(251,112,23);
    for(const x of [226,274])ellipse(x,110,21,20,"#d8f4fa");line([247,110,252,111],ink,4);
    path([91,241,208,224,214,394,91,402],"#a7e1eb");
    for(let i=0;i<5;i++)line([111,271+i*23,185,270+i*23],ink,2);
    text("LEDGER",147,367,16,ink);
    line([324,245,409,176,428,190],"#5772ab",10);path([423,173,455,160,439,209],"#96dded");
    line([214,415,195,462,222,464]);line([288,414,303,465,276,464]);
  } else if(kind==="director"){
    // Broad executive silhouette with folders and curling paper vines.
    for(const side of [-1,1])path([253+side*88,164,253+side*195,100,253+side*193,329,253+side*112,377],"#eee3cf");
    path([100,201,187,153,328,153,414,205,379,411,132,411],"#2d4d75");
    path([175,181,244,221,333,181,307,348,197,347],"#f9f6e9");
    path([174,83,345,86,329,224,181,223],"#fffdf1");face(251,151,42);
    for(let i=0;i<4;i++){path([62+i*31,268+i*24,94+i*31,262+i*24,109+i*31,303+i*24,74+i*31,311+i*24],i%2?"#e6e9d7":"#f4e0b7");}
    path([349,226,469,212,471,374,359,375],"#d4b888");text("AGENDA",412,309,16,ink);
    for(const side of [-1,1]){ellipse(253+side*115,197,20,19,"#c7cbd3");line([253+side*109,323,253+side*126,382,253+side*107,424],"#659259",8);}
    line([180,404,170,457,208,458]);line([329,405,338,457,300,458]);
    text("DIRECTOR",251,402,18,red);
  } else if(dragon){
    path([205,224,24,67,76,323,205,356],"#f1f4ed");path([315,222,488,69,457,325,315,354],"#f1f4ed");
    for(const side of [-1,1])for(let i=0;i<4;i++)line([256+side*65,241,256+side*(116+i*24),125+i*45],"#98accb",4);
    path([201,223,313,222,366,414,247,476,145,401],"#f8f6e9");
    for(let i=0;i<4;i++)path([158+i*31,336,188+i*31,341,203+i*31,394,173+i*31,382],"#e3ebed");
    path([213,218,190,125,222,68,312,85,341,156,302,238],"#fffdf2");
    path([178,138,128,104,178,173],"#dce8ee");path([322,135,377,109,344,178],"#dce8ee");
    path([192,192,255,225,326,190,347,226,257,280,169,226],"#e9d9c4");face(252,156,45);
    for(let i=0;i<4;i++)line([158+i*61,293,181+i*61,276],red,5);
    line([318,376,438,405,455,434,406,446],ink,9);
    text("FINAL NOTICE",257,364,17,ink);
  }
  return canvas;
}

export function EnemyDoodle({kind,dead=false,flash=false,width,height,position=[0,0,0]}:{kind:DoodleKind;dead?:boolean;flash?:boolean;width:number;height:number;position?:[number,number,number]}){
  const texture=useMemo(()=>{const t=new THREE.CanvasTexture(drawArt(kind,dead));t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;},[kind,dead]);
  useEffect(()=>()=>texture.dispose(),[texture]);
  return <mesh position={position} userData={{ignoreProjectile:true}}><planeGeometry args={[width,height]}/><meshBasicMaterial map={texture} transparent alphaTest={.08} color={flash?"#ff8197":"#ffffff"} side={THREE.DoubleSide} depthWrite={false}/></mesh>;
}

const dragonPieces = [
  { name: "leftWing", x: 0, y: 60, w: 185, h: 302, pivot: [185, 257] },
  { name: "rightWing", x: 340, y: 60, w: 172, h: 302, pivot: [340, 257] },
  { name: "head", x: 191, y: 55, w: 132, h: 177, pivot: [256, 225] },
  { name: "tail", x: 370, y: 365, w: 127, h: 107, pivot: [370, 388] },
] as const;

/** The Dragon's illustrated pieces move independently while its hitboxes stay in world space. */
export function DragonDoodle({ dead, flash, phase, move }: { dead: boolean; flash: boolean; phase: React.RefObject<string>; move: React.RefObject<string> }) {
  const parts = useRef<(THREE.Group | null)[]>([]);
  const textures = useMemo(() => {
    const source = drawArt("dragon", dead);
    source.getContext("2d")!.resetTransform();
    const extracted = dragonPieces.map(piece => {
      const canvas = document.createElement("canvas");
      canvas.width = piece.w * 2; canvas.height = Math.ceil(piece.h * 1.5);
      canvas.getContext("2d")!.drawImage(source, piece.x * 2, Math.round(piece.y * 1.5), canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
      const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
      source.getContext("2d")!.clearRect(piece.x * 2, Math.round(piece.y * 1.5), canvas.width, canvas.height);
      return texture;
    });
    const body = new THREE.CanvasTexture(source); body.colorSpace = THREE.SRGBColorSpace;
    return [body, ...extracted];
  }, [dead]);
  useEffect(() => () => textures.forEach(texture => texture.dispose()), [textures]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const striking = phase.current === "attack";
    const warning = phase.current === "warn";
    const dive = move.current === "DEADLINE DIVE";
    const [left, right, head, tail] = parts.current;
    if (left) left.rotation.z = (striking && dive ? -.48 : .10 * Math.sin(t * 2.7));
    if (right) right.rotation.z = (striking && dive ? .48 : -.10 * Math.sin(t * 2.7 + .7));
    if (head) { head.rotation.z = warning ? .12 : striking ? -.16 : .045 * Math.sin(t * 1.35); head.position.y = 3.5 + (.5 - 225 / 512) * 9.2 + (warning ? .08 : 0); }
    if (tail) tail.rotation.z = .15 * Math.sin(t * 2.1 - .9) + (striking && move.current === "RED TAPE RING" ? -.35 : 0);
  });
  const point = (x: number, y: number): [number, number] => [(x / 512 - .5) * 13.5, (.5 - y / 512) * 9.2];
  return <group>
    <mesh position={[0, 3.5, .15]} userData={{ ignoreProjectile: true }}><planeGeometry args={[13.5, 9.2]} /><meshBasicMaterial map={textures[0]} color={flash ? "#ff8197" : "#ffffff"} transparent alphaTest={.08} depthWrite={false} side={THREE.DoubleSide} /></mesh>
    {dragonPieces.map((piece, index) => {
      const [px, py] = point(piece.pivot[0], piece.pivot[1]);
      const [cx, cy] = point(piece.x + piece.w / 2, piece.y + piece.h / 2);
      return <group key={piece.name} ref={node => { parts.current[index] = node; }} position={[px, py + 3.5, .16 + index * .002]}>
        <mesh position={[cx - px, cy - py, 0]} userData={{ ignoreProjectile: true }}><planeGeometry args={[piece.w / 512 * 13.5, piece.h / 512 * 9.2]} /><meshBasicMaterial map={textures[index + 1]} color={flash ? "#ff8197" : "#ffffff"} transparent alphaTest={.08} depthWrite={false} side={THREE.DoubleSide} /></mesh>
      </group>;
    })}
  </group>;
}
