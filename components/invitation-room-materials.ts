import {DataTexture,EquirectangularReflectionMapping,LinearFilter,MeshStandardMaterial,RepeatWrapping,RGBAFormat,SRGBColorSpace,UnsignedByteType,type Material} from 'three';

const stoneShader=`
varying vec3 vStonePosition;
float zStoneHash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
float zStoneNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(mix(zStoneHash(i),zStoneHash(i+vec3(1,0,0)),f.x),mix(zStoneHash(i+vec3(0,1,0)),zStoneHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(zStoneHash(i+vec3(0,0,1)),zStoneHash(i+vec3(1,0,1)),f.x),mix(zStoneHash(i+vec3(0,1,1)),zStoneHash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
`;
function marble(color:string,roughness:number,metalness:number,bump:DataTexture){
 const m=new MeshStandardMaterial({color,roughness,metalness,bumpMap:bump,bumpScale:.0018});
 m.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec3 vStonePosition;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvStonePosition=(modelMatrix*vec4(transformed,1.)).xyz;');
  shader.fragmentShader=stoneShader+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
vec3 sp=vStonePosition;
float warp=zStoneNoise(sp*1.8)*2.9+zStoneNoise(sp*5.1)*.35;
float vein=pow(1.-abs(sin(sp.x*2.65+sp.y*.67+sp.z*1.73+warp)),23.);
float fine=zStoneNoise(sp*48.);
diffuseColor.rgb*=.82+fine*.22;
diffuseColor.rgb+=vec3(.028,.026,.029)*vein;
`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor+zStoneNoise(vStonePosition*7.)*.035,.12,1.);');
 };
 m.customProgramCacheKey=()=> 'zereca-physical-stone-v2';return m;
}
function detailTexture(){
 const n=128,data=new Uint8Array(n*n*4);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const random=Math.sin(x*127.1+y*311.7)*43758.5453;
  const g=128+(random-Math.floor(random)-.5)*23+Math.sin(y*.74+Math.sin(x*.15)) *5;
  const i=(y*n+x)*4;data[i]=data[i+1]=data[i+2]=g;data[i+3]=255;
 }
 const tex=new DataTexture(data,n,n,RGBAFormat,UnsignedByteType);tex.wrapS=tex.wrapT=RepeatWrapping;tex.repeat.set(9,9);tex.minFilter=LinearFilter;tex.needsUpdate=true;return tex;
}
/** A small, finite, locally generated reflection map; no network HDR or live reflection pass. */
export function createInvitationEnvironment(){
 const width=128,height=64,data=new Uint8Array(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const u=x/width,v=y/height;
  const key=Math.exp(-(((u-.22)/.105)**2+((v-.27)/.17)**2))*180;
  const ceiling=Math.exp(-(((u-.53)/.24)**2+((v-.16)/.10)**2))*72;
  const rim=Math.exp(-(((u-.72)/.012)**2+((v-.42)/.23)**2))*155;
  const i=(y*width+x)*4;
  data[i]=Math.min(255,22+key+ceiling+rim*.77);data[i+1]=Math.min(255,23+key*.95+ceiling*.99+rim*.39);data[i+2]=Math.min(255,27+key*.89+ceiling*1.04+rim*.34);data[i+3]=255;
 }
 const texture=new DataTexture(data,width,height,RGBAFormat,UnsignedByteType);texture.colorSpace=SRGBColorSpace;texture.mapping=EquirectangularReflectionMapping;texture.needsUpdate=true;return texture;
}
export function createInvitationMaterials(){
 const bump=detailTexture();
 const materials={
  stone:marble('#161820',.43,.02,bump),floor:marble('#292c35',.38,.03,bump),
  bronze:new MeshStandardMaterial({color:'#4f443e',metalness:.72,roughness:.48}),
  dark:new MeshStandardMaterial({color:'#101218',metalness:.44,roughness:.56}),
  light:new MeshStandardMaterial({color:'#c7c5c0',emissive:'#c0c6d2',emissiveIntensity:2.6,roughness:.68}),
  crimson:new MeshStandardMaterial({color:'#652729',emissive:'#7a302e',emissiveIntensity:1.4,roughness:.7}),
 };
 return{...materials,dispose(){Object.values(materials).forEach((m:Material)=>m.dispose());bump.dispose();}};
}
