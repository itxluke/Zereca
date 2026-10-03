import type {FilmChapterId} from './cinema-chapters';

export const cinemaFontRequests=[
 '500 32px "Zereca Display"',
 'italic 500 32px "Zereca Display"',
 '500 32px "Zereca Label"',
 '500 32px "Zereca Condensed"',
] as const;

/** Fonts must resolve before a room label is baked into its permanent GPU texture. */
let preparation:Promise<void>|undefined;
export function warmCinemaTypography(){
 return preparation??=Promise.all(cinemaFontRequests.map(font=>document.fonts.load(font))).then(()=>{}).catch(error=>{preparation=undefined;throw error;});
}
export function roomLettering(id:FilmChapterId){
 const technical=id==='devs'||id==='research'||id==='assembly';
 return {family:technical?'"Zereca Condensed", Arial, sans-serif':'"Zereca Display", Georgia, serif',outline:technical||id==='unclassified',color:id==='records'?'#d4c4a7':'#c6bdae'};
}
export function fitRoomLettering(ctx:CanvasRenderingContext2D,word:string,id:FilmChapterId){
 const style=roomLettering(id);
 let size=390;
 ctx.font=`500 ${size}px ${style.family}`;
 while(ctx.measureText(word).width>1960&&size>40){size-=4;ctx.font=`500 ${size}px ${style.family}`;}
 return {...style,size};
}
