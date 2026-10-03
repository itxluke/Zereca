"use client";
import {useEffect,useRef,useState} from 'react';
import {gsap} from 'gsap';
import {isCircleTrace,TracePoint} from './boot-circle';
import {cinemaArt} from './cinema-art';
import ExperienceSelection from './ExperienceSelection';

type Phase='choose'|'draw'|'boot';
type Props={reduced:boolean;worldReady:boolean;progress:number;failed:boolean;onSelect:(mode:'cinema'|'basic')=>void;onEnter:()=>void};
const smooth=(x:number)=>{const v=Math.max(0,Math.min(1,x));return v*v*(3-2*v);};

export default function BootEntrance({reduced,worldReady,progress,failed,onSelect,onEnter}:Props){
 const [phase,setPhase]=useState<Phase>('choose'),[hint,setHint]=useState('One gesture opens the world.');
 const [gathered,setGathered]=useState(false);
 const root=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null),drawArea=useRef<HTMLCanvasElement>(null);
 const points=useRef<TracePoint[]>([]),drawing=useRef(false),phaseRef=useRef<Phase>('choose');
 const drift=useRef({x:0,y:0,targetX:0,targetY:0});
 const ritual=useRef({value:0}),enterRef=useRef(onEnter);
 useEffect(()=>{enterRef.current=onEnter;phaseRef.current=phase;},[onEnter,phase]);
 useEffect(()=>{
  const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
  root.current?.querySelector<HTMLButtonElement>('.boot-option')?.focus({preventScroll:true});
  return()=>{document.body.style.overflow=overflow;};
 },[]);
 useEffect(()=>{
  if(phase==='choose')root.current?.querySelector<HTMLButtonElement>('.boot-option')?.focus({preventScroll:true});
  if(phase==='draw')drawArea.current?.focus({preventScroll:true});
  if(phase!=='boot')return;
  const tween=gsap.to(ritual.current,{value:.64,duration:reduced?.45:1.8,ease:'none',onComplete:()=>setGathered(true)});
  return()=>{tween.kill();};
 },[phase,reduced]);
 useEffect(()=>{
  if(phase!=='boot'||!gathered||!worldReady)return;
  const tween=gsap.to(ritual.current,{value:1,duration:reduced?.4:.95,ease:'power2.in',onComplete:()=>enterRef.current()});
  return()=>{tween.kill();};
 },[phase,gathered,worldReady,reduced]);
 useEffect(()=>{
  if(phase==='choose')return;
  const screen=canvas.current;if(!screen)return;
  const ctx=screen.getContext('2d');if(!ctx)return;
  let width=1,height=1,frame=0,last=-1,clock:number|undefined,life=0,closed=false,bounds:DOMRect|undefined,boundsPhase:Phase|undefined;
  const particles:{x:number;y:number;seed:number}[]=[];
  let random=913;const rand=()=>{random=(random*1664525+1013904223)>>>0;return random/4294967296;};
  const dust=Array.from({length:260},()=>({x:rand(),y:rand(),z:rand(),phase:rand()*Math.PI*2}));
  const image=new Image();image.src='/assets/zereca-light.svg';
  image.decode().then(()=>{
   if(closed)return;
   const mask=document.createElement('canvas');mask.width=mask.height=180;
   const sample=mask.getContext('2d',{willReadFrequently:true});if(!sample)return;
   sample.drawImage(image,0,0,180,180);const data=sample.getImageData(0,0,180,180).data;
   for(let y=0;y<180;y+=2)for(let x=0;x<180;x+=2)if(data[(y*180+x)*4+3]>64)particles.push({x:x/180-.5,y:y/180-.5,seed:rand()});
  }).catch(()=>{});
  const resize=()=>{width=screen.clientWidth;height=screen.clientHeight;const dpr=Math.min(devicePixelRatio,1.5);screen.width=width*dpr;screen.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);boundsPhase=undefined;};
  const observer=new ResizeObserver(resize);observer.observe(screen);resize();
  const render=(now:number)=>{
   if(closed)return;frame=requestAnimationFrame(render);
   if(document.hidden){clock=undefined;return;}
   const dt=clock===undefined?0:Math.max(0,Math.min(.05,(now-clock)/1000));clock=now;
   if(!reduced)life+=dt;
   const motion=drift.current,amount=1-Math.exp(-dt*8);
   motion.x+=(motion.targetX-motion.x)*amount;motion.y+=(motion.targetY-motion.y)*amount;
   if(root.current){root.current.style.setProperty('--boot-x',`${reduced?0:motion.x}px`);root.current.style.setProperty('--boot-y',`${reduced?0:motion.y}px`);}
   if(now-last<1000/30)return;last=now;
   const time=life,p=ritual.current.value,boot=phaseRef.current==='boot';
   const dissolve=boot?smooth((p-.64)/.36):0;
   ctx.clearRect(0,0,width,height);
   if(boundsPhase!==phaseRef.current){bounds=boot?root.current?.querySelector('.boot-drawing-space')?.getBoundingClientRect():undefined;boundsPhase=phaseRef.current;}
   const cx=bounds?bounds.left+bounds.width/2:width/2,cy=bounds?bounds.top+bounds.height/2:height/2,scale=bounds?bounds.width*.4:Math.min(width*.38,height*.32);
   dust.forEach(d=>{const x=d.x*width+Math.sin(time*.08+d.phase)*16,y=(d.y*height-time*(3+d.z*8)+height*10)%height;
    ctx.fillStyle=`rgba(200,187,162,${(.08+d.z*.2)*(1-dissolve)})`;ctx.fillRect(x,y,1+d.z,1+d.z);
   });
   if(boot){
    const gather=smooth((p-.04)/.36),rush=smooth((p-.65)/.35);
    ctx.strokeStyle=`rgba(199,180,149,${.65*(1-smooth(p/.35))})`;ctx.lineWidth=1;
    for(let ring=0;ring<3;ring++){ctx.beginPath();ctx.arc(cx,cy,scale*(.83+ring*.04)*(1+p*2),time+ring,Math.PI*2+time+ring);ctx.stroke();}
    particles.forEach(d=>{const a=d.seed*Math.PI*2,r=scale*(.75+d.seed*.18),spin=(1-gather)*p*8;
     const px=(Math.cos(a+spin)*r*(1-gather)+d.x*scale*.7*gather)*(1+rush*6),py=(Math.sin(a+spin)*r*(1-gather)+d.y*scale*.7*gather)*(1+rush*6);
     ctx.fillStyle=`rgba(229,216,192,${(.3+d.seed*.7)*(1-rush)})`;ctx.fillRect(cx+px,cy+py,1.3+d.seed,1.3+d.seed);
    });
    if(root.current){root.current.style.setProperty('--boot-reveal',String(smooth((p-.65)/.35)));root.current.style.setProperty('--boot-gather',String(gather*(1-rush)));}
   }
  };
  frame=requestAnimationFrame(render);
  return()=>{closed=true;observer.disconnect();cancelAnimationFrame(frame);};
 },[reduced,phase]);
 function selectCinema(){onSelect('cinema');points.current=[];ritual.current.value=0;setGathered(false);setPhase('draw');setHint('One gesture opens the world.');}
 function beginBoot(){drawing.current=false;setGathered(false);setPhase('boot');setHint('The circle is complete.');}
 function locationOf(event:React.PointerEvent<HTMLCanvasElement>){const rect=event.currentTarget.getBoundingClientRect();return{x:(event.clientX-rect.left)*400/rect.width,y:(event.clientY-rect.top)*400/rect.height};}
 function paintTrace(){const ctx=drawArea.current?.getContext('2d');if(!ctx)return;ctx.clearRect(0,0,800,800);ctx.strokeStyle='#e0c9a5';ctx.lineWidth=2;ctx.lineCap='round';ctx.lineJoin='round';ctx.shadowColor='#c6a778';ctx.shadowBlur=7;ctx.beginPath();points.current.forEach((p,i)=>{if(i===0)ctx.moveTo(p.x*2,p.y*2);else ctx.lineTo(p.x*2,p.y*2);});ctx.stroke();}
 function pointerDown(event:React.PointerEvent<HTMLCanvasElement>){if(phase!=='draw'||event.button!==0)return;event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);drawing.current=true;points.current=[locationOf(event)];setHint('Keep going. Bring the ends together.');paintTrace();}
 function pointerMove(event:React.PointerEvent<HTMLCanvasElement>){if(!drawing.current)return;const p=locationOf(event),last=points.current.at(-1)!;if(Math.hypot(p.x-last.x,p.y-last.y)>1){points.current.push(p);paintTrace();}}
 function pointerUp(event:React.PointerEvent<HTMLCanvasElement>){if(!drawing.current)return;points.current.push(locationOf(event));drawing.current=false;event.currentTarget.releasePointerCapture(event.pointerId);if(isCircleTrace(points.current))beginBoot();else{setHint('Almost. Draw a full circle and join its ends.');}}
 const preparation=<div className="boot-preparation"><div className="boot-preparation-track" role="progressbar" aria-label="Preparing the cinema" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress*100)}><span style={{transform:`scaleX(${progress})`}}/></div><p className="boot-loading-line"><span aria-hidden="true"/>{failed?'BASIC VIEW IS AVAILABLE':worldReady?'THE WORLD IS READY':'PREPARING THE WORLD'}<span className="boot-preparation-count">{String(Math.round(progress*100)).padStart(2,'0')}%</span></p></div>;
 return <div ref={root} className={`boot-entrance boot-${phase}`} role="region" aria-labelledby={phase==='choose'?'experience-selection-title':'boot-title'} data-reduced={reduced} data-lenis-prevent onPointerMove={event=>{if(reduced||event.pointerType==='touch'||phase==='choose')return;const bounds=event.currentTarget.getBoundingClientRect();drift.current.targetX=Math.max(-.5,Math.min(.5,(event.clientX-bounds.left-bounds.width/2)/bounds.width))*10;drift.current.targetY=Math.max(-.5,Math.min(.5,(event.clientY-bounds.top-bounds.height/2)/bounds.height))*7;}} onPointerLeave={()=>{drift.current.targetX=0;drift.current.targetY=0;}}>
  {phase!=='choose'&&<div className="boot-architecture" aria-hidden="true"><img className="boot-living-plate" src={cinemaArt.opening} alt="" fetchPriority="high"/><img className="boot-seam-plate" src={cinemaArt.ritual} alt="" decoding="async"/></div>}
  <canvas ref={canvas} className="boot-atmosphere" aria-hidden="true"/>
  {phase!=='choose'&&<header className="boot-masthead"><span className="brand"><img src="/assets/zereca-light.svg" width="30" height="30" alt=""/>ZERECA</span><span>THE INSTITUTION</span></header>}
  {phase==='choose'?<ExperienceSelection reduced={reduced} ready={worldReady} progress={progress} failed={failed} onCinema={selectCinema} onBasic={()=>{onSelect('basic');enterRef.current();}}/>:<div className="boot-ritual-content">
   <p className="eyebrow">{phase==='draw'?'THE FIRST GESTURE':'THE WORLD IS OPENING'}</p><h1 id="boot-title">{phase==='draw'?<>Draw a <em>circle.</em></>:<>You are <em>within.</em></>}</h1>
   <div className="boot-drawing-space">
    <svg className="boot-guide" viewBox="0 0 400 400" aria-hidden="true"><circle cx="200" cy="200" r="132"/><path d="M200 51v10M200 339v10M51 200h10M339 200h10"/></svg>
    {phase==='draw'&&<canvas ref={drawArea} width="800" height="800" className="boot-drawing" tabIndex={0} role="img" aria-label="Draw a circle here with your mouse or finger. You can also press Enter." onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();beginBoot();}}} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={()=>{drawing.current=false;}}/>}
    <img className="boot-crest" src="/assets/zereca-light.svg" alt="" aria-hidden="true"/>
   </div>
   <p className="boot-ritual-hint" role="status">{phase==='boot'&&failed?'The world could not open. Choose a view to continue.':phase==='boot'&&gathered&&!worldReady?'Preparing the rooms…':hint}</p>
   {phase==='draw'&&<div className="boot-ritual-actions"><button onClick={()=>setPhase('choose')}>Change view</button><button onClick={beginBoot}>Use the circle <span aria-hidden="true">↗</span></button></div>}
   {phase==='boot'&&failed&&<div className="boot-ritual-actions"><button onClick={selectCinema}>Try cinema again</button><button onClick={()=>{onSelect('basic');enterRef.current();}}>Basic view</button></div>}
   {phase==='boot'&&gathered&&!worldReady&&!failed&&<div className="boot-ritual-actions"><button onClick={()=>{onSelect('basic');enterRef.current();}}>Open Basic view</button></div>}
   {phase==='boot'&&preparation}
  </div>}
  {phase!=='choose'&&<footer className="boot-footer"><span>INDEPENDENT DISCIPLINES.</span><span>ONE SHARED INSTINCT.</span></footer>}
 </div>;
}
