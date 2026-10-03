"use client";
import {useCallback,useEffect,useId,useRef,useState,type ComponentType,type MutableRefObject} from 'react';
import {gsap} from 'gsap';
import {cinemaArt} from './cinema-art';
import {createInvitationMotion,type InvitationMotion,type InvitationPreparation} from './invitation-room-runtime';

type RoomProps={motion:MutableRefObject<InvitationMotion>;visible:boolean;paused:boolean;reduced:boolean;onPrepared:(webgl:boolean,reason?:string)=>void};
type Props={active?:boolean;visible?:boolean;paused?:boolean;reduced?:boolean;standalone?:boolean;cinematic?:boolean;roomMotion?:MutableRefObject<InvitationMotion>;preparation?:InvitationPreparation;onAttention?:(open:boolean)=>void};
const discord='https://discord.gg/kx5AXmVrjV';

export default function UnwrittenInvitation({active=true,visible=true,paused=false,reduced=false,standalone=false,cinematic=false,roomMotion,preparation,onAttention}:Props){
 const root=useRef<HTMLElement>(null),sprite=useRef<HTMLAnchorElement>(null),link=useRef<HTMLAnchorElement>(null),thread=useRef<SVGPathElement>(null);
 const pointer=useRef({x:0,y:0,targetX:0,targetY:0});
 const ownMotion=useRef(createInvitationMotion()),motion=roomMotion??ownMotion;
 const bootTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const generation=useRef(0);
 const [attention,setAttention]=useState(false);const title=useId();
 const [Room,setRoom]=useState<ComponentType<RoomProps>|null>(null),[roomReady,setRoomReady]=useState(false),[roomUnavailable,setRoomUnavailable]=useState(false);
 const [roomDelayed,setRoomDelayed]=useState(false),[attempt,setAttempt]=useState(0),[roomError,setRoomError]=useState('');
 const prepared=useCallback((webgl:boolean,reason?:string)=>{clearTimeout(bootTimer.current);setRoomReady(webgl);setRoomUnavailable(!webgl);setRoomDelayed(false);setRoomError(webgl?'':reason??'Room preparation failed');preparation?.complete();},[preparation]);
 const roomPrepared=useCallback((webgl:boolean,reason?:string)=>{if(generation.current===attempt)prepared(webgl,reason);},[attempt,prepared]);
 useEffect(()=>{
  if(!cinematic)return;
  let cancelled=false;
  // A loading deadline releases the entrance, never destroys a valid pending room.
  bootTimer.current=setTimeout(()=>{if(!cancelled){setRoomDelayed(true);preparation?.complete();}},30000);
  import('./InvitationRoom').then(module=>{if(!cancelled){if(attempt>0)module.resetInvitationRoomAssets();setRoom(()=>module.default);}},error=>{if(!cancelled)prepared(false,error instanceof Error?error.message:'Room module could not load');});
  return()=>{cancelled=true;clearTimeout(bootTimer.current);};
 },[cinematic,attempt,prepared,preparation]);
 useEffect(()=>{if(standalone)motion.current.targetReveal=1;},[standalone,motion]);
 function retryRoom(){generation.current++;setAttempt(generation.current);setRoom(null);setRoomReady(false);setRoomUnavailable(false);setRoomDelayed(false);setRoomError('');}
 function beckon(open:boolean){setAttention(open);motion.current.targetFocus=open&&active?1:0;if(!cinematic)onAttention?.(open);}
 useEffect(()=>{
  const node=root.current;if(!node||!visible||paused)return;
  if(reduced){node.style.setProperty('--unwritten-x','0px');node.style.setProperty('--unwritten-y','0px');node.style.setProperty('--unwritten-float','0px');return;}
  let last:number|undefined,paint=-1,life=0,motionTime=0,start={x:0,y:0},end={x:0,y:0};
  const resize=()=>{
   const bounds=node.getBoundingClientRect(),cta=link.current?.getBoundingClientRect(),figure=sprite.current?.getBoundingClientRect();
   if(!cta||!figure)return;
   const style=getComputedStyle(node),value=Number.parseFloat(style.getPropertyValue('--invite-reveal')),reveal=Number.isFinite(value)?value:1;
   const float=Number.parseFloat(style.getPropertyValue('--unwritten-float'))||0,motion=pointer.current;
   start={x:cta.right-bounds.left+10+motion.x*.4,y:cta.bottom-bounds.top+4-(1-reveal)*14};
   end={x:figure.left-bounds.left+figure.width*.28-motion.x,y:figure.top-bounds.top+figure.height*.25-motion.y-float-(1-reveal)*18};
  };
  const observer=new ResizeObserver(resize);observer.observe(node);resize();
  const visibility=()=>{last=undefined;motionTime=0;};document.addEventListener('visibilitychange',visibility);
  const tick=(time:number)=>{
   if(document.hidden){last=undefined;return;}
   const dt=last===undefined?0:Math.max(0,Math.min(.05,time-last));last=time;life+=dt;motionTime+=dt;
   if(time-paint<1/30)return;paint=time;
   const motion=pointer.current,amount=1-Math.exp(-Math.min(.1,motionTime)*9);motionTime=0;
   motion.x+=(motion.targetX-motion.x)*amount;motion.y+=(motion.targetY-motion.y)*amount;
   const float=cinematic?0:Math.sin(life*.72)*1.6;
   node.style.setProperty('--unwritten-x',`${motion.x.toFixed(3)}px`);
   node.style.setProperty('--unwritten-y',`${motion.y.toFixed(3)}px`);
   node.style.setProperty('--unwritten-float',`${float.toFixed(3)}px`);
   const ex=end.x+motion.x,ey=end.y+motion.y+float;
   thread.current?.setAttribute('d',`M${start.x},${start.y} C${start.x+95},${start.y+32} ${ex-115},${ey+78} ${ex},${ey}`);
  };
  gsap.ticker.add(tick);
  return()=>{observer.disconnect();document.removeEventListener('visibilitychange',visibility);gsap.ticker.remove(tick);};
 },[visible,paused,reduced,cinematic]);
 return <section ref={root} id={standalone?'assembly':undefined} className={`unwritten-invitation ${standalone?'unwritten-standalone':''}`} data-active={active} data-paused={paused||reduced} data-cinematic={cinematic} data-room={cinematic?(roomReady?'webgl':roomUnavailable?'failed':roomDelayed?'delayed':'loading'):'artwork'} data-room-error={roomError||undefined} data-attention={attention&&active} aria-labelledby={title} aria-hidden={!active} inert={!active}
  onPointerMove={event=>{if(reduced||paused||!active||event.pointerType==='touch')return;const bounds=event.currentTarget.getBoundingClientRect();pointer.current.targetX=Math.max(-.5,Math.min(.5,(event.clientX-bounds.left-bounds.width/2)/bounds.width))*12;pointer.current.targetY=Math.max(-.5,Math.min(.5,(event.clientY-bounds.top-bounds.height/2)/bounds.height))*8;motion.current.targetX=pointer.current.targetX/6;motion.current.targetY=pointer.current.targetY/4;}}
  onPointerLeave={()=>{pointer.current.targetX=0;pointer.current.targetY=0;motion.current.targetX=0;motion.current.targetY=0;}}>
  {!cinematic&&<img className="unwritten-background" src={cinemaArt.invitation} width="1672" height="941" alt="" aria-hidden="true" decoding="async"/>}
  {cinematic&&Room&&<div className="unwritten-room" aria-hidden="true"><Room key={attempt} motion={motion} visible={visible} paused={paused} reduced={reduced} onPrepared={roomPrepared}/></div>}
  <div className="unwritten-haze" aria-hidden="true"/>
  <svg className="unwritten-thread" aria-hidden="true"><path ref={thread} fill="none" pathLength="1" vectorEffect="non-scaling-stroke"/></svg>
  <div className="unwritten-copy">
   <p className="eyebrow">THE NEXT DOOR</p>
   <h2 id={title}><span>You’re</span><span>expected.</span></h2>
   <p className="unwritten-intro">The work continues inside Zereca.</p>
   <a ref={link} className="unwritten-link" href={discord} target="_blank" rel="noopener noreferrer" onPointerEnter={()=>beckon(true)} onPointerLeave={()=>beckon(false)} onFocus={()=>beckon(true)} onBlur={()=>beckon(false)}>Join Zereca on Discord</a>
   <span className="unwritten-instruction">AN INVITATION, HELD OPEN.</span>
  </div>
  {cinematic&&!roomReady&&<div className="unwritten-room-status" role="status" aria-live="polite"><span>{roomUnavailable?'The chamber could not open.':roomDelayed?'The chamber is still opening.':'Opening the chamber'}</span>{(roomUnavailable||roomDelayed)&&<button type="button" onClick={retryRoom}>Open again</button>}</div>}
  <a ref={sprite} className="unwritten-steward" href={discord} target="_blank" rel="noopener noreferrer" tabIndex={cinematic&&!roomReady?-1:undefined} aria-hidden={cinematic&&!roomReady||undefined} aria-label="Take the Unwritten’s invitation to Zereca Discord" onPointerEnter={()=>beckon(true)} onPointerLeave={()=>beckon(false)} onFocus={()=>beckon(true)} onBlur={()=>beckon(false)}>
   {!cinematic&&<><img className="unwritten-sprite" src={cinemaArt.steward} width="1024" height="1536" alt="The Unwritten: an invisible figure in a black suit, offering an envelope on a crimson thread." decoding="async"/>
   <img className="unwritten-envelope-crest" src="/assets/zereca-light.svg" width="24" height="24" alt="" aria-hidden="true"/></>}
   <span className="unwritten-take">TAKE THE INVITATION <span aria-hidden="true">↗</span></span>
  </a>
 </section>;
}
