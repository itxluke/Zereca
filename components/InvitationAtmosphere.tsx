"use client";
/* eslint-disable react-hooks/immutability -- The frame loop owns Three shader uniforms. */
import {useEffect,useMemo,type MutableRefObject} from 'react';
import {useFrame} from '@react-three/fiber';
import {Color,Group,Mesh,PlaneGeometry,ShaderMaterial,Vector3} from 'three';
import {invitationRoomLayout} from './invitation-room-layout';
import type {InvitationMotion} from './invitation-room-runtime';

const vertex=`
varying vec2 vUv;
varying vec3 vWorld;
void main(){
 vUv=uv;
 vec3 center=(modelMatrix*vec4(0.,0.,0.,1.)).xyz;
 vec3 right=vec3(viewMatrix[0][0],viewMatrix[1][0],viewMatrix[2][0]);
 vec3 up=vec3(viewMatrix[0][1],viewMatrix[1][1],viewMatrix[2][1]);
 vWorld=center+right*position.x*length(modelMatrix[0].xyz)+up*position.y*length(modelMatrix[1].xyz);
 gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);
}`;
const fragment=`
uniform float uTime;
uniform vec3 uKeyPosition;
uniform vec3 uKeyDirection;
uniform vec3 uCool;
uniform vec3 uWarm;
varying vec2 vUv;
varying vec3 vWorld;
float hash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
float noise(vec3 p){
 vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float cloud(vec3 p){return noise(p)*.57+noise(p*2.03+7.1)*.28+noise(p*4.11-3.7)*.15;}
void main(){
 // World coordinates keep the smoke inside the architecture as the camera crosses it.
 vec3 drift=vec3(uTime*.025,uTime*.013,-uTime*.018);
 vec3 p=vWorld*vec3(.66,1.22,.58)+drift;
 float curl=cloud(p*.7-drift*.45);
 float density=smoothstep(.28,.76,cloud(p+vec3(curl*.8,0.,curl*.55)));
 vec2 edge=abs(vUv*2.-1.);
 float feather=(1.-smoothstep(.42,1.,edge.x))*(1.-smoothstep(.35,1.,edge.y));
 vec3 lightRay=vWorld-uKeyPosition;
 float beam=smoothstep(.87,.965,dot(normalize(lightRay),uKeyDirection));
 float pool=beam*exp(-length(lightRay)*.075);
 float ground=exp(-max(0.,vWorld.y)*1.25);
 float alpha=density*feather*(.031+ground*.038+pool*.035);
 if(alpha<.002)discard;
 gl_FragColor=vec4(mix(uCool,uWarm,pool*.8),min(alpha,.085));
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;

/** Depth-tested layers share one geometry/material; no full-screen postprocessing pass. */
export default function InvitationAtmosphere({motion,reduced,compact}:{motion:MutableRefObject<InvitationMotion>;reduced:boolean;compact:boolean}){
 const field=useMemo(()=>{
  const key=invitationRoomLayout.fixtures.find(fixture=>fixture.id==='host-key');
  if(!key||key.type!=='spot')throw new Error('The chamber smoke requires its physical key fixture.');
  const position=new Vector3(...key.position),direction=new Vector3(...key.target).sub(position).normalize();
  const material=new ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,transparent:true,depthWrite:false,depthTest:true,
   uniforms:{uTime:{value:0},uKeyPosition:{value:position},uKeyDirection:{value:direction},uCool:{value:new Color('#697683')},uWarm:{value:new Color('#c3b19a')}}});
  const geometry=new PlaneGeometry(1,1),group=new Group();group.name='Zereca_World_Space_Smoke';
  const layers=[
   [0,1.6,-5.45,6.3,3.25],[-.35,1.3,-4.1,6.1,2.65],[.4,1.15,-2.72,5.3,2.1],[1.1,2.65,-2.35,3.1,1.25],
  ];
  const selected=compact?layers.filter((_,i)=>i===0||i===2):layers;
  for(const [x,y,z,width,height] of selected){const mesh=new Mesh(geometry,material);mesh.position.set(x,y,z);mesh.scale.set(width,height,1);mesh.name='Lit_Smoke_Layer';group.add(mesh);}
  return{group,material,dispose(){geometry.dispose();material.dispose();}};
 },[compact]);
 useEffect(()=>()=>field.dispose(),[field]);
 useFrame(()=>{field.material.uniforms.uTime.value=reduced?0:motion.current.time;});
 return <primitive object={field.group} dispose={null}/>;
}
