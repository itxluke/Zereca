/** Seek-friendly, independently decodable frames. The cache is limited to
 * the selected three films; it never includes pages or authentication responses. */
export const cinemaFilms={
  "devs": {
    "url": "/assets/films/devs.mp4",
    "version": "a680e2b25530a9198a31c6ba6da8f7e633b307c83d5d02d900e59180f446df5f",
    "bytes": 2993795,
    "fps": 30,
    "frames": 90,
    "mobile": {
      "url": "/assets/films/devs-mobile.mp4",
      "version": "ee029264e14a9fb9cc8cd9441d057c4f10927b2c393e81023adcd67e9a8a1775",
      "bytes": 1968333
    }
  },
  "atlas": {
    "url": "/assets/films/atlas.mp4",
    "version": "fe6980be63683cec33557a0b2efdd698b0a719749694caac9a733877300e434e",
    "bytes": 8487899,
    "fps": 30,
    "frames": 300,
    "mobile": {
      "url": "/assets/films/atlas-mobile.mp4",
      "version": "b794e12259a079ea1ebbc2e49eac71acd29e8e335b5fc9d7dabfe72b79e2d472",
      "bytes": 5283286
    }
  },
  "records": {
    "url": "/assets/films/records.mp4",
    "version": "931c66815275dce8792240844edee8bbac29ffa7f1521291a86de4587ad708bf",
    "bytes": 3019641,
    "fps": 30,
    "frames": 120,
    "mobile": {
      "url": "/assets/films/records-mobile.mp4",
      "version": "e84d19b41f592a69cd0c123a2a659c41d9045485b8975490f4aea9b313a75676",
      "bytes": 1947838
    }
  }
} as const;
const cacheName='zereca-cinema-films-v1';
let selectedFilms:Record<keyof typeof cinemaFilms,{url:string;version:string;bytes:number}>|undefined;
function filmSelection(){
 if(!selectedFilms){
  const memory=(navigator as Navigator&{deviceMemory?:number}).deviceMemory;
  const compact=matchMedia('(max-width:860px)').matches||conserveCinemaData()||Boolean(memory&&memory<=4);
  selectedFilms=Object.fromEntries(Object.entries(cinemaFilms).map(([name,film])=>[name,compact?film.mobile:film])) as NonNullable<typeof selectedFilms>;
 }
 return selectedFilms;
}
const maxBytes=32*1024*1024;
const cacheKey=(film:{url:string;version:string})=>new URL(`${film.url}?v=${film.version}`,location.origin).href;
let cachePromise:Promise<Cache|undefined>|undefined;

async function filmCache(){
 if(!('caches' in window)||!window.isSecureContext)return;
 if(!cachePromise)cachePromise=(async()=>{
  try{
   const cache=await caches.open(cacheName);
   const current=new Set(Object.values(filmSelection()).map(cacheKey));
   await Promise.all((await cache.keys()).filter(key=>!current.has(key.url)).map(key=>cache.delete(key)));
   return cache;
  }catch{return undefined;}
 })();
 return cachePromise;
}

export function conserveCinemaData(){
 const connection=(navigator as Navigator&{connection?:{saveData?:boolean;effectiveType?:string}}).connection;
 return Boolean(connection?.saveData||connection?.effectiveType==='slow-2g'||connection?.effectiveType==='2g');
}

/** Cache Storage may be denied or full. Either condition leaves normal media
 * loading intact. Versioned keys keep a replacement film out of an old cache. */
export async function loadCinemaFilm(name:keyof typeof cinemaFilms,signal:AbortSignal,cacheOnly=false){
 const film=filmSelection()[name],key=cacheKey(film),cache=await filmCache();
 if(signal.aborted)throw new DOMException('Film load cancelled','AbortError');
 if(cache){
  try{
   const stored=await cache.match(key);
   if(stored&&stored.headers.get('x-zereca-film-version')===film.version){
    const blob=await stored.blob();
    if(signal.aborted)throw new DOMException('Film load cancelled','AbortError');
    if(blob.size===film.bytes)return {blob,source:'cache' as const};
    await cache.delete(key);
   }
  }catch(error){if(signal.aborted)throw error;/* Continue through the browser's normal HTTP cache. */}
 }
 if(cacheOnly)return;
 const response=await fetch(key,{credentials:'same-origin',cache:'force-cache',signal});
 if(!response.ok)throw new Error(`Film request failed (${response.status})`);
 const blob=await response.blob();
 if(signal.aborted)throw new DOMException('Film load cancelled','AbortError');
 if(!blob.size)throw new Error('The film response was empty');
 // A changed file remains playable, but is not persisted with a stale version.
 if(cache&&blob.size===film.bytes&&Object.values(filmSelection()).reduce((sum,item)=>sum+item.bytes,0)<=maxBytes){
  const stored=new Response(blob,{headers:{'content-type':'video/mp4','x-zereca-film-version':film.version}});
  // Optional persistent writes never delay decoded-film readiness.
  void cache.put(key,stored).catch(()=>{});
 }
 return {blob,source:'network' as const};
}
