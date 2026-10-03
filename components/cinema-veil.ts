import {AdditiveBlending,BufferAttribute,BufferGeometry,Mesh,PerspectiveCamera,PlaneGeometry,Points,Scene,ShaderMaterial,Vector2,WebGLRenderer} from 'three';
import {chapterIndices,chapterProgress,filmChapters} from './cinema-chapters';

const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const smooth=(x:number)=>{const v=clamp(x);return v*v*(3-2*v);};
type Particle={x:number;y:number;z:number;seed:number};

/** The last chamber is entirely the living field, including the end hold. */
export function veilPhase(progress:number){
 const chapter=filmChapters[chapterIndices.assembly],p=Number.isFinite(progress)?clamp(progress):0;
 const local=chapterProgress(chapterIndices.assembly,p);
 const opacity=smooth((p-(chapter.start-.026))/.026);
 return {visible:opacity>0,opacity,local,gather:smooth(local/.26),release:.12*smooth((local-.68)/.32)};
}

/** The official SVG supplies every particle position; no substitute emblem. */
export async function createCinemaVeil(host:HTMLElement,signal?:AbortSignal){
 const aborted=()=>new DOMException('Cinematic field preparation cancelled','AbortError');
 if(signal?.aborted||!host.isConnected)throw aborted();
 const surface=document.createElement('div');surface.className='cinema-veil';surface.setAttribute('aria-hidden','true');
 surface.style.visibility='hidden';surface.style.opacity='0';
 const canvas=document.createElement('canvas');surface.appendChild(canvas);
 const image=new Image(),resources:{dispose:()=>void}[]=[];
 let renderer:WebGLRenderer|undefined,observer:ResizeObserver|undefined,ctx:CanvasRenderingContext2D|null=null;
 let disposed=false,clearWorld=()=>{},rejectPreparation:(error:Error)=>void=()=>{};
 const cancelled=new Promise<never>((_,reject)=>{rejectPreparation=reject;});void cancelled.catch(()=>{});
 const contextLost=(event:Event)=>{event.preventDefault();if(!disposed)host.dispatchEvent(new CustomEvent('cinema-error'));};
 const dispose=()=>{
  if(disposed)return;disposed=true;signal?.removeEventListener('abort',cancel);
  image.removeAttribute('src');canvas.removeEventListener('webglcontextlost',contextLost);observer?.disconnect();
  resources.splice(0).reverse().forEach(resource=>resource.dispose());clearWorld();renderer?.dispose();surface.remove();
 };
 const cancel=()=>{dispose();rejectPreparation(aborted());};signal?.addEventListener('abort',cancel,{once:true});
 try{
  if(signal?.aborted){cancel();throw aborted();}
  host.appendChild(surface);image.src='/assets/zereca-light.svg';
  await Promise.race([image.decode(),cancelled]);
  if(disposed||signal?.aborted||!host.isConnected)throw aborted();
 const mask=document.createElement('canvas');mask.width=mask.height=512;
 const sample=mask.getContext('2d',{willReadFrequently:true})!;sample.drawImage(image,0,0,512,512);
 const pixels=sample.getImageData(0,0,512,512).data,particles:Particle[]=[];
 let random=713;const rand=()=>{random=(random*1664525+1013904223)>>>0;return random/4294967296;};
 for(let y=0;y<512;y+=2)for(let x=0;x<512;x+=2)if(pixels[(y*512+x)*4+3]>50){
  for(let depth=0;depth<3;depth++)particles.push({x:(x/512-.5)*3.6,y:(.5-y/512)*3.6,z:(depth-1)*.035,seed:rand()});
 }
 const geometry=new BufferGeometry();resources.push(geometry);
 const positions=new Float32Array(particles.length*3),seeds=new Float32Array(particles.length);
 particles.forEach((p,i)=>{positions.set([p.x,p.y,p.z],i*3);seeds[i]=p.seed;});
 geometry.setAttribute('position',new BufferAttribute(positions,3));geometry.setAttribute('aSeed',new BufferAttribute(seeds,1));
 const uniforms={uTime:{value:0},uGather:{value:0},uRelease:{value:0},uResolution:{value:new Vector2(1,1)}};
 const material=new ShaderMaterial({uniforms,transparent:true,depthWrite:false,blending:AdditiveBlending,
  vertexShader:`attribute float aSeed;uniform float uTime;uniform float uGather;uniform float uRelease;uniform vec2 uResolution;varying float vLight;
  void main(){float a=aSeed*6.283185;vec3 spread=vec3(cos(a)*(.5+aSeed*3.0),sin(a*2.3)*2.1,sin(a*4.7)*2.0);
   vec3 p=mix(spread,position,uGather);p.xy+=vec2(sin(uTime*.65+a*3.),cos(uTime*.5+a*4.))*.018;
   p+=position*sin(uTime*.55)*.006*uGather;
   p.z+=sin(uTime*.32+a*6.)*.03*uGather;
   p+=vec3(cos(a)*1.3,sin(a*3.)*.8,1.8+aSeed*2.)*uRelease;
   vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
   gl_PointSize=clamp((1.6+aSeed*1.4)*uResolution.y/800.*3./-mv.z,1.,5.);
   vLight=(.48+.52*sin(a*9.+uTime*.7))*(1.-uRelease*.65);}`,
  fragmentShader:`varying float vLight;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;float alpha=(1.-smoothstep(.05,.5,d))*(.5+vLight*.5);gl_FragColor=vec4(mix(vec3(.48,.39,.34),vec3(.91,.87,.78),vLight),alpha);}`
 });
 resources.push(material);
 const backgroundGeometry=new PlaneGeometry(2,2);resources.push(backgroundGeometry);
 const backgroundMaterial=new ShaderMaterial({uniforms,depthWrite:false,depthTest:false,
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
  fragmentShader:`varying vec2 vUv;uniform float uTime;uniform vec2 uResolution;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
  float field(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=noise(p)*a;p=mat2(1.6,-1.2,1.2,1.6)*p;a*=.5;}return v;}
  void main(){vec2 p=(vUv-.5)*vec2(uResolution.x/uResolution.y,1.);float t=uTime*.025;
   float n=field(p*2.+vec2(t,-t));float veil=field(p*4.+n*1.7+vec2(-t,t));
   float crease=pow(1.-abs(sin(p.x*4.+veil*3.2)),12.);float vignette=1.-smoothstep(.2,1.1,length(p));
   vec3 c=vec3(.023,.021,.027)+vec3(.057,.052,.055)*veil*vignette+vec3(.04,.029,.025)*crease*vignette;
   c+=vec3(.065,.01,.013)*exp(-length(p-vec2(.4,-.15))*6.)*.25;
   // A narrow, unfinished seam moves inside the existing folds, never a flash.
   float seamPath=.27+sin(p.y*2.1+t*.3+n*.5)*.012;
   float seam=exp(-abs(p.x-seamPath)*360.)*(.35+.65*n)*vignette;
   c+=vec3(.11,.009,.012)*seam*(.65+.25*sin(uTime*.17));
   c*=.94+.06*sin(uTime*.21);gl_FragColor=vec4(c,1.);}`
 });
 resources.push(backgroundMaterial);
 const world=new Scene();clearWorld=()=>world.clear();
 const camera=new PerspectiveCamera(40,1,.1,50),points=new Points(geometry,material);
 const backdrop=new Mesh(backgroundGeometry,backgroundMaterial);backdrop.renderOrder=-1;backdrop.frustumCulled=false;world.add(backdrop,points);camera.position.z=5;
 const context=canvas.getContext('webgl2');
 if(context){
  renderer=new WebGLRenderer({canvas,context,antialias:false});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));surface.dataset.renderer='webgl';
 }
 else{canvas.remove();const fallback=document.createElement('canvas');surface.appendChild(fallback);ctx=fallback.getContext('2d');surface.dataset.renderer='canvas';}
 let width=1,height=1,lastTime=-1,lastClock:number|undefined,life=0,lastVisible=false,lastOpacity=0;
 const resize=()=>{if(disposed||!host.isConnected)return;width=Math.max(1,host.clientWidth);height=Math.max(1,host.clientHeight);camera.aspect=width/height;camera.updateProjectionMatrix();uniforms.uResolution.value.set(width,height);
  if(renderer)renderer.setSize(width,height,false);else if(ctx){ctx.canvas.width=width;ctx.canvas.height=height;}
 };
 observer=new ResizeObserver(resize);observer.observe(host);resize();
 // The custom noise shader is prepared while the entrance covers the world.
 // A slow shader compiler does not become an unbounded entrance gate.
 if(renderer){
  let warmTimer:ReturnType<typeof setTimeout>|undefined;
  try{await Promise.race([renderer.compileAsync(world,camera),cancelled,new Promise<void>(resolve=>{warmTimer=setTimeout(resolve,2000);})]);if(disposed||signal?.aborted||!host.isConnected)throw aborted();renderer.render(world,camera);}
  finally{if(warmTimer)clearTimeout(warmTimer);}
 }
 if(disposed||signal?.aborted||!host.isConnected)throw aborted();
 canvas.addEventListener('webglcontextlost',contextLost);
 const draw=(progress:number,time=0)=>{
  if(disposed)return;
  const {visible,opacity,local,gather,release}=veilPhase(progress);
  // Bound elapsed time across pause/tab switches so the field never jumps.
  if(lastClock!==undefined)life+=Math.max(0,Math.min(.05,time-lastClock));lastClock=time;
  if(visible!==lastVisible){lastVisible=visible;surface.style.visibility=visible?'visible':'hidden';}
  if(opacity!==lastOpacity){lastOpacity=opacity;surface.style.opacity=String(opacity);}
  if(!visible)return;
  uniforms.uTime.value=life;uniforms.uGather.value=gather;uniforms.uRelease.value=release;
  const mobile=width/height<.85;points.position.set(mobile?0:camera.aspect*.55,mobile?.65:0,0);points.rotation.y=Math.sin(life*.13)*.075+local*.06;
  points.scale.setScalar(mobile?.58:1.15);
  if(renderer){renderer.render(world,camera);return;}
  // A perspective point projection keeps the experience alive without WebGL.
  if(!ctx||life-lastTime<1/30&&lastTime>=0)return;lastTime=life;
  ctx.fillStyle='#08080b';ctx.fillRect(0,0,width,height);
  const haze=ctx.createRadialGradient(width*.64,height*.4,0,width*.64,height*.4,width*.65);
  haze.addColorStop(0,'#2b262942');haze.addColorStop(.65,'#14131a55');haze.addColorStop(1,'#08080b');ctx.fillStyle=haze;ctx.fillRect(0,0,width,height);
  for(let fold=0;fold<4;fold++){
   const x=width*(.25+fold*.17)+Math.sin(life*.08+fold*1.7)*width*.025;
   const fog=ctx.createRadialGradient(x,height*.42,0,x,height*.42,width*.32);
   fog.addColorStop(0,'#53404812');fog.addColorStop(1,'#08080b00');ctx.fillStyle=fog;ctx.fillRect(0,0,width,height);
  }
  const scale=Math.min(width*(mobile?.33:.22),height*.43)*(1+local*.1);
  const cx=width*(mobile?.5:.66),cy=height*(mobile?.32:.47);
  particles.forEach(p=>{const a=p.seed*Math.PI*2;
   const breathe=1+Math.sin(life*.55)*.006;
   const x=p.x*gather*breathe+Math.cos(a)*(.5+p.seed*3)*(1-gather)+Math.sin(life*.65+a*3)*.018+Math.cos(a)*1.3*release;
   const y=p.y*gather*breathe+Math.sin(a*2.3)*2.1*(1-gather)+Math.cos(life*.5+a*4)*.018+Math.sin(a*3)*.8*release;
   const z=p.z*gather+Math.sin(a*4.7)*2*(1-gather)+(1.8+p.seed*2)*release+Math.sin(life*.32+a*6)*.03*gather,perspective=5/(5-z);
   ctx!.fillStyle=`rgba(221,210,194,${(.25+.55*(.5+.5*Math.sin(a*9+life*.7)))*(1-release*.65)})`;
   ctx!.fillRect(cx+x*scale*perspective,cy-y*scale*perspective,1.2+perspective*.5,1.2+perspective*.5);
  });
 };
 return {draw,dispose};
 }catch(error){dispose();throw error;}
}

