export type TracePoint={x:number;y:number};

/** Accept an imperfect, closed ring in either direction, at any position. */
export function isCircleTrace(points:TracePoint[]){
 if(points.length<16)return false;
 const xs=points.map(p=>p.x),ys=points.map(p=>p.y);
 const width=Math.max(...xs)-Math.min(...xs),height=Math.max(...ys)-Math.min(...ys);
 if(Math.min(width,height)<75||width/height<.55||width/height>1.8)return false;
 const center={x:(Math.max(...xs)+Math.min(...xs))/2,y:(Math.max(...ys)+Math.min(...ys))/2};
 const radii=points.map(p=>Math.hypot(p.x-center.x,p.y-center.y));
 const radius=radii.reduce((a,b)=>a+b,0)/radii.length;
 const variation=Math.sqrt(radii.reduce((sum,r)=>sum+(r-radius)**2,0)/radii.length)/radius;
 const closure=Math.hypot(points[0].x-points.at(-1)!.x,points[0].y-points.at(-1)!.y);
 const sectors=new Set(points.map(p=>Math.floor((Math.atan2(p.y-center.y,p.x-center.x)+Math.PI)/(2*Math.PI)*12)%12));
 let travel=0;
 for(let i=1;i<points.length;i++)travel+=Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y);
 return variation<.3&&closure<radius*.65&&sectors.size>=11&&travel>radius*4.6&&travel<radius*11;
}
