// Prepare entrance artwork only. Cinema's invitation is a real room, not these basic-view images.
export const cinemaArt={
 opening:'/assets/entrance-living-veil-v1.webp',
 ritual:'/assets/entrance-seam-v1.webp',
 invitation:'/assets/invitation-chamber-v1.webp',
 steward:'/assets/unwritten-sprite-v1.webp',
} as const;

export async function warmCinemaArt(signal:AbortSignal,onProgress:(ready:number,total:number)=>void){
 const sources=[cinemaArt.opening,cinemaArt.ritual];let ready=0;
 onProgress(ready,sources.length);
 await Promise.all(sources.map(source=>new Promise<void>((resolve,reject)=>{
  const image=new Image();image.decoding='async';
  let finished=false;
  const finish=(error?:unknown)=>{
   if(finished)return;finished=true;signal.removeEventListener('abort',abort);
   if(error){reject(error);return;}ready++;onProgress(ready,sources.length);resolve();
  };
  const abort=()=>{image.src='';finish(new DOMException('Artwork preparation aborted','AbortError'));};
  if(signal.aborted){abort();return;}
  signal.addEventListener('abort',abort,{once:true});image.src=source;
  image.decode().then(()=>finish(),()=>finish(new Error('The entrance artwork could not be prepared')));
 })));
}
