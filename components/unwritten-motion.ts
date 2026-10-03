import {Vector3,type Material} from 'three';

export type UnwrittenBounds={height:number;minY:number;centerX:number;centerZ:number};
export function createUnwrittenUniforms(bounds:UnwrittenBounds){return{
 uUnwrittenTime:{value:0},uUnwrittenFocus:{value:0},uUnwrittenStrength:{value:1},
 uUnwrittenHeight:{value:bounds.height},uUnwrittenMinY:{value:bounds.minY},
 uUnwrittenCenter:{value:new Vector3(bounds.centerX,0,bounds.centerZ)},
};}
export type UnwrittenUniforms=ReturnType<typeof createUnwrittenUniforms>;

const smooth=(a:number,b:number,value:number)=>{const x=Math.max(0,Math.min(1,(value-a)/(b-a)));return x*x*(3-2*x);};
/** The same deformation drives the GPU surface and the CPU thread attachment. */
export function deformUnwrittenPoint(point:Vector3,bounds:UnwrittenBounds,time:number,focus:number,strength:number,out:Vector3){
 const height=bounds.height,h=(point.y-bounds.minY)/height,nx=(point.x-bounds.centerX)/height;
 const chest=smooth(.48,.65,h)*(1-smooth(.85,.93,h))*(1-smooth(.12,.22,Math.abs(nx)));
 const breath=Math.sin(time*.98)*.008*strength;
 let x=point.x+(point.x-bounds.centerX)*chest*breath;
 let y=point.y+chest*breath*height*.035;
 let z=point.z+(point.z-bounds.centerZ)*chest*breath;
 const arm=smooth(.11,.225,-nx)*smooth(.56,.64,h)*(1-smooth(.78,.86,h));
 const angle=(Math.sin(time*.62)*.008+focus*.006)*strength*arm;
 const pivotX=bounds.centerX-height*.105,pivotY=bounds.minY+height*.745;
 const dx=x-pivotX,dy=y-pivotY,c=Math.cos(angle),s=Math.sin(angle);
 x=pivotX+c*dx-s*dy;y=pivotY+s*dx+c*dy;
 z+=arm*focus*height*.0006*strength;
 const hem=smooth(.06,.14,h)*(1-smooth(.42,.51,h))*smooth(.07,.19,Math.abs(nx));
 z+=Math.sin(time*.47+nx*4)*hem*height*.0009*strength;
 return out.set(x,y,z);
}

const motionShader=`
uniform float uUnwrittenTime, uUnwrittenFocus, uUnwrittenStrength, uUnwrittenHeight, uUnwrittenMinY;
uniform vec3 uUnwrittenCenter;
vec3 unwrittenDeform(vec3 p){
 float h=(p.y-uUnwrittenMinY)/uUnwrittenHeight;
 float nx=(p.x-uUnwrittenCenter.x)/uUnwrittenHeight;
 float chest=smoothstep(.48,.65,h)*(1.-smoothstep(.85,.93,h))*(1.-smoothstep(.12,.22,abs(nx)));
 float breath=sin(uUnwrittenTime*.98)*.008*uUnwrittenStrength;
 vec3 q=p;
 q.x+=(p.x-uUnwrittenCenter.x)*chest*breath;
 q.y+=chest*breath*uUnwrittenHeight*.035;
 q.z+=(p.z-uUnwrittenCenter.z)*chest*breath;
 float arm=smoothstep(.11,.225,-nx)*smoothstep(.56,.64,h)*(1.-smoothstep(.78,.86,h));
 float angle=(sin(uUnwrittenTime*.62)*.008+uUnwrittenFocus*.006)*uUnwrittenStrength*arm;
 vec2 pivot=vec2(uUnwrittenCenter.x-uUnwrittenHeight*.105,uUnwrittenMinY+uUnwrittenHeight*.745);
 vec2 d=q.xy-pivot;
 q.xy=pivot+vec2(cos(angle)*d.x-sin(angle)*d.y,sin(angle)*d.x+cos(angle)*d.y);
 q.z+=arm*uUnwrittenFocus*uUnwrittenHeight*.0006*uUnwrittenStrength;
 float hem=smoothstep(.06,.14,h)*(1.-smoothstep(.42,.51,h))*smoothstep(.07,.19,abs(nx));
 q.z+=sin(uUnwrittenTime*.47+nx*4.)*hem*uUnwrittenHeight*.0009*uUnwrittenStrength;
 return q;
}
`;

/** Clone materials before applying this; cached GLTF materials stay untouched. */
export function applyUnwrittenMotion(material:Material,uniforms:UnwrittenUniforms){
 const previous=material.onBeforeCompile;
 material.onBeforeCompile=(shader,renderer)=>{
  previous.call(material,shader,renderer);Object.assign(shader.uniforms,uniforms);
  shader.vertexShader=motionShader+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed = unwrittenDeform(transformed);');
  // Finite differences transform the normals with the same local deformation.
  shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>',`#include <beginnormal_vertex>
   float unwrittenEpsilon=uUnwrittenHeight*.0001;
   vec3 unwrittenBase=unwrittenDeform(position);
   vec3 unwrittenDx=unwrittenDeform(position+vec3(unwrittenEpsilon,0.,0.))-unwrittenBase;
   vec3 unwrittenDy=unwrittenDeform(position+vec3(0.,unwrittenEpsilon,0.))-unwrittenBase;
   vec3 unwrittenDz=unwrittenDeform(position+vec3(0.,0.,unwrittenEpsilon))-unwrittenBase;
   objectNormal=normalize(cross(unwrittenDy,unwrittenDz)*objectNormal.x+cross(unwrittenDz,unwrittenDx)*objectNormal.y+cross(unwrittenDx,unwrittenDy)*objectNormal.z);
  `);
 };
 material.customProgramCacheKey=()=>`zereca-unwritten-breath-v1:${material.type}`;
 material.needsUpdate=true;
}
