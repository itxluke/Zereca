import {filmChapters,chapterProgress,lastChapterIndex} from './cinema-chapters';
const smooth=(x:number)=>{const v=Math.max(0,Math.min(1,x));return v*v*(3-2*v);};
// The living field and invitation share the closing room. No extra scene or fast zoom.
export function invitationPhase(progress:number){
 const p=Number.isFinite(progress)?Math.max(0,Math.min(1,progress)):0;
 const chapter=filmChapters[lastChapterIndex];
 const local=chapterProgress(lastChapterIndex,p);
 const reveal=p<chapter.start?0:smooth((local-.46)/.24);
 return{reveal,active:reveal>=.5};
}
export function invitationTarget(){const c=filmChapters[lastChapterIndex];return c.start+(c.end-c.start)*.84;}
