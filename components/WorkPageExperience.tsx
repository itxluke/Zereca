"use client";
import {useEffect,useRef,useState,useSyncExternalStore} from "react";
import Link from "next/link";
import {gsap} from "gsap";
import {ScrollTrigger} from "gsap/ScrollTrigger";
import Lenis from "lenis";
import WorkExhibition from "./WorkExhibition";
import OrbitalWorkGallery from "./OrbitalWorkGallery";
import DiscordDoor from "./DiscordDoor";
import {createCinemaFrameClock} from "./cinema-frame-clock";

type Preference="system"|"enabled"|"disabled";
const subscribePreference=(change:()=>void)=>{window.addEventListener("storage",change);window.addEventListener("zereca-motion-change",change);return()=>{window.removeEventListener("storage",change);window.removeEventListener("zereca-motion-change",change);};};
const getPreference=():Preference=>{try{const value=localStorage.getItem("zereca-cinema-mode");if(value==="enabled"||value==="disabled")return value;}catch{}return "system";};
const subscribeReduction=(change:()=>void)=>{const query=matchMedia("(prefers-reduced-motion:reduce)");query.addEventListener("change",change);return()=>query.removeEventListener("change",change);};
const getReduction=()=>matchMedia("(prefers-reduced-motion:reduce)").matches;

export default function WorkPageExperience(){
 const stored=useSyncExternalStore(subscribePreference,getPreference,()=>"system" as Preference);
 const reduced=useSyncExternalStore(subscribeReduction,getReduction,()=>true);
 const [choice,setChoice]=useState<Preference|null>(null);
 const preference=choice??stored;
 const animated=preference!=="disabled"&&(preference==="enabled"||!reduced);
 const lenis=useRef<Lenis|null>(null);
 useEffect(()=>{
  if(!animated)return;
  const scroll=new Lenis({autoRaf:false,respectReducedMotion:false});lenis.current=scroll;
  let disposed=false;
  scroll.on("scroll",ScrollTrigger.update);
  const frameClock=createCinemaFrameClock();
  const ticker=(time:number)=>{if(disposed)return;const clock=frameClock.step(time*1000,!document.hidden);if(clock!==null)scroll.raf(clock);};gsap.ticker.add(ticker);
  const visibility=()=>frameClock.reset();document.addEventListener("visibilitychange",visibility);
  return()=>{if(disposed)return;disposed=true;document.removeEventListener("visibilitychange",visibility);gsap.ticker.remove(ticker);scroll.destroy();if(lenis.current===scroll)lenis.current=null;};
 },[animated]);
 function toggle(){const next=animated?"disabled":"enabled";try{localStorage.setItem("zereca-cinema-mode",next);window.dispatchEvent(new Event("zereca-motion-change"));setChoice(null);}catch{setChoice(next);}}
 return <main className="work-experience">
  <header className="masthead work-gallery-masthead"><Link className="brand" href="/"><img src="/assets/zereca-light.svg" alt="" width="34" height="34"/><span>ZERECA</span></Link><span className="institution-label">THE WORK VAULT</span><nav aria-label="Work navigation"><Link href="/">The institution</Link><a href="#assembly">Discord</a></nav></header>
  <a className="skip" href="#current-work">Skip to the exhibition</a>
  {animated?<OrbitalWorkGallery animated standalone/>:<WorkExhibition animated={false} standalone/>}
  <DiscordDoor/>
  <footer className="journal-footer"><p>Curated project notes, checked 30 September 2026.</p><p>Completed studies are finished visual or technical studies. Product releases are labelled separately.</p><Link className="text-link" href="/">Return to the institution</Link></footer>
  <div className="motion-controls"><button onClick={toggle}>{animated?"Simple view":"Enter the gallery"}</button></div>
 </main>;
}
