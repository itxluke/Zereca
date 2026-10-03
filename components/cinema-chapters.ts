export type FilmChapterId="threshold"|"devs"|"unclassified"|"records"|"research"|"assembly";
export type FilmChapter = {
 id:FilmChapterId; room:string; label:string; word:string; title:string; subtitle:string;
 start:number; end:number; status:string; note:string; href?:string; link?:string;
};
// One timeline drives the camera, objects, chapter navigation, and text.
export const filmChapters:FilmChapter[] = [
 {id:"threshold",room:"threshold",label:"The Institution",word:"ZERECA",title:"Move|Different.",subtitle:"Software. Sound. Stories. Research.",start:0,end:.15,status:"Independent disciplines. One shared instinct.",note:"A private world, taking shape."},
 {id:"devs",room:"devs-lab",label:"Zereca Devs",word:"DEVS",title:"Order,|disassembled.",subtitle:"Zereca Engine — an Android engine currently in development.",start:.15,end:.39,status:"Ongoing / In development",note:"An engine taking shape.",href:"/work#devs",link:"Read the project notes"},
 {id:"unclassified",room:"atlas",label:"Zereca Unclassified",word:"UNCLASSIFIED",title:"Follow|the thread.",subtitle:"Red Thread Archive. A story world taking shape.",start:.39,end:.56,status:"Ongoing / In development",note:"An original horror anthology, in development.",href:"https://www.youtube.com/@ZerecaUnclassified",link:"Enter the channel"},
 {id:"records",room:"records-chamber",label:"Zereca Records",word:"FREQUENCY",title:"Something|in the silence.",subtitle:"Original music and visual stories from Zereca Records.",start:.56,end:.74,status:"Ongoing / Music",note:"Hear the work on the official Zereca Records channel.",href:"https://www.youtube.com/channel/UC0e5PasL8RErVT1ZHKBYIAA",link:"Listen on YouTube"},
 {id:"research",room:"devs",label:"Zereca Research",word:"UNKNOWN",title:"Beyond|the familiar.",subtitle:"Unfinished possibilities. Experiments, ideas, and open questions.",start:.74,end:.84,status:"Ongoing / Research",note:"Research directions are being explored. No finished result is claimed.",href:"/work#research",link:"Explore the questions"},
 {id:"assembly",room:"threshold",label:"Within Zereca",word:"WITHIN",title:"Still|taking shape.",subtitle:"Something is forming within Zereca. It is not ready to be revealed.",start:.84,end:1,status:"Under construction",note:"The work continues within.",href:"https://discord.gg/kx5AXmVrjV",link:"Enter the community"},
];
export const chapterIndices=Object.fromEntries(filmChapters.map((chapter,index)=>[chapter.id,index])) as Record<FilmChapterId,number>;
export const lastChapterIndex=filmChapters.length-1;
export function chapterAt(progress:number){
 if(progress>=1)return lastChapterIndex;
 return Math.max(0,filmChapters.findIndex(c=>progress>=c.start&&progress<c.end));
}
export function chapterProgress(index:number,progress:number){
 const c=filmChapters[index];return Math.max(0,Math.min(1,(progress-c.start)/(c.end-c.start)));
}
export function resolveChapterId(id:string){return id==="current-work"?"devs":id==="unknown"?"assembly":id;}
export function chapterTarget(id:string){
 const alias=resolveChapterId(id);
 const c=filmChapters.find(c=>c.id===alias)||filmChapters[0];
 return c.start+(c.end-c.start)*.24;
}
