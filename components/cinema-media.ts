import {filmChapters,chapterIndices} from './cinema-chapters';
import {cinemaFilms,loadCinemaFilm} from './cinema-film-cache';

const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const ease=(v:number)=>{const x=clamp(v);return x*x*(3-2*x);};
type Options={onProgress?:(ready:number,total:number)=>void};

/** One scheduled seek and one native presentation callback per active film.
 * Scroll updates replace the target; a seek never builds a frame queue. */
export function createCinemaMedia(host:HTMLElement,options:Options={}){
 const surface=document.createElement('div');surface.className='cinema-media';surface.setAttribute('aria-hidden','true');
 const specs=[{id:'devs',name:'devs',word:'DEVS'},{id:'unclassified',name:'atlas',word:'UNCLASSIFIED'},{id:'records',name:'records',word:'FREQUENCY'}] as const;
 let disposed=false,paused=false,decodedCount=0,warming:Promise<void>|undefined;
 const shots=specs.map(spec=>{
  const chapter=filmChapters[chapterIndices[spec.id]],film=cinemaFilms[spec.name];
  const shot=document.createElement('div');shot.className=`cinema-media-shot cinema-media-${spec.name}`;
  shot.style.willChange='auto';
  const backdrop=document.createElement('img');backdrop.src=`/assets/films/${spec.name}-poster.webp`;backdrop.alt='';backdrop.className='cinema-media-backdrop';backdrop.decoding='async';
  const word=document.createElement('div');word.className='cinema-depth-word';word.textContent=spec.word;
  word.style.willChange='auto';
  const contour=document.createElement('div');contour.className='cinema-depth-word cinema-depth-contour';contour.textContent=spec.word;
  contour.style.willChange='auto';
  const video=document.createElement('video');video.className='cinema-media-video';video.muted=true;video.defaultMuted=true;video.playsInline=true;video.preload='none';video.poster=backdrop.src;video.setAttribute('playsinline','');video.disablePictureInPicture=true;
  const hasFrameCallbacks=typeof video.requestVideoFrameCallback==='function'&&typeof video.cancelVideoFrameCallback==='function';
  shot.dataset.frameClock=hasFrameCallbacks?'presented':'decoded';
  let target=0,visible=false,failed=false,objectUrl:string|undefined,loading:Promise<void>|undefined,settled=false,lastProgress=-1,seekFrame:number|undefined,presentationFrame:number|undefined;
  let resolveDecoded:()=>void=()=>{},rejectDecoded:(error:Error)=>void=()=>{};
  const decoded=new Promise<void>((resolve,reject)=>{resolveDecoded=resolve;rejectDecoded=reject;});
  // Readiness uses decoded data, including when the tab is hidden. A compositor
  // callback is telemetry only and must never hold the entrance closed.
  void decoded.catch(()=>{});
  const controller=new AbortController();
  const cancelSeek=()=>{if(seekFrame!==undefined){cancelAnimationFrame(seekFrame);seekFrame=undefined;}};
  const cancelPresentation=()=>{if(presentationFrame!==undefined){video.cancelVideoFrameCallback(presentationFrame);presentationFrame=undefined;}};
  const cancelWork=()=>{cancelSeek();cancelPresentation();};
  const isActive=()=>!disposed&&!paused&&!document.hidden&&visible&&!failed;
  const canSeek=()=>isActive()&&video.readyState>=1&&!video.seeking&&Number.isFinite(video.duration)&&video.duration>0;
  const requestPresentation=()=>{
   if(!hasFrameCallbacks||!isActive()||video.readyState<2||presentationFrame!==undefined)return;
   presentationFrame=video.requestVideoFrameCallback((_now,metadata)=>{
    presentationFrame=undefined;
    if(!isActive())return;
    if(Number.isFinite(metadata.mediaTime)){
     shot.dataset.frame=String(Math.round(metadata.mediaTime*film.fps));
     shot.dataset.mediaTime=String(metadata.mediaTime);
    }
    requestPresentation();
   });
  };
  const seek=()=>{
   requestPresentation();
   if(!canSeek()||seekFrame!==undefined)return;
   seekFrame=requestAnimationFrame(()=>{
    seekFrame=undefined;
    if(!canSeek())return;
    const frame=Math.round(target*(film.frames-1)),desired=frame/film.fps;
    if(Math.abs(video.currentTime-desired)>1/(film.fps*4)){
     try{video.currentTime=desired;shot.dataset.targetFrame=String(frame);requestPresentation();}catch{/* Keep the last decoded frame. */}
    }
   });
  };
  const ready=()=>{
   if(disposed||failed)return;
   if(video.readyState>=2){
    shot.dataset.ready='true';
    if(!hasFrameCallbacks){shot.dataset.frame=String(Math.round(video.currentTime*film.fps));shot.dataset.mediaTime=String(video.currentTime);}
    if(!settled){settled=true;decodedCount++;resolveDecoded();options.onProgress?.(decodedCount,specs.length);}
   }
   seek();
  };
  const fail=(error:Error)=>{if(disposed)return;failed=true;shot.dataset.failed='true';cancelWork();if(!settled){settled=true;rejectDecoded(error);}};
  const load=()=>{
   if(objectUrl||failed||disposed)return Promise.resolve();
   if(loading)return loading;
   shot.dataset.loading='true';
   loading=(async()=>{
    try{
     const result=await loadCinemaFilm(spec.name,controller.signal);
     if(disposed||controller.signal.aborted)return;
     if(!result)throw new Error(`The ${spec.name} film could not load`);
     shot.dataset.cache=result.source;
     objectUrl=URL.createObjectURL(result.blob);video.src=objectUrl;video.preload='auto';video.load();
    }catch(error){if(!disposed)fail(error instanceof Error?error:new Error(String(error)));}
    finally{delete shot.dataset.loading;loading=undefined;}
   })();
   return loading;
  };
  const error=()=>fail(new Error(`The ${spec.name} film could not decode`));
  video.addEventListener('loadedmetadata',seek);video.addEventListener('loadeddata',ready);video.addEventListener('canplay',ready);video.addEventListener('seeked',ready);video.addEventListener('error',error);
  shot.appendChild(backdrop);shot.appendChild(word);shot.appendChild(video);shot.appendChild(contour);surface.appendChild(shot);
  return {decoded,load,seek,cancelWork,
   draw(p:number){
    if(disposed)return;
    const {start,end}=chapter,local=clamp((p-start)/(end-start));
    const entry=ease((p-(start-.025))/.025),exit=ease((p-(end-.022))/.022);
    const nextVisible=p>start-.026&&p<end;
    if(nextVisible!==visible){shot.dataset.active=String(nextVisible);shot.style.willChange=nextVisible?'transform, clip-path':'auto';word.style.willChange=contour.style.willChange=nextVisible?'transform':'auto';}
    visible=nextVisible;
    if(visible||lastProgress<0||lastProgress>start-.026&&lastProgress<end){
     shot.style.visibility=visible?'visible':'hidden';shot.style.opacity=String(visible?1-exit:0);
     shot.style.clipPath=`inset(${(1-entry)*37}% ${(1-entry)*34}% ${(1-entry)*39}% ${(1-entry)*64}% round ${(1-entry)*12}px)`;
     shot.style.transform=spec.name==='records'?'none':`scale(${1+(1-entry)*.025+exit*.025})`;shot.style.filter=`brightness(${1-exit*.55})`;
     word.style.transform=spec.name==='records'?`translate3d(${-local*45}px,${12-local*30}px,0)`:`translate3d(${-local*60}px,${20-local*40}px,0)`;
     contour.style.transform=spec.name==='records'?`translate3d(${10-local*22}px,${3-local*16}px,0)`:`translate3d(${12-local*30}px,${8-local*22}px,0)`;
    }
    lastProgress=p;target=local;
    if(!visible)cancelWork();else if(objectUrl)seek();
   },
   dispose(){
    cancelWork();controller.abort();
    if(!settled){settled=true;rejectDecoded(new DOMException('Film loading cancelled','AbortError'));}
    video.removeEventListener('loadedmetadata',seek);video.removeEventListener('loadeddata',ready);video.removeEventListener('canplay',ready);video.removeEventListener('seeked',ready);video.removeEventListener('error',error);
    video.pause();video.removeAttribute('src');video.load();if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=undefined;}
   }
  };
 });
 const visibility=()=>shots.forEach(shot=>document.hidden?shot.cancelWork():shot.seek());
 document.addEventListener('visibilitychange',visibility);
 host.appendChild(surface);
 options.onProgress?.(0,specs.length);
 return {
  mount(){if(!disposed)host.appendChild(surface);},
  warm(){
   if(disposed)return Promise.reject(new DOMException('Film loading cancelled','AbortError'));
   if(!warming){
    // Each full Blob and its decoded starting frame must be ready before entry.
    warming=Promise.all(shots.map(async shot=>{await shot.load();await shot.decoded;})).then(()=>{});
    void warming.catch(()=>{});
   }
   return warming;
  },
  draw(p:number){if(!disposed)shots.forEach(shot=>shot.draw(p));},
  pause(value:boolean){if(disposed)return;paused=value;shots.forEach(shot=>value?shot.cancelWork():shot.seek());},
  dispose(){if(disposed)return;disposed=true;document.removeEventListener('visibilitychange',visibility);shots.forEach(shot=>shot.dispose());surface.remove();}
 };
}
