import {
 AmbientLight, BoxGeometry, CanvasTexture, CatmullRomCurve3,
 DirectionalLight, DoubleSide, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial,
 PerspectiveCamera, PlaneGeometry, Scene, SRGBColorSpace, Texture, TextureLoader,
 Vector3, WebGLRenderer,
} from "three";
import {filmChapters,chapterAt,chapterProgress,chapterIndices,lastChapterIndex} from "./cinema-chapters";
import {fitRoomLettering,warmCinemaTypography} from "./cinema-typography";

const ROOM=2400;
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const smooth=(v:number)=>{const x=clamp(v);return x*x*(3-2*x);};
const rows=[[144,320],[377,574],[630,825],[879,1079],[1129,1338]];
const roomSources=filmChapters.map(chapter=>chapter.room);

/** Real perspective camera, geometry, and image planes. Every pose is a pure
 * function of scroll, including the 36-frame exploded software concept. */
export async function createCinemaScene(host:HTMLElement,signal?:AbortSignal){
 const aborted=()=>new DOMException("Cinematic scene preparation cancelled","AbortError");
 if(signal?.aborted||!host.isConnected)throw aborted();
 try{return await createWebglScene(host,signal);}catch(error){
  if(signal?.aborted||!host.isConnected||error instanceof DOMException&&error.name==="AbortError")throw error;
  // Keep the camera journey available when GPU setup or a texture fails.
  host.dataset.webglFallback=error instanceof Error?error.message:String(error);
  const {createCinemaDomScene}=await import("./cinema-dom-scene");
  if(signal?.aborted||!host.isConnected)throw aborted();
  return createCinemaDomScene(host,signal);
 }
}
async function createWebglScene(host:HTMLElement,signal?:AbortSignal){
 const aborted=()=>new DOMException("Cinematic scene preparation cancelled","AbortError");
 if(signal?.aborted||!host.isConnected)throw aborted();
 const canvas=document.createElement("canvas");
 const context=canvas.getContext("webgl2");
 if(!context)throw new Error("WebGL is unavailable");
 const renderer=new WebGLRenderer({canvas,context,antialias:true,alpha:false,powerPreference:"high-performance"});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));
 renderer.outputColorSpace=SRGBColorSpace;
 renderer.setClearColor(0x0b0b0d);
 renderer.domElement.className="film-renderer";
 renderer.domElement.setAttribute("aria-hidden","true");
 const world=new Scene();
 const camera=new PerspectiveCamera(43,1,1,8500);
 const loader=new TextureLoader();
 const textures:Texture[]=[];
 const materials:(MeshBasicMaterial|MeshStandardMaterial)[]=[];
 const geometries:(PlaneGeometry|BoxGeometry)[]=[];
 let disposed=false;
 let observer:ResizeObserver|undefined;
 let mounted=false,rejectPreparation:(error:Error)=>void=()=>{};
 const cancelled=new Promise<never>((_,reject)=>{rejectPreparation=reject;});
 void cancelled.catch(()=>{});
 const contextLost=(event:Event)=>{event.preventDefault();if(!disposed)host.dispatchEvent(new CustomEvent("cinema-error"));};
 const load=async(path:string)=>{const t=await loader.loadAsync(path);if(disposed||signal?.aborted||!host.isConnected){t.dispose();throw aborted();}t.colorSpace=SRGBColorSpace;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());textures.push(t);return t;};
 const release=()=>{if(disposed)return;disposed=true;signal?.removeEventListener("abort",cancel);observer?.disconnect();renderer.domElement.removeEventListener("webglcontextlost",contextLost);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());world.clear();renderer.dispose();renderer.domElement.remove();if(mounted&&!host.querySelector(".film-renderer"))host.classList.remove("scene-ready");};
 const cancel=()=>{release();rejectPreparation(aborted());};
 signal?.addEventListener("abort",cancel,{once:true});
 try{
 if(signal?.aborted){cancel();throw aborted();}
 const paths=[...new Set(roomSources.map(s=>`/assets/${s}.webp`)),"/assets/archive-chamber.webp","/assets/zereca-light.svg","/assets/zereca-badge.svg","/assets/software-core-atlas.webp","/assets/archive-study.webp"];
 const [loaded]=await Promise.race([Promise.all([Promise.all(paths.map(load)),warmCinemaTypography()]),cancelled]);
 if(disposed||signal?.aborted||!host.isConnected)throw aborted();
 const maps=new Map(paths.map((s,i)=>[s,loaded[i]]));
 const plane=(width:number,height:number,map:Texture|undefined,color=0xffffff,alpha=false)=>{
  const geometry=new PlaneGeometry(width,height);geometries.push(geometry);
  const material=new MeshBasicMaterial({...(map?{map}:{}),color,transparent:alpha,alphaTest:alpha ? .08 : 0,side:DoubleSide,depthWrite:true});materials.push(material);
  return new Mesh(geometry,material);
 };
 const box=(w:number,h:number,d:number,color:number)=>{
  const geometry=new BoxGeometry(w,h,d);geometries.push(geometry);
  const material=new MeshStandardMaterial({color,roughness:.85,metalness:.2});materials.push(material);
  return new Mesh(geometry,material);
 };
 const typeTexture=(word:string,id:typeof filmChapters[number]['id'])=>{
  const canvas=document.createElement("canvas");canvas.width=2048;canvas.height=512;
  const ctx=canvas.getContext("2d")!;
  const lettering=fitRoomLettering(ctx,word,id);
  ctx.textAlign="center";ctx.textBaseline="middle";
  if(lettering.outline){ctx.strokeStyle=lettering.color;ctx.lineWidth=2;ctx.strokeText(word,1024,270);ctx.globalAlpha=.16;}
  ctx.fillStyle=lettering.color;ctx.fillText(word,1024,270);
  const t=new CanvasTexture(canvas);t.colorSpace=SRGBColorSpace;textures.push(t);return t;
 };
 world.add(new AmbientLight(0xb8bed0,1.5));
 const light=new DirectionalLight(0xf0e7d7,3);light.position.set(-350,700,350);world.add(light);
 const rooms:Group[]=[],words:Mesh[]=[],pillars:Mesh[]=[],photos:Mesh[]=[],plinths:Group[]=[];
 for(let i=0;i<filmChapters.length;i++){
  const group=new Group();group.position.x=i*ROOM;world.add(group);rooms.push(group);
  const photo=plane(2550,1435,maps.get(`/assets/${roomSources[i]}.webp`));photo.position.set(0,0,-1280);group.add(photo);photos.push(photo);
  const floor=box(2400,12,1700,0x101013);floor.position.set(0,-710,-360);group.add(floor);
  const ceiling=box(2400,12,1700,0x151518);ceiling.position.set(0,710,-360);group.add(ceiling);
  const word=plane(i===chapterIndices.unclassified?2180:1750,i===chapterIndices.unclassified?545:437,typeTexture(filmChapters[i].word,filmChapters[i].id),0xffffff,true);
  word.material.opacity=i===0?.13:.23;word.position.set(i===0?0:240,160,-770);group.add(word);words.push(word);
  // The physical plinth and divider have their own perspective and light.
  if(i===chapterIndices.devs){
   const base=new Group();group.add(base);plinths.push(base);
   const plinth=box(580,95,230,0x141417);plinth.position.set(0,0,0);base.add(plinth);
   const trim=box(582,2,232,0x777165);trim.position.copy(plinth.position);trim.position.y+=48;base.add(trim);
  }
  if(i<filmChapters.length-1){
   const pillar=box(850,2500,220,0x141416);pillar.position.set(i*ROOM+ROOM/2,0,-210);world.add(pillar);pillars.push(pillar);
   const stone=maps.get("/assets/archive-chamber.webp")!.clone();stone.repeat.set(850/4442.295,1);stone.offset.set(3368.23/4442.295,0);textures.push(stone);pillar.material.map=stone;pillar.material.color.set(0xffffff);
   const seam=box(2,2500,222,i===chapterIndices.devs||i===chapterIndices.unclassified?0x512025:0x57534b);seam.position.copy(pillar.position);seam.position.x-=425;world.add(seam);
  }
 }
 // Canonical mark stays registered to the Threshold wall in the same plane.
 const mark=plane(305,305,maps.get("/assets/zereca-light.svg"),0xe8e0d0,true);
 mark.position.set(-4,214,-1278);mark.material.opacity=.8;rooms[chapterIndices.threshold].add(mark);
 const door=new Group(),hinge=new Group();rooms[chapterIndices.assembly].add(door);door.add(hinge);hinge.position.x=-210;
 const leaf=box(420,830,34,0x1b1b20);leaf.position.x=210;hinge.add(leaf);
 const finalMark=plane(115,115,maps.get("/assets/zereca-light.svg"),0xe8e0d0,true);
 finalMark.position.set(210,145,18);hinge.add(finalMark);
 const handle=box(3,62,5,0xb5aa93);handle.position.set(385,-60,21);hinge.add(handle);
 const back=plane(420,830,undefined,0x322528);back.position.z=-35;door.add(back);
 const frameLeft=box(18,868,55,0x303035),frameRight=box(18,868,55,0x303035),frameTop=box(456,18,55,0x303035);
 frameLeft.position.x=-228;frameRight.position.x=228;frameTop.position.y=434;door.add(frameLeft,frameRight,frameTop);
 let invitation=0;
 const core=new Group();rooms[chapterIndices.devs].add(core);
 const atlas=maps.get("/assets/software-core-atlas.webp")!;
 const layers=rows.map(([start,end],i)=>{
  const t=atlas.clone();t.repeat.set(1,(end-start)/1402);t.offset.set(0,1-end/1402);textures.push(t);
  const layer=plane(700,700*(end-start)/1122,t,0xffffff,true);core.add(layer);
  layer.userData.index=i;return layer;
 });
 const witness=plane(770,433,maps.get("/assets/archive-study.webp"));
 witness.position.set(0,30,-750);witness.rotation.y=-.06;rooms[chapterIndices.unclassified].add(witness);
 // A near stone column crosses the word UNCLASSIFIED independently of the wall.
 const archiveEdge=box(125,2000,130,0x242326);archiveEdge.position.set(740,0,-440);rooms[chapterIndices.unclassified].add(archiveEdge);
 const research=new Group();rooms[chapterIndices.research].add(research);
 const panels=[0,1,2].map(i=>{
  const panel=box(140,260,4,0x333338);panel.position.set((i-1)*138,-20+i*20,-i*70);panel.rotation.y=-.25+i*.1;research.add(panel);return panel;
 });
 // Traverse adjoining chambers along a curved track. The divider crosses
 // the lens naturally; no full-screen opacity fade or photo swap is needed.
 const tracks=filmChapters.slice(0,-1).map((_,i)=>new CatmullRomCurve3([
  new Vector3(i*ROOM+Math.sin(.74*Math.PI)*35,Math.sin(.74*Math.PI)*5,100-.74*40),new Vector3(i*ROOM+460,20,60),
  new Vector3(i*ROOM+ROOM/2,10,105),new Vector3((i+1)*ROOM-430,-12,35),
  new Vector3((i+1)*ROOM,0,100),
 ],false,"centripetal"));
 const target=new Vector3();let progress=0;
 function draw(value:number){
  if(disposed)return;
  progress=clamp(value);const index=chapterAt(progress);const local=chapterProgress(index,progress);
  const passage=index<lastChapterIndex?smooth((local-.74)/.26):0;
  if(passage>0)camera.position.copy(tracks[index].getPoint(passage));
  else camera.position.set(index*ROOM+Math.sin(local*Math.PI)*35,Math.sin(local*Math.PI)*5,100-local*40);
  target.set(camera.position.x+Math.sin(passage*Math.PI)*95,0,camera.position.z-1200);camera.lookAt(target);
  rooms.forEach((r,i)=>{r.visible=i===index||i===index+1;});
  pillars.forEach((p,i)=>{p.visible=i===index;});
  words.forEach((w,i)=>{w.position.y=160+(i===index?local*26:0);});
  const dl=chapterProgress(chapterIndices.devs,progress);
  const frame=Math.round(clamp((dl-.07)/.62)*36);
  const q=frame/36;
  // Closed -> exploded hold -> returned shell; deterministic in both directions.
  const spread=148*smooth(q/.42)*(1-smooth((q-.75)/.25));
  layers.forEach((layer,i)=>{
   layer.position.set(Math.sin(q*Math.PI)*i*13,35-i*9+(2-i)*spread,-i*25+Math.sin(q*Math.PI)*i*10);
   layer.rotation.set(0,Math.sin(q*Math.PI)*(.04+i*.035),Math.sin(q*Math.PI)*(.007*(i-2)));
  });
  panels.forEach((p,i)=>{p.position.z=-i*70+Math.sin(chapterProgress(chapterIndices.research,progress)*Math.PI)*(i-1)*60;});
  mark.material.color.setRGB(.83+Math.sin(chapterProgress(chapterIndices.threshold,progress)*Math.PI)*.17,.81+Math.sin(chapterProgress(chapterIndices.threshold,progress)*Math.PI)*.14,.76);
  hinge.rotation.y=-invitation*.72;
  renderer.render(world,camera);
  host.dataset.progress=progress.toFixed(5);if(host.dataset.chapter!==filmChapters[index].id)host.dataset.chapter=filmChapters[index].id;host.dataset.renderer="webgl";
  host.dataset.camera=camera.position.toArray().map(v=>v.toFixed(2)).join(",");
  host.dataset.disassemblyFrame=String(frame);
  host.dataset.transition=passage>0?"passage":"room";
 }
 function layout(){
  const mobile=camera.aspect<.85;
  const fit=(object:Group|Mesh,width:number,height:number,z:number,widthRatio:number,heightRatio:number)=>{
   const viewH=2*Math.tan(camera.fov*Math.PI/360)*(100-z),viewW=viewH*camera.aspect;
   object.scale.setScalar(Math.min(viewW*widthRatio/width,viewH*heightRatio/height));
   object.position.set(mobile?0:viewW*.24,mobile?viewH*.24:20,z);object.userData.baseY=object.position.y;
  };
  fit(core,700,740,-650,mobile ? .75 : .46,mobile ? .25 : .57);
  fit(witness,770,433,-750,mobile ? .83 : .47,mobile ? .27 : .65);
  fit(research,460,320,-700,mobile ? .7 : .35,mobile ? .23 : .6);
  fit(door,456,868,-750,mobile ? .7 : .33,mobile ? .33 : .83);
  const edgeViewW=2*Math.tan(camera.fov*Math.PI/360)*540*camera.aspect;
  archiveEdge.position.x=edgeViewW*.52;archiveEdge.scale.x=mobile?.4:1;
  const backdropScale=Math.max(1,2*Math.tan(camera.fov*Math.PI/360)*1380*camera.aspect/2450);
  photos.forEach(p=>p.scale.setScalar(backdropScale));mark.scale.setScalar(backdropScale);mark.position.set(-4*backdropScale,214*backdropScale,-1278);
  plinths.forEach((base,i)=>{
   const object=core;base.scale.setScalar(object.scale.x*.75);base.position.set(object.position.x,mobile?-355:-390,-880);
  });
 }
 function resize(){
  if(disposed||!host.isConnected)return;
  const width=host.clientWidth,height=host.clientHeight;
  if(!width||!height)return;
  camera.aspect=width/height;camera.fov=width/height<1.1?55:43;camera.updateProjectionMatrix();
  renderer.setSize(width,height,false);layout();draw(progress);
 }
 // Upload every texture and compile room materials behind the entrance. The
 // first visit to a later chamber then avoids its shader compilation stall.
 textures.forEach(texture=>renderer.initTexture(texture));
 let warmTimer:ReturnType<typeof setTimeout>|undefined;
 try{await Promise.race([renderer.compileAsync(world,camera),cancelled,new Promise<void>(resolve=>{warmTimer=setTimeout(resolve,2000);})]);}
 finally{if(warmTimer)clearTimeout(warmTimer);}
 if(disposed||signal?.aborted||!host.isConnected)throw aborted();
 observer=new ResizeObserver(resize);
 host.appendChild(renderer.domElement);mounted=true;host.classList.add("scene-ready");observer.observe(host);
 renderer.domElement.addEventListener("webglcontextlost",contextLost);
 resize();
 // Submit each chamber once while boot still covers it, including materials
 // outside the initial camera frustum, then restore the entrance pose.
 filmChapters.forEach(chapter=>draw(chapter.start+(chapter.end-chapter.start)*.32));
 draw(0);
 return {draw,resize,setInvitation(value:number){invitation=clamp(value);draw(progress);},dispose:release};
 }catch(error){release();throw error;}
}
