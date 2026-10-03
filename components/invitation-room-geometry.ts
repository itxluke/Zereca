import {BufferGeometry,Float32BufferAttribute,PlaneGeometry,Vector3} from 'three';

/** A folded architectural surface, with actual relief rather than a flat image. */
export function createObsidianFold(width:number,height:number,seed:number,bend=0){
 const geometry=new PlaneGeometry(width,height,48,64),positions=geometry.attributes.position;
 for(let i=0;i<positions.count;i++){
  const x=positions.getX(i),v=(positions.getY(i)+height/2)/height,u=x/width+.5;
  const ridge=Math.sin(u*Math.PI*8+v*1.8+seed)*.29+Math.sin(u*Math.PI*19-v*2.3+seed)*.065;
  const fracture=Math.sin(u*71+v*39+seed)*Math.sin(v*32-u*13)*.026;
  positions.setXYZ(i,x+bend*v*v+Math.sin(v*5+seed)*.16,v*height,ridge+fracture+Math.sin(v*3+seed)*.2);
 }
 geometry.computeVertexNormals();geometry.computeBoundingBox();return geometry;
}
export function createFlapGeometry(){
 const geometry=new BufferGeometry();
 geometry.setAttribute('position',new Float32BufferAttribute([-.51,.33,0,0,-.08,.022,.51,.33,0],3));
 geometry.computeVertexNormals();return geometry;
}
const segments=36,sides=6;
export function createThreadGeometry(){
 const geometry=new BufferGeometry(),positions=new Float32Array((segments+1)*sides*3),indices:number[]=[];
 for(let i=0;i<segments;i++)for(let s=0;s<sides;s++){const a=i*sides+s,b=i*sides+(s+1)%sides,c=(i+1)*sides+s,d=(i+1)*sides+(s+1)%sides;indices.push(a,c,b,b,c,d);}
 geometry.setAttribute('position',new Float32BufferAttribute(positions,3));geometry.setIndex(indices);
 writeThreadGeometry(geometry,new Vector3(1.78,4.81,.13),new Vector3(1.7,4.18,.49));return geometry;
}
export function writeThreadGeometry(geometry:BufferGeometry,hand:Vector3,letter:Vector3){
 const positions=geometry.attributes.position;
 for(let i=0;i<=segments;i++){
  const t=i/segments,curve=Math.sin(Math.PI*t);
  const x=hand.x*(1-t)+letter.x*t+curve*.055,y=hand.y*(1-t)+letter.y*t-curve*.1,z=hand.z*(1-t)+letter.z*t+curve*.075;
  for(let s=0;s<sides;s++){const angle=s/sides*Math.PI*2;positions.setXYZ(i*sides+s,x+Math.cos(angle)*.006,y,z+Math.sin(angle)*.006);}
 }
 positions.needsUpdate=true;geometry.computeBoundingSphere();
}
