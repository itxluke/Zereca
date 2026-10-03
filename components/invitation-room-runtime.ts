/** Mutable input avoids React commits for scroll, pointer, camera and character motion. */
export type InvitationMotion={time:number;approach:number;x:number;y:number;focus:number;reveal:number;targetX:number;targetY:number;targetFocus:number;targetReveal:number};
export const invitationApproachSeconds=6.8;
const unit=(n:number)=>Number.isFinite(n)?Math.max(0,Math.min(1,n)):0;
const signed=(n:number)=>Number.isFinite(n)?Math.max(-1,Math.min(1,n)):0;
/** Choosing Cinema is an explicit request for motion; the system preference governs System mode. */
export function resolveCinemaReducedMotion(preference:'system'|'enabled'|'disabled',systemReduced:boolean){return preference!=='enabled'&&systemReduced;}
export function createInvitationMotion():InvitationMotion{return{time:0,approach:0,x:0,y:0,focus:0,reveal:0,targetX:0,targetY:0,targetFocus:0,targetReveal:0};}
export function stepInvitationMotion(m:InvitationMotion,elapsed:number,animate:boolean){
 const dt=Number.isFinite(elapsed)?Math.max(0,Math.min(.05,elapsed)):0;
 m.reveal=unit(m.targetReveal);
 if(m.reveal<=.015)m.approach=0;
 if(!animate)return;
 m.time+=dt;
 if(m.reveal>.015)m.approach=Math.min(invitationApproachSeconds,Math.max(0,Number.isFinite(m.approach)?m.approach:0)+dt);
 const ease=1-Math.exp(-dt*5);
 m.x+=(signed(m.targetX)-m.x)*ease;m.y+=(signed(m.targetY)-m.y)*ease;m.focus+=(unit(m.targetFocus)-m.focus)*ease;
}
export function invitationCameraPose(m:InvitationMotion,portrait:boolean,reduced:boolean,aspect=portrait?.5:16/9){
 const p=reduced?1:unit(m.reveal),arrival=reduced?1:unit(m.approach/invitationApproachSeconds);
 // Scroll opens the shot; a separate private clock gives the dolly time to breathe.
 // Quintic easing starts and ends with zero velocity and acceleration.
 const ease=(p*p*(3-2*p))*(arrival*arrival*arrival*(arrival*(arrival*6-15)+10));
 const px=reduced?0:signed(m.x)*.018,py=reduced?0:signed(m.y)*.012;
 // A physical 1.6 m dolly through a real doorway. Focal length never ramps.
 const z=4.32-1.6*ease,arc=reduced?0:Math.sin(ease*Math.PI)*.045;
 const narrow=Number.isFinite(aspect)&&aspect>0&&aspect<.49;
 // Preserve the entire supplied coat/glove silhouette in unusually narrow viewports.
 // The dolly remains 1.6 m and its starting point stays inside the real corridor.
 const portraitRetreat=narrow?Math.min(1.8,(.49/Math.max(.3,aspect)-1)*2.65):0;
 return portrait?
  {position:[.63+.05*ease+px,1.64-.02*ease+py,z+portraitRetreat] as const,target:[.9,.78,-1.38] as const,fov:43}:
  {position:[-.72+.38*ease+arc+px,1.64-.02*ease+py,z] as const,target:[-.12,1.02,-1.65] as const,fov:44};
}
/** An anchored deadline retains 30 fps on a 60 Hz ticker instead of accidentally becoming 20 fps. */
export function createInvitationFrameDeadline(fps:number){
 const interval=1000/Math.max(1,fps);let next:number|undefined;
 return{reset(){next=undefined;},due(now:number){
  if(!Number.isFinite(now)){next=undefined;return false;}
  if(next===undefined||now-next>interval*3){next=now+interval;return true;}
  if(now+.8<next)return false;
  next+=interval;
  if(next<now-interval)next=now+interval;
  return true;
 }};
}
/** Native R3F frames own playback. Accumulate skipped high-refresh frames before the capped draw. */
export function createInvitationRenderClock(fps:number){
 const deadline=createInvitationFrameDeadline(fps);let accumulated=0;
 return{reset(){accumulated=0;deadline.reset();},step(now:number,delta:number,playing:boolean){
  if(!playing){accumulated=0;deadline.reset();return 0;}
  accumulated+=Number.isFinite(delta)?Math.max(0,Math.min(.05,delta)):0;
  if(!deadline.due(now))return null;
  const elapsed=Math.min(.05,accumulated);accumulated=0;return elapsed;
 }};
}
export function createInvitationPreparation(){
 let finished=false,resolve!:()=>void;const ready=new Promise<void>(done=>{resolve=done;});
 return{ready,complete(){if(finished)return;finished=true;resolve();},get finished(){return finished;}};
}
export type InvitationPreparation=ReturnType<typeof createInvitationPreparation>;
