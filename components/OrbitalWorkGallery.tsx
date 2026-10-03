"use client";

import {useEffect,useLayoutEffect,useRef,useState} from "react";
import type {KeyboardEvent,MouseEvent,PointerEvent as ReactPointerEvent} from "react";
import {gsap} from "gsap";
import {exhibits,type Exhibit} from "./exhibits";
import "./orbital-work-gallery.css";

type GalleryProps={
 animated:boolean;
 paused?:boolean;
 standalone?:boolean;
 onEnterScene?:(id:string)=>void;
};
type GalleryMode="orbit"|"index";
type WorkGroup=Exhibit["group"];
type Pose={position:number;blend:number};
const words:Record<string,string>={devs:"DEVS",unclassified:"ARCHIVE",unknown:"WITHIN",records:"FREQUENCY",research:"UNKNOWN","opening-study":"MOTION"};
const modulo=(value:number,count:number)=>(value%count+count)%count;
const wrappedDistance=(value:number,count:number)=>modulo(value+count/2,count)-count/2;
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const unmodified=(event:MouseEvent<HTMLAnchorElement>)=>event.button===0&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey;

function ProjectArt({item}:{item:Exhibit}){
 if(item.medium==="veil")return <div className="unknown-gallery-art"><img src="/assets/zereca-light.svg" alt="Zereca crest"/><span>WITHIN / IN FORMATION</span></div>;
 if(item.medium==="archive")return <img className="orbital-proof-image orbital-archive-image" src="/assets/archive-study.webp" alt="" loading="lazy"/>;
 if(item.medium==="motion")return <><img className="orbital-room-image" src="/assets/threshold.webp" alt="" loading="lazy"/><div className="orbital-motion-proof"><img src="/assets/opening-preview.jpg" alt="" loading="lazy"/><span>SCROLL PROTOTYPE / RECORDED STUDY</span></div></>;
 if(item.medium==="identity")return <><img className="orbital-room-image" src="/assets/devs.webp" alt="" loading="lazy"/><div className="orbital-engine-identity"><img src="/assets/zereca-light.svg" alt=""/><span>ZERECA</span><p>Engine.</p><small>ANDROID / IN DEVELOPMENT</small></div></>;
 if(item.medium==="sound")return <><img className="orbital-room-image" src="/assets/work-vault.webp" alt="" loading="lazy"/><div className="orbital-signal" aria-hidden="true">{Array.from({length:17},(_,index)=><i key={index} style={{height:`${26+Math.sin(index/16*Math.PI)*58}%`}}/>)}<span>AN EMERGING FREQUENCY</span></div></>;
 return <><img className="orbital-room-image" src="/assets/devs.webp" alt="" loading="lazy"/><div className="orbital-research-object" aria-hidden="true"><i/><i/><i/><i/><span>OPEN<br/><em>QUESTION.</em></span><small>FIELD NOTES / ZERECA RESEARCH</small></div></>;
}

export default function OrbitalWorkGallery({animated,paused=false,standalone=false,onEnterScene}:GalleryProps){
 const [group,setGroup]=useState<WorkGroup>("ongoing"),[active,setActive]=useState(0),[mode,setMode]=useState<GalleryMode>("orbit");
 const host=useRef<HTMLElement>(null),visual=useRef<HTMLDivElement>(null),copy=useRef<HTMLDivElement>(null);
 const cards=useRef<Record<string,HTMLButtonElement|null>>({}),pose=useRef<Pose>({position:0,blend:0});
 const tween=useRef<gsap.core.Tween|null>(null),copyTween=useRef<gsap.core.Tween|null>(null),draw=useRef<(()=>void)|null>(null);
 const latest=useRef({group,active,mode,animated,paused,standalone});
 const drag=useRef<{pointer:number;start:number;startY:number;position:number;distance:number;moving:boolean}|null>(null);
 const suppressClick=useRef(false),clickTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const visibleItems=exhibits.filter(item=>item.group===group),selected=visibleItems[active]||visibleItems[0];
 const Heading=standalone?"h1":"h2";

 useLayoutEffect(()=>{latest.current={group,active,mode,animated,paused,standalone};},[group,active,mode,animated,paused,standalone]);
 function resetCopy(){copyTween.current?.kill();if(copy.current)gsap.set(copy.current,{clearProps:"opacity,transform"});}
 function remember(item:Exhibit){if(latest.current.standalone)history.replaceState(history.state,"",`#${item.id}`);}
 function select(index:number,writeHash=true){
  const items=exhibits.filter(item=>item.group===latest.current.group),next=modulo(index,items.length);
  latest.current.active=next;setActive(next);
  if(writeHash)remember(items[next]);
  tween.current?.kill();
  const normalized=modulo(pose.current.position,items.length);
  const target=items.length===2?next:pose.current.position+wrappedDistance(next-normalized,items.length);
  const blend=latest.current.mode==="index"?1:0;
  if(latest.current.animated&&!latest.current.paused&&!document.hidden){
   tween.current=gsap.to(pose.current,{position:target,blend,duration:.85,ease:"power3.out",overwrite:true,onUpdate:()=>draw.current?.(),onComplete:()=>{pose.current.position=next;pose.current.blend=blend;draw.current?.();}});
   if(copy.current){copyTween.current?.kill();copyTween.current=gsap.fromTo(copy.current,{opacity:.5,y:8},{opacity:1,y:0,duration:.45,ease:"power2.out",clearProps:"opacity,transform"});}
  }else{pose.current.position=next;pose.current.blend=blend;draw.current?.();}
 }
 function chooseGroup(next:WorkGroup){
  if(next===latest.current.group)return;
  tween.current?.kill();resetCopy();pose.current.position=0;latest.current.group=next;latest.current.active=0;
  setGroup(next);setActive(0);
  const first=exhibits.find(item=>item.group===next);if(first)remember(first);
 }
 function chooseMode(next:GalleryMode){
  if(next===latest.current.mode)return;
  latest.current.mode=next;setMode(next);tween.current?.kill();
  const blend=next==="index"?1:0;
  if(latest.current.animated&&!latest.current.paused&&!document.hidden)tween.current=gsap.to(pose.current,{position:latest.current.active,blend,duration:.75,ease:"power3.inOut",overwrite:true,onUpdate:()=>draw.current?.()});
  else{pose.current.position=latest.current.active;pose.current.blend=blend;draw.current?.();}
 }

 useLayoutEffect(()=>{
  const space=visual.current,rootElement=host.current;if(!space||!rootElement)return;
  const root:HTMLElement=rootElement;
  const items=exhibits.filter(item=>item.group===group);
  pose.current.position=latest.current.active;pose.current.blend=latest.current.mode==="index"?1:0;
  let width=space.clientWidth,height=space.clientHeight;
  function render(){
   if(document.hidden||width===0||height===0)return;
   const count=items.length,position=count===2?Math.max(0,Math.min(1,pose.current.position)):modulo(pose.current.position,count),blend=pose.current.blend;
   const phone=width<530,cardWidth=Math.min(phone?230:370,width*(phone?.62:.56));
   const cardHeight=Math.min(height*(phone?.84:.79),phone?340:510);
   const radius=Math.max(cardWidth*1.45,width*.66),angleStep=count===2?46:32;
   const available=width*.98,gap=phone?7:10,expanded=Math.min(available*(count===2?.64:.46),390);
   const narrow=(available-expanded-gap*(count-1))/(count-1);
   const distanceTo=(index:number)=>count===2?index-position:wrappedDistance(index-position,count);
   const weights=items.map((_,index)=>Math.max(0,1-Math.abs(distanceTo(index))));
   const total=weights.reduce((sum,value)=>sum+value,0)||1;
   const widths=weights.map(weight=>narrow+(expanded-narrow)*weight/total);
   const totalWidth=widths.reduce((sum,value)=>sum+value,0)+gap*(count-1);let cursor=-totalWidth/2;
   items.forEach((item,index)=>{
    const card=cards.current[item.id];if(!card)return;
    const distance=distanceTo(index),angle=distance*angleStep,rad=angle*Math.PI/180;
    const orbitX=Math.sin(rad)*radius,orbitZ=(Math.cos(rad)-1)*radius;
    const indexX=cursor+widths[index]/2;cursor+=widths[index]+gap;
    const orbitOpacity=count===2?.78+(.22*(1-Math.min(1,Math.abs(distance)))):Math.max(0,1-Math.pow(Math.abs(distance)/2.58,2)*.77)*Math.min(1,Math.max(0,(2.5-Math.abs(distance))/.25));
    gsap.set(card,{xPercent:-50,yPercent:-50,x:mix(orbitX,indexX,blend),y:mix(Math.abs(distance)*12-8,0,blend),z:mix(orbitZ,0,blend),rotationY:mix(-angle,0,blend),rotationZ:mix(distance*-.4,0,blend),width:mix(cardWidth,widths[index],blend),height:mix(cardHeight,cardHeight*.96,blend),opacity:mix(orbitOpacity,.72+.28*weights[index],blend),zIndex:Math.round(100-Math.abs(distance)*20)});
    card.style.setProperty("--orbital-garment-width",`${Math.min(mix(cardWidth,expanded,blend)*.84,cardHeight*.59)}px`);
    card.style.setProperty("--orbital-selection",String(Math.max(0,1-Math.abs(distance))));
   });
   root.style.setProperty("--orbital-drift",`${(position-latest.current.active)*-12}px`);
   root.dataset.project=items[latest.current.active]?.id||items[0].id;
   root.dataset.position=pose.current.position.toFixed(4);root.dataset.galleryMode=latest.current.mode;root.dataset.galleryReady="true";
  }
  draw.current=render;
  const resize=new ResizeObserver(()=>{width=space.clientWidth;height=space.clientHeight;render();});resize.observe(space);
  let wheelSum=0,lastWheel=0;
  const wheel=(event:WheelEvent)=>{
   if(latest.current.mode!=="orbit"||latest.current.paused||event.ctrlKey||event.metaKey)return;
   const units=event.deltaMode===1?16:event.deltaMode===2?height:1;
   const amount=(Math.abs(event.deltaX)>Math.abs(event.deltaY)?event.deltaX:event.deltaY)*units;if(Math.abs(amount)<1)return;
   event.preventDefault();event.stopPropagation();wheelSum+=amount;
   if(Math.abs(wheelSum)>38&&performance.now()-lastWheel>220){const direction=Math.sign(wheelSum);wheelSum=0;lastWheel=performance.now();select(latest.current.active+direction);}
  };
  const visibility=()=>{if(document.hidden){tween.current?.pause();copyTween.current?.pause();}else if(!latest.current.paused){tween.current?.resume();copyTween.current?.resume();render();}};
  space.addEventListener("wheel",wheel,{passive:false});document.addEventListener("visibilitychange",visibility);render();
  return()=>{resize.disconnect();space.removeEventListener("wheel",wheel);document.removeEventListener("visibilitychange",visibility);tween.current?.kill();resetCopy();draw.current=null;if(clickTimer.current)clearTimeout(clickTimer.current);drag.current=null;};
 // Selection and mode are read from one mutable pose so a rotation does not rerender every frame.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[group,animated]);

 useEffect(()=>{if(paused){tween.current?.pause();copyTween.current?.pause();}else if(!document.hidden){tween.current?.resume();copyTween.current?.resume();}},[paused]);
 useEffect(()=>{
  let frame:number|undefined;
  const bringIntoView=()=>{if(!latest.current.standalone)return;if(frame!==undefined)cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>host.current?.scrollIntoView({block:"start",behavior:"auto"}));};
  const restore=()=>{let id=location.hash.slice(1);try{id=decodeURIComponent(id);}catch{}const item=exhibits.find(candidate=>candidate.id===id);if(!item){if(id==="current-work")bringIntoView();return;}
   const items=exhibits.filter(candidate=>candidate.group===item.group),index=items.findIndex(candidate=>candidate.id===id);
   tween.current?.kill();resetCopy();latest.current.group=item.group;latest.current.active=index;pose.current.position=index;pose.current.blend=latest.current.mode==="index"?1:0;
   setGroup(item.group);setActive(index);draw.current?.();bringIntoView();
  };
  window.addEventListener("hashchange",restore);window.addEventListener("popstate",restore);restore();
  return()=>{window.removeEventListener("hashchange",restore);window.removeEventListener("popstate",restore);if(frame!==undefined)cancelAnimationFrame(frame);};
 },[]);

 function keyboard(event:KeyboardEvent<HTMLElement>){
  if(event.target instanceof HTMLElement&&event.target.closest("input,textarea,select,[contenteditable=true]"))return;
  let next:number|undefined;
  if(event.key==="ArrowRight")next=active+1;else if(event.key==="ArrowLeft")next=active-1;else if(event.key==="Home")next=0;else if(event.key==="End")next=visibleItems.length-1;
  if(next===undefined)return;event.preventDefault();event.stopPropagation();select(next);
  if(mode==="index"&&event.target instanceof HTMLElement&&event.target.closest(".orbital-card"))cards.current[visibleItems[modulo(next,visibleItems.length)].id]?.focus({preventScroll:true});
 }
 function pointerDown(event:ReactPointerEvent<HTMLDivElement>){
  if(mode!=="orbit"||paused||event.button!==0)return;
  drag.current={pointer:event.pointerId,start:event.clientX,startY:event.clientY,position:pose.current.position,distance:0,moving:false};
 }
 function pointerMove(event:ReactPointerEvent<HTMLDivElement>){
  const movement=drag.current;if(!movement||movement.pointer!==event.pointerId)return;
  movement.distance=event.clientX-movement.start;
  if(!movement.moving&&Math.abs(event.clientY-movement.startY)>Math.abs(movement.distance)+8){drag.current=null;return;}
  if(Math.abs(movement.distance)>7&&!movement.moving){movement.moving=true;tween.current?.kill();event.currentTarget.setPointerCapture(event.pointerId);}
  if(!movement.moving)return;
  event.preventDefault();const position=movement.position-movement.distance/(visual.current&&visual.current.clientWidth<530?150:220);
  pose.current.position=visibleItems.length===2?Math.max(-.15,Math.min(1.15,position)):position;draw.current?.();
 }
 function pointerEnd(event:ReactPointerEvent<HTMLDivElement>){
  const movement=drag.current;if(!movement||movement.pointer!==event.pointerId)return;drag.current=null;
  if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
  if(!movement.moving)return;suppressClick.current=true;select(Math.round(pose.current.position));
  if(clickTimer.current)clearTimeout(clickTimer.current);clickTimer.current=setTimeout(()=>{suppressClick.current=false;},0);
 }
 function scene(event:MouseEvent<HTMLAnchorElement>){if(!onEnterScene||!unmodified(event))return;event.preventDefault();onEnterScene(selected.id);}

 return <section ref={host} id={standalone?"current-work":undefined} className={`orbital-gallery ${mode==="index"?"orbital-mode-index":"orbital-mode-orbit"} ${animated?"orbital-animated":"orbital-reduced"} ${standalone?"orbital-standalone":""}`} aria-label="Zereca ongoing work and completed studies" aria-roledescription="carousel" onKeyDown={keyboard} data-group={group}>
  <div className="orbital-toolbar">
   <div className="orbital-collection"><p className="orbital-eyebrow">THE WORK VAULT <span>CURATED / 2026</span></p><div role="group" aria-label="Project collection"><button type="button" aria-pressed={group==="ongoing"} onClick={()=>chooseGroup("ongoing")}>Ongoing <sup>05</sup></button><button type="button" aria-pressed={group==="completed"} onClick={()=>chooseGroup("completed")}>Completed studies <sup>02</sup></button></div></div>
   <div className="orbital-mode-control" role="group" aria-label="Gallery view"><button type="button" aria-pressed={mode==="orbit"} onClick={()=>chooseMode("orbit")}><span className="orbital-orbit-icon" aria-hidden="true"/>Orbit</button><button type="button" aria-pressed={mode==="index"} onClick={()=>chooseMode("index")}><span className="orbital-index-icon" aria-hidden="true"/>Index</button></div>
  </div>
  <div className="orbital-stage">
   <div className="orbital-backword" aria-hidden="true">{words[selected.id]}</div>
   <div ref={copy} className="orbital-copy">
    <p className="orbital-eyebrow">{String(active+1).padStart(2,"0")} <span>{selected.discipline}</span></p>
    <p className="orbital-status"><i aria-hidden="true"/>{selected.status}</p>
    <Heading>{selected.title}</Heading>
    <p className="orbital-summary">{selected.summary}</p>
    <p className="orbital-note">{selected.note}</p>
    <div className="orbital-project-links">
     {selected.group==="ongoing"&&<a className="orbital-primary-link" href={`/#${selected.id}`} onClick={scene}>Enter the room <span aria-hidden="true">↗</span></a>}
     {selected.href&&<a className={selected.group==="completed"?"orbital-primary-link":"orbital-evidence-link"} href={selected.href} target={selected.href.startsWith("https:")?"_blank":undefined} rel={selected.href.startsWith("https:")?"noopener noreferrer":undefined}>{selected.linkLabel}<span aria-hidden="true"> ↗</span></a>}
    </div>
    <p className="orbital-material">{selected.material} <span>{selected.group==="completed"?"STUDY COMPLETE":"WORK IN PROGRESS"}</span></p>
   </div>
   <div ref={visual} className="orbital-visual" aria-label="Project artwork" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd}>
    <div className="orbital-ground" aria-hidden="true"><i/><i/><span/></div>
    <div className="orbital-space">{exhibits.map(item=>{
     const index=visibleItems.findIndex(candidate=>candidate.id===item.id),inGroup=index>=0,isActive=inGroup&&active===index;
     return <button ref={element=>{cards.current[item.id]=element;}} key={item.id} type="button" className={`orbital-card orbital-material-${item.medium} ${isActive?"orbital-card-selected":""}`} style={!inGroup?{display:"none"}:undefined} aria-label={`Select ${item.title}`} aria-hidden={!inGroup?true:undefined} tabIndex={inGroup&&mode==="index"?0:-1} onClick={()=>{if(!suppressClick.current&&inGroup)select(index);}} onFocus={()=>{if(inGroup&&mode==="index"&&active!==index)select(index);}} onPointerEnter={event=>{if(inGroup&&mode==="index"&&event.pointerType==="mouse"&&!drag.current&&active!==index)select(index);}}>
      <div className="orbital-card-art"><ProjectArt item={item}/><div className="orbital-card-grain" aria-hidden="true"/></div>
      <span className="orbital-card-number" aria-hidden="true">{String(index+1).padStart(2,"0")}</span>
      <span className="orbital-card-caption" aria-hidden="true"><span>{item.title}</span><small>{item.material}</small></span>
      <span className="orbital-strip-label" aria-hidden="true">{item.title}</span>
     </button>;
    })}</div>
    <div className="orbital-visual-meta" aria-hidden="true"><span>ZRC / {group==="ongoing"?"WORK IN PROGRESS":"COMPLETED STUDIES"}</span><span>FIELD {String(active+1).padStart(2,"0")}</span></div>
   </div>
  </div>
  <div className="orbital-footer">
   <nav className="orbital-project-index" aria-label="Select a project">{visibleItems.map((item,index)=><a key={item.id} href={standalone?`#${item.id}`:`/work#${item.id}`} aria-current={active===index?"true":undefined} onClick={event=>{if(!unmodified(event))return;event.preventDefault();select(index);}}><span>{String(index+1).padStart(2,"0")}</span><span>{item.title}</span></a>)}</nav>
   <div className="orbital-navigation"><p>{mode==="orbit"?"DRAG TO EXPLORE":"SELECT A FIELD"}<span>{String(active+1).padStart(2,"0")} <i>/</i> {String(visibleItems.length).padStart(2,"0")}</span></p><div><button type="button" aria-label="Previous project" onClick={()=>select(active-1)}><span aria-hidden="true">←</span></button><button type="button" aria-label="Next project" onClick={()=>select(active+1)}><span aria-hidden="true">→</span></button></div></div>
  </div>
  <p className="orbital-announcement" aria-live="polite" aria-atomic="true">{selected.title}. {active+1} of {visibleItems.length} {group==="ongoing"?"ongoing projects":"completed studies"}. {selected.status}.</p>
 </section>;
}
