"use client";
/* eslint-disable react-hooks/immutability -- Three's renderer, scene, camera and textures are external mutable engine handles. Effects and useFrame own their updates. */
import {Component,Suspense,useCallback,useEffect,useLayoutEffect,useMemo,useRef,useState,type MutableRefObject,type ReactNode} from 'react';
import {Canvas,useFrame,useLoader,useThree} from '@react-three/fiber';
import {useGLTF} from '@react-three/drei';
import {ACESFilmicToneMapping,BufferGeometry,ExtrudeGeometry,Float32BufferAttribute,Group,Mesh,Object3D,PCFSoftShadowMap,PerspectiveCamera,PMREMGenerator,Shape,SRGBColorSpace,Texture,TextureLoader} from 'three';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {invitationArchitecture,invitationFrontWallPolygon,invitationRoomAssetAvailability,invitationRoomLayout,invitationShell,prepareInvitationProp,type RoomBox} from './invitation-room-layout';
import {createInvitationEnvironment,createInvitationMaterials} from './invitation-room-materials';
import {createInvitationRenderClock,invitationCameraPose,stepInvitationMotion,type InvitationMotion} from './invitation-room-runtime';
import {createInvitationAnchors} from './invitation-room-thread';
import {invitationRoomArt,unwrittenModel} from './invitation-room-config';
import UnwrittenCharacter,{type UnwrittenController} from './UnwrittenCharacter';
import InvitationAtmosphere from './InvitationAtmosphere';
import {UNWRITTEN_MOTION} from './unwritten-rig-driver';

if(typeof window!=='undefined'){
 RectAreaLightUniformsLib.init();
 for(const [name,url] of Object.entries(invitationRoomLayout.assets)){if(name==='book'&&!invitationRoomAssetAvailability.book)continue;useGLTF.preload(url,false,false);}
 if(unwrittenModel.url)useGLTF.preload(unwrittenModel.url,false,false);
}

type Props={motion:MutableRefObject<InvitationMotion>;visible:boolean;paused:boolean;reduced:boolean;onPrepared:(webgl:boolean,reason?:string)=>void};
class RoomBoundary extends Component<{children:ReactNode;onError:(error:Error)=>void},{failed:boolean}>{
 state={failed:false};static getDerivedStateFromError(){return{failed:true};}
 componentDidCatch(error:Error){this.props.onError(error);}render(){return this.state.failed?null:this.props.children;}
}
function Unavailable({onPrepared}:{onPrepared:Props['onPrepared']}){useEffect(()=>{onPrepared(false,'WebGL is unavailable');},[onPrepared]);return null;}
export function resetInvitationRoomAssets(){
 for(const url of Object.values(invitationRoomLayout.assets))useGLTF.clear(url);
 if(unwrittenModel.url)useGLTF.clear(unwrittenModel.url);
 useLoader.clear(TextureLoader,invitationRoomArt.crest);
}

/** A full physical room, prepared during entrance and inactive outside its final chapter. */
export default function InvitationRoom(props:Props){
 const [hidden,setHidden]=useState(false),[failed,setFailed]=useState(false),[supported,setSupported]=useState<boolean|null>(null);
 const preparedCallback=useRef(props.onPrepared);
 useLayoutEffect(()=>{preparedCallback.current=props.onPrepared;},[props.onPrepared]);
 useEffect(()=>{
  const probe=document.createElement('canvas');
  let context:WebGL2RenderingContext|null=null;
  try{context=probe.getContext('webgl2',{failIfMajorPerformanceCaveat:false});}catch{}
  setSupported(Boolean(context));
  context?.getExtension('WEBGL_lose_context')?.loseContext();
  if(!context)preparedCallback.current(false,'WebGL is unavailable');
 },[]);
 useEffect(()=>{const update=()=>setHidden(document.hidden);update();document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update);},[]);
 const fail=useCallback((error:Error)=>{setFailed(true);preparedCallback.current(false,error.message);},[]);
 const playing=props.visible&&!props.paused&&!props.reduced&&!hidden;
 if(failed||supported!==true)return null;
 return <RoomBoundary onError={fail}><Canvas className="unwritten-room-canvas" aria-hidden="true" tabIndex={-1} frameloop={playing?'always':'demand'} dpr={[1,1.5]} shadows camera={{position:[-.72,1.64,4.32],fov:44,near:.075,far:30}} gl={{antialias:true,alpha:false,powerPreference:'high-performance',stencil:false}} fallback={<Unavailable onPrepared={props.onPrepared}/>}
  onCreated={({gl})=>{gl.setClearColor('#08090d');gl.shadowMap.type=PCFSoftShadowMap;gl.toneMapping=ACESFilmicToneMapping;gl.toneMappingExposure=1.18;gl.outputColorSpace=SRGBColorSpace;}}
 >
  <Chamber {...props} hidden={hidden} onFailure={fail}/>
 </Canvas></RoomBoundary>;
}

type RoomMaterials=ReturnType<typeof createInvitationMaterials>;
function Solid({box,materials}:{box:RoomBox;materials:RoomMaterials}){
 return <mesh name={box.name} position={[...box.position]} rotation={box.rotation?[...box.rotation]:undefined} material={materials[box.material]} castShadow={box.shadow!==false&&box.material!=='light'&&box.material!=='crimson'} receiveShadow>
  <boxGeometry args={[...box.size]}/>
 </mesh>;
}

/** Every prop uses its evaluated GLB bounds for scale and its actual back face for attachment. */
function ImportedProp({url,height,position,yaw=0,flat=false}:{url:string;height:number;position:[number,number,number];yaw?:number;flat?:boolean}){
 const model=useGLTF(url,false,false);
 const instance=useMemo(()=>prepareInvitationProp(model.scene,height,flat),[model,height,flat]);
 useEffect(()=>()=>{instance.materials.forEach(m=>m.dispose());},[instance]);
 return <group position={position} rotation={[0,yaw,0]}><primitive object={instance.object} dispose={null}/></group>;
}

function useFiniteEnvironment(){
 const {gl,scene}=useThree();
 useLayoutEffect(()=>{
  const input=createInvitationEnvironment(),generator=new PMREMGenerator(gl),target=generator.fromEquirectangular(input);
  const previous=scene.environment,previousIntensity=scene.environmentIntensity;scene.environment=target.texture;scene.environmentIntensity=.85;
  input.dispose();generator.dispose();
  return()=>{scene.environment=previous;scene.environmentIntensity=previousIntensity;target.dispose();};
 },[gl,scene]);
}

function LightFixtures(){
 const targets=useMemo(()=>invitationRoomLayout.fixtures.map(fixture=>{const target=new Object3D();if(fixture.type==='spot')target.position.set(fixture.target[0],fixture.target[1],fixture.target[2]);return target;}),[]);
 return <group name="Authored_Physical_Fixtures">{invitationRoomLayout.fixtures.map((fixture,i)=>fixture.type==='spot'?
  <group key={fixture.id}>
   <primitive object={targets[i]}/><spotLight name={fixture.id} position={[...fixture.position]} target={targets[i]} intensity={fixture.intensity} color={fixture.color} angle={fixture.angle} penumbra={fixture.penumbra} distance={12} decay={2} castShadow={fixture.shadow} shadow-mapSize={[1024,1024]} shadow-bias={-.00006} shadow-normalBias={.002} shadow-camera-near={.15} shadow-camera-far={12}/>
  </group>:
  <rectAreaLight key={fixture.id} name={fixture.id} position={[...fixture.position]} rotation={[...fixture.rotation]} width={fixture.width} height={fixture.height} intensity={fixture.intensity} color={fixture.color}/>
 )}</group>;
}

function CabinetContents({materials,crest}:{materials:RoomMaterials;crest:Texture}){
 const cabinet=invitationRoomLayout.cabinet;
 return <group name="Cabinet_Real_Shelves_And_Contents" position={[...cabinet.position]} rotation={[0,cabinet.yaw,0]}>
  {cabinet.shelves.tops.map((y,i)=><group key={i}>
   <mesh name={`Cabinet_Shelf_${i}`} position={[0,y-cabinet.shelves.thickness/2,cabinet.shelves.centerZ]} material={materials.dark} castShadow receiveShadow><boxGeometry args={[cabinet.shelves.width,cabinet.shelves.thickness,cabinet.shelfDepth]}/></mesh>
   <mesh name={`Cabinet_Cleat_${i}`} position={[0,y-.026,.0849]} material={materials.bronze} castShadow><boxGeometry args={[.496,.034,.064]}/></mesh>
   {[-1,1].map(side=><group key={side}>
    <mesh name={`Shelf_Corner_Bracket_${i}_${side}`} position={[side*.233,y-.031,.121]} material={materials.bronze} castShadow><boxGeometry args={[.02,.044,.13]}/></mesh>
    <mesh name={`Shelf_Side_Cleat_${i}_${side}`} position={[side*.253,y-.022,.2479]} material={materials.dark} castShadow><boxGeometry args={[.014,.03,.29]}/></mesh>
   </group>)}
   <group name={`Supported_Archive_Bundle_${i}`} position={[i===1?.13:-.09,y-.001,.252]} rotation={[0,i===1?.11:-.05,0]}>
    <mesh material={materials.dark} position={[0,.023,0]} castShadow receiveShadow><boxGeometry args={[.21,.048,.15]}/></mesh>
    <mesh material={materials.bronze} position={[0,.048,.02]} castShadow><boxGeometry args={[.008,.004,.15]}/></mesh>
   </group>
  </group>)}
  <group name="Cabinet_Sealed_Letter" position={[-.145,.863,.332]} rotation={[-Math.PI/2,0,.05]}>
   <mesh castShadow receiveShadow><boxGeometry args={[.15,.082,.008]}/><meshStandardMaterial color="#4c4544" roughness={.84}/></mesh>
   <mesh position={[0,-.006,.0055]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.015,.015,.003,16]}/><meshStandardMaterial color="#76372e" roughness={.72} metalness={.08}/></mesh>
   <mesh position={[0,-.006,.0074]}><planeGeometry args={[.017,.017]}/><meshStandardMaterial map={crest} color="#b69b80" transparent alphaTest={.1} roughness={.6}/></mesh>
  </group>
 </group>;
}

function SupportedLectern({materials}:{materials:RoomMaterials}){
 const lectern=invitationRoomLayout.lectern;
 return <group name="Supported_Archive_Lectern" position={[...lectern.position]}>
  <mesh name="Lectern_Floor_Foot" position={[0,.039,0]} material={materials.stone} castShadow receiveShadow><boxGeometry args={[.56,.08,.48]}/></mesh>
  <mesh name="Lectern_Stem" position={[0,.533,0]} material={materials.dark} castShadow receiveShadow><boxGeometry args={[.075,.95,.09]}/></mesh>
  <mesh name="Lectern_Top_Support" position={[0,1.017,0]} material={materials.bronze} castShadow><boxGeometry args={[.36,.045,.27]}/></mesh>
  <group name="Lectern_Inclined_Surface" position={[0,lectern.top,0]} rotation={[lectern.tilt,0,0]}>
   <mesh name="Lectern_Top_Slab" position={[0,-.0225,0]} material={materials.stone} castShadow receiveShadow><boxGeometry args={[.59,.045,.58]}/></mesh>
   {invitationRoomAssetAvailability.book&&<ImportedProp url={invitationRoomLayout.assets.book} height={lectern.bookLength} position={[0,-.001,0]} flat/>}
  </group>
 </group>;
}

/** Suspend the five models together; the room shell and lighting stay rendered underneath. */
function RoomObjects({materials,character,onReady}:{materials:RoomMaterials;character:MutableRefObject<UnwrittenController|null>;onReady:()=>void}){
 const crest=useLoader(TextureLoader,invitationRoomArt.crest);
 useLayoutEffect(()=>{crest.colorSpace=SRGBColorSpace;crest.needsUpdate=true;},[crest]);
 useEffect(onReady,[onReady]);
 return <>
  <group name="Zereca_Authored_Props">
   {invitationRoomLayout.panels.map((panel,i)=><ImportedProp key={i} url={invitationRoomLayout.assets.panel} height={panel.height} position={[...panel.position]}/>)}
   <ImportedProp url={invitationRoomLayout.assets.doorway} height={invitationRoomLayout.doorway.height} position={[...invitationRoomLayout.doorway.position]}/>
   <ImportedProp url={invitationRoomLayout.assets.cabinet} height={invitationRoomLayout.cabinet.height} position={[...invitationRoomLayout.cabinet.position]} yaw={invitationRoomLayout.cabinet.yaw}/>
   <CabinetContents materials={materials} crest={crest}/>
   <SupportedLectern materials={materials}/>
  </group>
  {unwrittenModel.url&&<UnwrittenCharacter controller={character} crest={crest}/>}
 </>;
}

function Chamber({motion,visible,paused,reduced,hidden,onPrepared,onFailure}:Props&{hidden:boolean;onFailure:(error:Error)=>void}){
 const {gl,scene,camera,invalidate,size,setDpr}=useThree();
 const [assetsReady,setAssetsReady]=useState(false);
 const assetsMounted=useCallback(()=>setAssetsReady(true),[]);
 const materials=useMemo(()=>createInvitationMaterials(),[]),anchors=useMemo(()=>createInvitationAnchors(),[]);
 const character=useRef<UnwrittenController|null>(null),dust=useRef<Group>(null),prepared=useRef(false),nextShadow=useRef(0);
 const latestPrepared=useRef(onPrepared);
 useLayoutEffect(()=>{latestPrepared.current=onPrepared;},[onPrepared]);
 const latestView=useRef({width:size.width,height:size.height,reduced});
 useLayoutEffect(()=>{latestView.current={width:size.width,height:size.height,reduced};},[size.width,size.height,reduced]);
 const compact=size.width<760,portrait=size.height>size.width,animate=visible&&!paused&&!reduced&&!hidden;
 const renderClock=useMemo(()=>createInvitationRenderClock(compact?30:60),[compact]);
 const frontWall=useMemo(()=>{const shape=new Shape();invitationFrontWallPolygon.forEach(([x,y],i)=>{if(i===0)shape.moveTo(x,y);else shape.lineTo(x,y);});shape.closePath();return new ExtrudeGeometry(shape,{depth:.22,bevelEnabled:false,curveSegments:1,steps:1});},[]);
 const dustGeometry=useMemo(()=>{
  const n=compact?invitationRoomLayout.budget.compactDust:invitationRoomLayout.budget.dust,positions=new Float32Array(n*3);
  for(let i=0;i<n;i++){positions[i*3]=Math.sin(i*2.399963)*2.7;positions[i*3+1]=.45+(i*37%89)/89*3.1;positions[i*3+2]=-.5-(i*29%97)/97*4.4;}
  const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(positions,3));return geometry;
 },[compact]);
 useFiniteEnvironment();
 useEffect(()=>{setDpr(Math.min(window.devicePixelRatio||1,compact?1.25:1.5));},[compact,setDpr]);
 useEffect(()=>()=>{materials.dispose();frontWall.dispose();},[materials,frontWall]);
 useEffect(()=>()=>{dustGeometry.dispose();},[dustGeometry]);

 useEffect(()=>{
  if(!assetsReady)return;
  let cancelled=false;
  const lost=(event:Event)=>{event.preventDefault();prepared.current=false;onFailure(new Error('Room graphics context lost'));};
  gl.domElement.addEventListener('webglcontextlost',lost);
  async function prepare(){
   try{
    const textures=new Set<Texture>();scene.traverse(object=>{if(object instanceof Mesh){const items=Array.isArray(object.material)?object.material:[object.material];for(const material of items)for(const value of Object.values(material))if(value instanceof Texture)textures.add(value);}});
    await Promise.all([...textures].map(async texture=>{const image=texture.image as {decode?:()=>Promise<void>}|undefined;if(image?.decode)await image.decode().catch(()=>undefined);gl.initTexture(texture);}));
    if(cancelled)return;
    const view=latestView.current,pose=invitationCameraPose(motion.current,view.height>view.width,view.reduced,view.width/Math.max(1,view.height));
    camera.position.set(pose.position[0],pose.position[1],pose.position[2]);camera.lookAt(pose.target[0],pose.target[1],pose.target[2]);const perspective=camera as PerspectiveCamera;perspective.fov=pose.fov;perspective.updateProjectionMatrix();
    character.current?.update(motion.current.time,0,0,anchors.hand,anchors.letter);
    gl.shadowMap.autoUpdate=false;gl.shadowMap.needsUpdate=true;
    await gl.compileAsync(scene,camera);
    if(cancelled)return;
    gl.render(scene,camera);gl.shadowMap.needsUpdate=true;gl.render(scene,camera);
    if(cancelled)return;
    prepared.current=true;latestPrepared.current(true);invalidate();
   }catch(error){if(!cancelled)onFailure(error instanceof Error?error:new Error(String(error)));}
  }
  void prepare();
  return()=>{cancelled=true;prepared.current=false;gl.domElement.removeEventListener('webglcontextlost',lost);};
 },[assetsReady,gl,scene,camera,invalidate,onFailure,motion,anchors]);

 useEffect(()=>{
  renderClock.reset();nextShadow.current=0;invalidate();
 },[animate,renderClock,invalidate]);

 useFrame((_,elapsed)=>{
  const delta=renderClock.step(performance.now(),elapsed,animate);if(delta===null)return;
  const m=motion.current;stepInvitationMotion(m,delta,animate);
  const pose=invitationCameraPose(m,portrait,reduced,size.width/Math.max(1,size.height));
  camera.position.set(pose.position[0],pose.position[1],pose.position[2]);camera.lookAt(pose.target[0],pose.target[1],pose.target[2]);
  const perspective=camera as PerspectiveCamera;if(perspective.fov!==pose.fov){perspective.fov=pose.fov;perspective.updateProjectionMatrix();}
  const arrival=Math.min(1,m.approach/UNWRITTEN_MOTION.arrivalBlendSeconds),strength=arrival*arrival*(3-2*arrival);
  character.current?.update(m.time,reduced?0:m.focus,reduced?0:strength,anchors.hand,anchors.letter);
  if(dust.current)dust.current.position.y=reduced?0:Math.sin(m.time*.12)*.026;
  if(prepared.current&&animate&&m.time>=nextShadow.current){gl.shadowMap.needsUpdate=true;nextShadow.current=m.time+.1;}
  // This callback owns the draw, independent of the page's scrolling and GSAP clocks.
  try{gl.render(scene,camera);}catch(error){onFailure(error instanceof Error?error:new Error(String(error)));}
 },1);

 return <>
  <color attach="background" args={['#08090d']}/><fogExp2 attach="fog" args={['#141721',.042]}/>
  <ambientLight intensity={.07} color="#b6bdce"/>
  <LightFixtures/>
  <group name="Sealed_Metre_Scale_Architecture">
   {invitationShell.map(box=><Solid key={box.name} box={box} materials={materials}/>)}
   <mesh name="Front_Wall_Subtracted_Aperture" position={[0,0,3]} geometry={frontWall} material={materials.stone} castShadow receiveShadow/>
   {invitationArchitecture.map(box=><Solid key={box.name} box={box} materials={materials}/>)}
  </group>
  <Suspense fallback={null}><RoomObjects materials={materials} character={character} onReady={assetsMounted}/></Suspense>
  <InvitationAtmosphere motion={motion} reduced={reduced} compact={compact}/>
  {!reduced&&<group ref={dust} name="Restrained_Depth_Motes"><points geometry={dustGeometry}><pointsMaterial color="#b59c99" size={.006} sizeAttenuation transparent opacity={.20} depthWrite={false}/></points></group>}
 </>;
}
