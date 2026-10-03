import {PerspectiveCamera,Scene} from "three";
import {CSS3DObject,CSS3DRenderer} from "three/addons/renderers/CSS3DRenderer.js";
const IMAGE={width:1672,height:941},MARK={left:736,top:229,size:200};
const positions=[
 [0,0,0],[.18,12,-52],[.32,112,-180],[.46,236,-358],
 [.515,242,-363],[.60,316,-369],[.73,360,-430],[1,360,-442]
];
function cameraAt(progress:number){let index=0;while(index<positions.length-2&&progress>positions[index+1][0])index++;const a=positions[index],b=positions[index+1];const t=Math.max(0,Math.min(1,(progress-a[0])/(b[0]-a[0])));const eased=t*t*(3-2*t);return {x:a[1]+(b[1]-a[1])*eased,z:a[2]+(b[2]-a[2])*eased};}
function image(src:string,className:string){const node=document.createElement("img");node.src=src;node.alt="";node.draggable=false;node.className=className;return node;}
export function createScene(host:HTMLElement){
 const world=new Scene(),camera=new PerspectiveCamera(45,1,1,5000),renderer=new CSS3DRenderer();
 renderer.domElement.className="room-renderer";renderer.domElement.setAttribute("aria-hidden","true");renderer.domElement.style.pointerEvents="none";host.appendChild(renderer.domElement);
 const opening=document.createElement("div");opening.className="source-surface";opening.style.width=`${IMAGE.width}px`;opening.style.height=`${IMAGE.height}px`;opening.appendChild(image("/assets/threshold.webp","room-photo"));
 const mark=image("/assets/zereca-light.svg","wall-mark");const scan=document.createElement("div");scan.className="wall-scan";
 for(const element of [mark,scan]){element.style.left=`${MARK.left}px`;element.style.top=`${MARK.top}px`;element.style.width=`${MARK.size}px`;element.style.height=`${MARK.size}px`;opening.appendChild(element);}
 const threshold=new CSS3DObject(opening);threshold.position.set(0,0,-1200);world.add(threshold);
 const development=document.createElement("div");development.className="source-surface";development.style.width=`${IMAGE.width}px`;development.style.height=`${IMAGE.height}px`;development.appendChild(image("/assets/devs.webp","room-photo"));
 const devs=new CSS3DObject(development);devs.position.set(360,0,-1630);world.add(devs);
 const edge=document.createElement("div");edge.className="architectural-edge";edge.style.width="90px";edge.style.height="2200px";
 const cropped=image("/assets/threshold.webp","edge-photo");cropped.style.width="20145px";cropped.style.height="11338px";cropped.style.left="-16590px";cropped.style.top="-4300px";edge.appendChild(cropped);
 const jamb=new CSS3DObject(edge);jamb.position.set(240,0,-380);world.add(jamb);
 let last=0,closed=false;
 function draw(progress:number){if(closed)return;last=Math.max(0,Math.min(1,progress));const pos=cameraAt(last);camera.position.set(pos.x,0,pos.z);
  const inDevs=last>=.515;opening.style.visibility=inDevs?"hidden":"visible";development.style.visibility=inDevs?"visible":"hidden";
  edge.style.visibility=last>.645?"hidden":"visible";
  const sweep=Math.max(0,Math.min(1,(last-.015)/.15));scan.style.backgroundPosition=`${140-sweep*210}% center`;scan.style.visibility=last>=.015&&last<=.185?"visible":"hidden";
  renderer.render(world,camera);renderer.domElement.dataset.progress=last.toFixed(5);renderer.domElement.dataset.camera=`${pos.x.toFixed(3)},${pos.z.toFixed(3)}`;
  const a=mark.getBoundingClientRect(),b=scan.getBoundingClientRect();renderer.domElement.dataset.registrationError=String(Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y),Math.abs(a.width-b.width),Math.abs(a.height-b.height)));
 }
 function resize(){const width=host.clientWidth,height=host.clientHeight;if(!width||!height||closed)return;camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height);const planeHeight=2*Math.tan(Math.PI/8)*1200*Math.max(1,camera.aspect/(IMAGE.width/IMAGE.height));const scale=planeHeight/IMAGE.height;threshold.scale.setScalar(scale);devs.scale.setScalar(scale*1.07);draw(last);}
 const observer=new ResizeObserver(resize);observer.observe(host);resize();host.classList.add("scene-ready");
 return {draw,resize,dispose(){closed=true;observer.disconnect();host.classList.remove("scene-ready");world.clear();renderer.domElement.remove();}};
}
