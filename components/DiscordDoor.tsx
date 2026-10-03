"use client";
import {useRef,useState,useEffect} from "react";
import {gsap} from "gsap";
export default function DiscordDoor(){
 const door=useRef<HTMLAnchorElement>(null),[open,setOpen]=useState(false);
 useEffect(()=>{if(!door.current)return;const tween=gsap.to(door.current,{"--door-angle":open?"-42deg":"0deg",duration:.7,ease:"power2.out"});return()=>{tween.kill();};},[open]);
 return <section id="assembly" className="discord-door-section" aria-label="An invitation to Zereca Discord">
  <div><p className="eyebrow">THE NEXT DOOR</p><h2>You’re<br/><em>expected.</em></h2><p className="intro">The work continues inside Zereca.</p><a className="text-link" href="https://discord.gg/kx5AXmVrjV" target="_blank" rel="noopener noreferrer">Join Zereca on Discord ↗</a></div>
  <a ref={door} className="discord-door-object" href="https://discord.gg/kx5AXmVrjV" target="_blank" rel="noopener noreferrer" aria-label="Open the door to Zereca Discord" onMouseEnter={()=>setOpen(true)} onMouseLeave={()=>setOpen(false)} onFocus={()=>setOpen(true)} onBlur={()=>setOpen(false)}><span className="discord-door-light"/><span className="discord-door-leaf"><img src="/assets/zereca-light.svg" alt=""/><span className="discord-door-handle"/></span><span className="discord-door-label">ENTER ZERECA ↗</span></a>
 </section>;
}
