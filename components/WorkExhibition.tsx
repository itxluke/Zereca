"use client";
import {useEffect,useRef,useState} from "react";
import {gsap} from "gsap";
import {ScrollTrigger} from "gsap/ScrollTrigger";
import {exhibits,Exhibit} from "./exhibits";
gsap.registerPlugin(ScrollTrigger);
type Props={animated:boolean;paused?:boolean;standalone?:boolean;onNavigate?:(top:number)=>void};
function Material({item}:{item:Exhibit}){
 if(item.medium==="veil")return <div className="unknown-gallery-art"><img src="/assets/zereca-light.svg" alt="Zereca crest"/><span>WITHIN / IN FORMATION</span></div>;
 if(item.medium==="archive")return <img className="archive-study" src="/assets/archive-study.webp" alt="A restrained faceless silhouette in an ink-dark archive, a Red Thread Archive visual study." loading="lazy"/>;
 if(item.medium==="motion")return <video className="motion-artifact" src="/assets/opening-motion-proof.mp4" poster="/assets/opening-preview.jpg" controls playsInline preload="none" aria-label="Actual opening-to-Devs prototype motion recording"/>;
 if(item.medium==="identity")return <div className="project-identity"><img src="/assets/zereca-light.svg" alt="Zereca's exact emblem"/><p>Zereca<br/><em>Engine.</em></p><span>ANDROID ENGINE</span></div>;
 if(item.medium==="sound")return <div className="direction-sheet"><span className="eyebrow">ZERECA RECORDS</span><p>Sound.<br/><em>Signal.</em><br/>Story.</p><span className="direction-note">A frequency taking shape.</span></div>;
 return <div className="direction-sheet"><span className="eyebrow">ZERECA RESEARCH</span><p>What lies<br/><em>beyond</em><br/>the familiar?</p><span className="direction-note">An open research direction.</span></div>;
}
export default function WorkExhibition({animated,paused=false,standalone=false,onNavigate}:Props){
 const container=useRef<HTMLElement>(null),stage=useRef<HTMLDivElement>(null),rail=useRef<HTMLDivElement>(null),room=useRef<HTMLImageElement>(null),trigger=useRef<ScrollTrigger|null>(null);
 const current=useRef(0),navigator=useRef(onNavigate);navigator.current=onNavigate;
 const [active,setActive]=useState(0);
 const anchor=(id:string)=>standalone?id:`work-${id}`;
 useEffect(()=>{
  if(!animated||!container.current||!stage.current||!rail.current)return;
  const host=container.current,view=stage.current,strip=rail.current;const panels=Array.from(strip.children) as HTMLElement[];
  const progression={value:0};
  const draw=()=>{if(document.hidden)return;const scaled=progression.value*exhibits.length,whole=Math.floor(scaled),part=Math.max(0,Math.min(1,(scaled-whole-.58)/.42));const eased=part*part*(3-2*part);const position=Math.min(exhibits.length-1,whole+eased);
   gsap.set(strip,{x:-position*view.clientWidth});if(room.current)gsap.set(room.current,{xPercent:-position*.42,scale:1.07});
   panels.forEach((panel,i)=>{const difference=Math.max(-1,Math.min(1,i-position));gsap.set(panel,{rotationY:difference*-5,transformOrigin:"50% 50%",z:-Math.abs(difference)*24});});
   const next=Math.round(position);if(next!==current.current){current.current=next;setActive(next);}host.dataset.exhibit=exhibits[next].id;host.dataset.progress=progression.value.toFixed(5);
  };
  const tween=gsap.to(progression,{value:1,ease:"none",onUpdate:draw,scrollTrigger:{trigger:host,start:"top top",end:"bottom bottom",scrub:.55,invalidateOnRefresh:true,onRefresh:draw}});trigger.current=tween.scrollTrigger!;
  const move=(index:number)=>{const t=trigger.current;if(!t)return;const y=t.start+(t.end-t.start)*((index+.04)/exhibits.length);if(navigator.current)navigator.current(y);else window.scrollTo({top:y,behavior:"auto"});};
  const restore=()=>{const id=location.hash.slice(1);const index=exhibits.findIndex(item=>anchor(item.id)===id);if(index>=0)move(index);};
  const visibility=()=>{if(!document.hidden){ScrollTrigger.refresh();draw();}};
  window.addEventListener("popstate",restore);document.addEventListener("visibilitychange",visibility);ScrollTrigger.refresh();restore();draw();
  return()=>{window.removeEventListener("popstate",restore);document.removeEventListener("visibilitychange",visibility);tween.scrollTrigger?.kill();tween.kill();trigger.current=null;gsap.set(strip,{clearProps:"transform"});panels.forEach(panel=>gsap.set(panel,{clearProps:"transform,transformOrigin"}));if(room.current)gsap.set(room.current,{clearProps:"transform"});current.current=0;setActive(0);};
 },[animated,standalone]);
 useEffect(()=>{const t=trigger.current;if(!t)return;if(paused)t.disable(false,false);else t.enable(false,false);},[paused,animated]);
 function go(event:React.MouseEvent<HTMLAnchorElement>,index:number){if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||!animated||!trigger.current)return;event.preventDefault();history.pushState(null,"",`#${anchor(exhibits[index].id)}`);const t=trigger.current;const top=t.start+(t.end-t.start)*((index+.04)/exhibits.length);if(onNavigate)onNavigate(top);else window.scrollTo({top,behavior:"auto"});}
 const Heading=standalone?"h1":"h2";
 return <section id="current-work" ref={container} className={`work-vault ${animated?"vault-animated":"vault-native"}`} style={animated?{height:`${(exhibits.length+1)*100}svh`}:undefined} aria-label="Zereca's ongoing work and completed studies">
  <div ref={stage} className="vault-stage"><img ref={room} className="vault-room" src="/assets/work-vault.webp" alt="" loading="lazy"/><div className="vault-shade" aria-hidden="true"/>
   <div className="vault-heading"><div><p className="eyebrow">THE WORK VAULT</p><Heading>What exists<br/><em>right now.</em></Heading></div><div className="vault-overview"><p>Work taking shape.<br/>Studies brought into the world.</p><nav aria-label="Work collections"><a href={`#${anchor(exhibits[0].id)}`} onClick={event=>go(event,0)}>Ongoing <span>05</span></a><a href={`#${anchor(exhibits[5].id)}`} onClick={event=>go(event,5)}>Completed studies <span>{String(exhibits.filter(item=>item.group==="completed").length).padStart(2,"0")}</span></a></nav></div></div>
   <div className="vault-window"><div ref={rail} className="vault-rail">{exhibits.map((item,index)=><article id={anchor(item.id)} className={`vault-exhibit ${animated&&active===index?"exhibit-active":""}`} key={item.id} aria-hidden={animated&&active!==index?true:undefined} inert={animated&&active!==index}>
    <div className="vault-copy"><p className="eyebrow">{String(index+1).padStart(2,"0")} &nbsp; {item.discipline}</p><p className="vault-status">{item.group==="completed"?"COMPLETED STUDY":"ONGOING"} <span>{item.status}</span></p><h3>{item.title}</h3><p className="vault-summary">{item.summary}</p><p className="vault-note">{item.note}</p>{item.href&&<a className="text-link" href={item.href} target={item.href.startsWith("https:")?"_blank":undefined} rel={item.href.startsWith("https:")?"noopener noreferrer":undefined}>{item.linkLabel}</a>}</div>
    <figure className={`vault-evidence material-${item.medium}`}><div className="evidence-object"><Material item={item}/></div><figcaption><span>{item.material}</span><span>{item.group==="completed"?"STUDY COMPLETE":"WORK IN PROGRESS"}</span></figcaption></figure>
   </article>)}</div></div>
   <div className="vault-index"><nav aria-label="Project index">{exhibits.map((item,index)=><a key={item.id} href={`#${anchor(item.id)}`} onClick={event=>go(event,index)} aria-current={animated&&active===index?"location":undefined}><span>{String(index+1).padStart(2,"0")}</span>{item.title}</a>)}</nav><p>{animated?"SCROLL THROUGH THE EXHIBITION":"ONGOING WORK AND COMPLETED STUDIES"}</p></div>
  </div>
 </section>;
}
