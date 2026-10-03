"use client";
import {useEffect,useMemo,useRef,useState,useSyncExternalStore} from "react";
import Link from "next/link";
import {gsap} from "gsap";
import {ScrollTrigger} from "gsap/ScrollTrigger";
import Lenis from "lenis";
import WorkExhibition from "./WorkExhibition";
import UnwrittenInvitation from "./UnwrittenInvitation";
import OrbitalWorkGallery from "./OrbitalWorkGallery";
import {createCinemaMedia} from "./cinema-media";
import {filmChapters,chapterAt,chapterProgress,chapterTarget,resolveChapterId,chapterIndices,lastChapterIndex} from "./cinema-chapters";
import {createCinemaFrameClock} from "./cinema-frame-clock";
import BootEntrance from "./BootEntrance";
import {warmCinemaArt} from "./cinema-art";
import {invitationPhase,invitationTarget} from "./invitation-phase";
import {createInvitationMotion,createInvitationPreparation,resolveCinemaReducedMotion} from "./invitation-room-runtime";
import {zereca} from "./zereca-brand";
import SceneHeading from "./SceneHeading";
import {warmCinemaTypography} from "./cinema-typography";

type Preference="system"|"enabled"|"disabled";
type Director={go:(id:string,immediate?:boolean)=>void;pause:(value:boolean)=>void;invite:(open:boolean)=>void};
gsap.registerPlugin(ScrollTrigger);
const smooth=(value:number)=>{const v=Math.max(0,Math.min(1,value));return v*v*(3-2*v);};
const subscribePreference=(change:()=>void)=>{window.addEventListener("storage",change);window.addEventListener("zereca-motion-change",change);return()=>{window.removeEventListener("storage",change);window.removeEventListener("zereca-motion-change",change);};};
const getPreference=():Preference=>{try{const value=localStorage.getItem("zereca-cinema-mode");if(value==="enabled"||value==="disabled")return value;}catch{}return "system";};
const subscribeReduction=(change:()=>void)=>{const query=matchMedia("(prefers-reduced-motion:reduce)");query.addEventListener("change",change);return()=>query.removeEventListener("change",change);};
const getReduction=()=>matchMedia("(prefers-reduced-motion:reduce)").matches;

export default function Institution(){
 const root=useRef<HTMLElement>(null),journey=useRef<HTMLDivElement>(null),stage=useRef<HTMLDivElement>(null);
 const director=useRef<Director|null>(null),pausedRef=useRef(false),enteredRef=useRef(false);
 const vault=useRef<HTMLDialogElement>(null),vaultReturn=useRef<HTMLElement|null>(null),vaultPause=useRef(false),vaultOverflow=useRef<string|null>(null);
 const [vaultOpen,setVaultOpen]=useState(false);
 const savedPreference=useSyncExternalStore(subscribePreference,getPreference,()=>"system" as Preference);
 const systemReduced=useSyncExternalStore(subscribeReduction,getReduction,()=>true);
 const [choice,setChoice]=useState<Preference|null>("enabled");
 const [entered,setEntered]=useState(false),[worldReady,setWorldReady]=useState(false),[worldProgress,setWorldProgress]=useState(0);
 const [paused,setPaused]=useState(false),[failed,setFailed]=useState(false),[active,setActive]=useState(0),[indexOpen,setIndexOpen]=useState(false),[readable,setReadable]=useState(true);
 const [invitationActive,setInvitationActive]=useState(false);
 const preference=choice??savedPreference;
 const reduced=resolveCinemaReducedMotion(preference,systemReduced);
 const cinematic=!failed&&preference!=="disabled"&&(preference==="enabled"||!reduced);
 const roomMotion=useRef(createInvitationMotion());
 const invitationPreparation=useMemo(()=>createInvitationPreparation(),[cinematic]);
 useEffect(()=>{pausedRef.current=paused;director.current?.pause(paused);},[paused]);
 useEffect(()=>{if(!indexOpen)return;const close=(event:KeyboardEvent)=>{if(event.key==="Escape"){setIndexOpen(false);root.current?.querySelector<HTMLButtonElement>(".film-rooms-toggle")?.focus();}};window.addEventListener("keydown",close);return()=>window.removeEventListener("keydown",close);},[indexOpen]);
 useEffect(()=>{
  if(!cinematic||!stage.current||!journey.current||!root.current)return;
  const surface=stage.current,node=root.current;
  setWorldReady(false);setWorldProgress(0);node.dataset.cinemaReady="false";
  let disposed=false,cleaned=false,bootTimeout:ReturnType<typeof setTimeout>|undefined;
  const resources:{dispose:()=>void}[]=[],runtimeCleanup:(()=>void)[]=[];
  const release=()=>{resources.splice(0).reverse().forEach(resource=>{try{resource.dispose();}catch{/* Release the remaining resources too. */}});};
  // This teardown exists before any promise can finish or initial draw can fail.
  // Both the recovery path and the eventual effect cleanup use it exactly once.
  const cleanup=()=>{
   if(cleaned)return;cleaned=true;disposed=true;
   if(bootTimeout){clearTimeout(bootTimeout);bootTimeout=undefined;}
   runtimeCleanup.splice(0).reverse().forEach(dispose=>{try{dispose();}catch{/* Continue releasing the controller. */}});
   release();
  };
  const fail=(error:unknown)=>{
   if(disposed)return;
   cleanup();node.dataset.cinemaFailure=error instanceof Error?error.message:String(error);setFailed(true);
  };
  roomMotion.current.targetReveal=0;
  const prepared={films:0,rooms:0,veil:0,fonts:0,art:0,invitation:0};
  const report=()=>{if(!disposed)setWorldProgress(prepared.films*.48+prepared.rooms*.18+prepared.veil*.10+prepared.fonts*.04+prepared.art*.12+prepared.invitation*.08);};
  const artwork=new AbortController();resources.push({dispose:()=>artwork.abort()});
  const media=createCinemaMedia(surface,{onProgress:(ready,total)=>{prepared.films=ready/total;report();}});resources.push(media);
  // A stalled network or GPU must not hold the circle indefinitely.
  bootTimeout=setTimeout(()=>fail(new Error("The rooms took too long to prepare")),45000);
  Promise.all([
   import("./cinema-scene").then(async({createCinemaScene})=>{if(disposed)return;const scene=await createCinemaScene(surface,artwork.signal);if(disposed){scene.dispose();return;}resources.push(scene);prepared.rooms=1;report();return scene;}),
   import("./cinema-veil").then(async({createCinemaVeil})=>{if(disposed)return;const veil=await createCinemaVeil(surface,artwork.signal);if(disposed){veil.dispose();return;}resources.push(veil);prepared.veil=1;report();return veil;}),
   media.warm(),
   warmCinemaTypography().then(()=>{prepared.fonts=1;report();}),
   warmCinemaArt(artwork.signal,(ready,total)=>{prepared.art=ready/total;report();}),
   invitationPreparation.ready.then(()=>{prepared.invitation=1;report();}),
  ]).then(([scene,veil])=>{
   if(disposed||!scene||!veil)return;
   media.mount();
   delete node.dataset.cinemaFailure;
   const progress={value:0},invitation={value:0};let current=-1,reading:boolean|undefined,invited:boolean|undefined,inviteTween:gsap.core.Tween|undefined;
   const lenis=new Lenis({autoRaf:false,respectReducedMotion:false,smoothWheel:true,syncTouch:false,lerp:.1});
   runtimeCleanup.push(()=>lenis.destroy(),()=>inviteTween?.kill());
   const frameClock=createCinemaFrameClock();
   lenis.on("scroll",ScrollTrigger.update);
   const draw=()=>{
    if(disposed||document.hidden)return;
    const p=Math.max(0,Math.min(1,progress.value)),invite=invitationPhase(p);
    // From the assembly threshold, the opaque field owns the frame completely.
    if(p<filmChapters[lastChapterIndex].start)scene.draw(p);media.draw(p);
    const index=chapterAt(p),local=chapterProgress(index,p);
    roomMotion.current.targetReveal=invite.reveal;node.style.setProperty("--invite-reveal",String(invite.reveal));
    if(invite.active!==invited){invited=invite.active;setInvitationActive(invited);}
    const opacity=(index===0?1:smooth(local/.1))*(index===lastChapterIndex?1:1-smooth((local-.67)/.10));
    node.style.setProperty("--film-copy-opacity",String(opacity));
    node.style.setProperty("--film-progress",String(p));
    node.style.setProperty("--film-copy-shift",`${(1-opacity)*18}px`);
    const records=filmChapters[index].id==="records";
    node.style.setProperty("--film-title-y",`${records?12-local*30:(local-.3)*-44}px`);
    node.style.setProperty("--film-detail-y",`${records?5-local*12:(local-.3)*-18}px`);
    node.style.setProperty("--film-copy-x",`${Math.sin(local*Math.PI)*(records?-5:-10)}px`);
    node.style.setProperty("--film-echo-x",`${18-local*28}px`);
    node.style.setProperty("--film-echo-y",`${-16+local*10}px`);
    if(index!==current){current=index;node.dataset.chapter=filmChapters[index].id;setActive(index);}
    const nextReading=opacity>.08&&!invite.active;if(nextReading!==reading){reading=nextReading;setReadable(reading);}
   };
   // Lenis owns the easing. A second scrub tween makes footage chase the camera.
   const tween=gsap.to(progress,{value:1,ease:"none",onUpdate:draw,scrollTrigger:{trigger:journey.current,start:"top top",end:"bottom bottom",scrub:true,invalidateOnRefresh:true}});
   runtimeCleanup.push(()=>tween.kill());
   const trigger=tween.scrollTrigger!;runtimeCleanup.push(()=>trigger.kill());
   const ticker=(time:number)=>{
    const clock=frameClock.step(time*1000,!document.hidden&&!pausedRef.current&&enteredRef.current);
    if(clock===null||disposed)return;
    lenis.raf(clock);if(roomMotion.current.targetReveal<1)veil.draw(progress.value,clock/1000);
   };
   gsap.ticker.add(ticker);runtimeCleanup.push(()=>gsap.ticker.remove(ticker));gsap.ticker.lagSmoothing(0);
   const pause=(value:boolean)=>{frameClock.reset();media.pause(value);if(value){inviteTween?.pause();lenis.stop();trigger.disable(false,false);}else{inviteTween?.resume();trigger.enable(false,false);lenis.start();}};
   const go=(id:string,immediate=false)=>{
    if(disposed)return;
    if(pausedRef.current){pausedRef.current=false;setPaused(false);pause(false);}
    const p=id==="threshold"?0:id==="invitation"?invitationTarget():chapterTarget(id);
    lenis.scrollTo(trigger.start+(trigger.end-trigger.start)*p,{duration:2.2,immediate,onComplete:draw});
   };
   const restore=()=>{if(vault.current?.open)return;const id=resolveChapterId(location.hash.slice(1));if(id&&(id==="invitation"||filmChapters.some(c=>c.id===id)))go(id,true);};
   const refresh=()=>{frameClock.reset();if(!disposed&&!document.hidden){scene.resize();ScrollTrigger.refresh();draw();}};
   const error=()=>fail(new Error("The cinematic graphics context closed"));
   const controller:Director={go,pause,invite:(open)=>{if(disposed||pausedRef.current)return;inviteTween?.kill();inviteTween=gsap.to(invitation,{value:open?1:0,duration:.8,ease:"power2.out",onUpdate:()=>scene.setInvitation?.(invitation.value)});}};
   director.current=controller;runtimeCleanup.push(()=>{if(director.current===controller)director.current=null;});
   runtimeCleanup.push(()=>{window.removeEventListener("popstate",restore);window.removeEventListener("hashchange",restore);document.removeEventListener("visibilitychange",refresh);surface.removeEventListener("cinema-error",error);});
   window.addEventListener("popstate",restore);window.addEventListener("hashchange",restore);document.addEventListener("visibilitychange",refresh);surface.addEventListener("cinema-error",error);
   // Every runtime object is registered above, before any startup operation can
   // throw. A restored assembly hash also needs its static field behind the boot.
   ScrollTrigger.refresh();restore();draw();veil.draw(progress.value,0);pause(pausedRef.current);
   if(disposed)return;
   if(bootTimeout)clearTimeout(bootTimeout);node.dataset.cinemaReady="true";setWorldReady(true);
  }).catch(fail);
  return cleanup;
 },[cinematic,invitationPreparation]);
 function closeVault(){
  vault.current?.close();setVaultOpen(false);
  if(vaultOverflow.current!==null){document.body.style.overflow=vaultOverflow.current;vaultOverflow.current=null;}
  pausedRef.current=vaultPause.current;director.current?.pause(vaultPause.current);vaultReturn.current?.focus();
 }
 function openVault(event:React.MouseEvent<HTMLAnchorElement>){
  if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.button!==0)return;
  if(!vault.current)return;event.preventDefault();if(vault.current.open)return;vaultReturn.current=event.currentTarget;vaultPause.current=pausedRef.current;
  pausedRef.current=true;director.current?.pause(true);vaultOverflow.current=document.body.style.overflow;document.body.style.overflow="hidden";
  setVaultOpen(true);vault.current.showModal();
 }
 function enterRoom(id:string){
  closeVault();history.pushState(null,"",`#${id}`);
  if(director.current)director.current.go(id);else document.getElementById(id)?.scrollIntoView({behavior:"auto"});
 }
 useEffect(()=>()=>{if(vaultOverflow.current!==null){document.body.style.overflow=vaultOverflow.current;vaultOverflow.current=null;}},[]);
 function choose(value:Preference){setChoice(value);if(value==="enabled")setFailed(false);setPaused(false);setIndexOpen(false);try{localStorage.setItem("zereca-cinema-mode",value);window.dispatchEvent(new Event("zereca-motion-change"));}catch{}}
 function navigate(event:React.MouseEvent<HTMLAnchorElement>,id:string){
  setIndexOpen(false);if(!cinematic||!director.current)return;
  if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.button!==0)return;
  event.preventDefault();history.pushState(null,"",`#${id}`);director.current.go(id);
 }
 const current=filmChapters[active]??filmChapters[0];
 return <>
 {!entered&&<BootEntrance reduced={reduced} worldReady={worldReady&&cinematic} progress={worldProgress} failed={failed} onSelect={mode=>choose(mode==="cinema"?"enabled":"disabled")} onEnter={()=>{enteredRef.current=true;setEntered(true);if(!location.hash)window.scrollTo(0,0);requestAnimationFrame(()=>root.current?.querySelector<HTMLAnchorElement>(".brand")?.focus({preventScroll:true}));}}/>}
 <main ref={root} inert={!entered} aria-hidden={!entered} data-motion-preference={preference} data-cinema-failed={String(failed)} data-invitation-active={invitationActive} className={cinematic?"institution cinema cinema-film":"institution simple"}>
  <a className="skip" href="#devs" onClick={e=>navigate(e,"devs")}>Skip to ongoing work</a>
  <header className="masthead film-masthead">
   <Link className="brand" href="/#threshold" onClick={e=>navigate(e,"threshold")} aria-label="Zereca, return to Threshold"><img src="/assets/zereca-light.svg" width="34" height="34" alt=""/><span>ZERECA</span></Link>
   <span className="institution-label">THE INSTITUTION</span>
   <nav aria-label="Chapters"><a href="/work#devs" onClick={openVault} aria-haspopup="dialog" aria-current={vaultOpen||cinematic&&active>=chapterIndices.devs&&active<=chapterIndices.research?"location":undefined}>Ongoing</a><Link href="/work#opening-study">Completed</Link><a href={cinematic?"#invitation":"#assembly"} onClick={e=>navigate(e,cinematic?"invitation":"assembly")}>Discord</a></nav>
  </header>
  {cinematic&&<div className="film-journey" ref={journey}>
   {filmChapters.map(c=><div key={c.id} id={c.id} className="film-anchor" style={{top:`${(c.id==="threshold"?0:chapterTarget(c.id))*100}%`}}/>)}
   <div className="film-stage" ref={stage} aria-label="A continuous camera journey through Zereca’s rooms">
    <div className="film-initial" aria-hidden="true"><img src="/assets/threshold.webp" alt="" fetchPriority="high"/><img className="film-initial-mark" src="/assets/zereca-light.svg" alt=""/></div>
    <div className="film-shade" aria-hidden="true"/>
    {filmChapters.map((c,i)=><section key={c.id} data-scene={c.id} className={`film-copy ${c.id==="assembly"?"film-field-copy":""} ${active===i?"is-current":""} ${!readable?"in-passage":""}`} aria-hidden={active!==i||!readable} inert={active!==i||!readable}>
     <p className="eyebrow">{String(i+1).padStart(2,"0")} &nbsp; / &nbsp; {c.label}</p>
     <SceneHeading title={c.title} level={i===0?1:2}/>
     <p className="film-subtitle">{c.subtitle}</p>
     <p className="film-status"><span/>{c.status}</p>
     {c.href&&c.id!=="assembly"&&<a className="text-link" href={c.href} target={c.href.startsWith("https")?"_blank":undefined} rel={c.href.startsWith("https")?"noopener noreferrer":undefined}>{c.link}</a>}
     {c.id==="assembly"&&<a className="text-link film-field-invitation" href="#invitation" onClick={e=>navigate(e,"invitation")}>Follow the invitation</a>}
     <p className="film-note">{c.note}</p>
    </section>)}
    <UnwrittenInvitation cinematic preparation={invitationPreparation} roomMotion={roomMotion} active={active===lastChapterIndex&&invitationActive} visible={active===lastChapterIndex} paused={paused||vaultOpen||!entered} reduced={reduced} onAttention={open=>director.current?.invite(open)}/>
    <div className="film-margin" aria-hidden="true"><span>EST. / ZERECA</span><span>MOVE DIFFERENT.</span></div>
    <div className="film-foot">
     <button className="film-rooms-toggle" onClick={()=>setIndexOpen(!indexOpen)} aria-expanded={indexOpen} aria-controls="film-room-index"><span>{String(active+1).padStart(2,"0")} / {String(filmChapters.length).padStart(2,"0")}</span> {current.label} <span aria-hidden="true">{indexOpen?"−":"+"}</span></button>
     <span className="film-scroll-hint">{paused?"MOTION PAUSED":active===lastChapterIndex?"THE NEXT DOOR":"SCROLL TO MOVE"}<span aria-hidden="true"> ↓</span></span>
     <div className="film-progress-track" aria-hidden="true"><span/></div>
    </div>
    {indexOpen&&<nav id="film-room-index" className="film-room-index" aria-label="Choose a room">{filmChapters.map((c,i)=><a key={c.id} href={`#${c.id}`} onClick={e=>navigate(e,c.id)} aria-current={active===i?"location":undefined}><span>{String(i+1).padStart(2,"0")}</span><span>{c.label}</span><span>{c.id==="threshold"||c.id==="assembly"?"Enter":"Ongoing"}</span></a>)}</nav>}
   </div>
  </div>}
  {!cinematic&&<>
   <div className="native-flow"><section id="threshold" className="native-section"><div className="native-image"><img src="/assets/threshold.webp" alt="A quiet graphite room with an architectural recess and reflective floor." fetchPriority="high"/><img className="native-emblem" src="/assets/zereca-light.svg" alt="Zereca’s canonical crest"/></div><div className="native-copy"><p className="eyebrow">THE INSTITUTION</p><h1>Move <em>Different.</em></h1><p className="intro">Software. Sound. Stories. Research.</p><p className="quiet">Independent disciplines. One shared instinct.</p></div></section></div>
   <WorkExhibition animated={false} standalone/>
   <UnwrittenInvitation standalone cinematic={preference!=="disabled"} reduced={reduced} paused={paused||vaultOpen||!entered}/>
  </>}
  <dialog ref={vault} className="film-work-dialog" aria-label="Zereca work gallery" data-lenis-prevent onCancel={event=>{event.preventDefault();closeVault();}}><button className="film-vault-close" onClick={closeVault} aria-label="Close work gallery">Close <span aria-hidden="true">×</span></button>{vaultOpen&&<OrbitalWorkGallery animated={cinematic} onEnterScene={enterRoom}/>}</dialog>
  <footer className="site-footer film-site-footer"><Link prefetch={false} className="text-link" href="/work">The project journal</Link><p>ZERECA &nbsp; Move Different.</p><nav className="film-socials" aria-label="Zereca channels"><a href={zereca.instagram} target="_blank" rel="noopener noreferrer">Instagram</a><a href={zereca.unclassified} target="_blank" rel="noopener noreferrer">Unclassified</a><a href={zereca.records} target="_blank" rel="noopener noreferrer">Records</a></nav></footer>
  <div className="motion-controls film-motion-controls" aria-label="Motion preferences">{cinematic&&<button onClick={()=>setPaused(!paused)}>{paused?"Resume motion":"Pause motion"}</button>}<a href="/basic">Basic view</a>{!cinematic&&<button onClick={()=>choose("enabled")}>Enter the cinema</button>}</div>
 </main></>;
}
