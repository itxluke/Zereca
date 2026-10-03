/** Metres, +Y up, +Z towards the arrival. This manifest also drives offline checks. */
import {Box3,Group,Mesh,Vector3,type Material,type Object3D} from 'three';
export type RoomBox={name:string;size:readonly[number,number,number];position:readonly[number,number,number];material:'stone'|'floor'|'bronze'|'dark'|'light'|'crimson';rotation?:readonly[number,number,number];shadow?:boolean};
/** Enable only after the real user-supplied model exists at its declared asset URL. */
export const invitationRoomAssetAvailability:{book:boolean}={book:true};
export const invitationRoomLayout={
 id:'zereca-unsent-chamber-v2',
 bounds:{width:7,height:4.2,depth:9,thickness:.22,front:3,back:-6},
 arrival:{width:2.6,height:3.1,wallFront:3.22,frameHeight:3.745505,frameDepth:.842189,frameWidth:3.954783,corridorWidth:4.16,corridorDepth:3.6,corridorEnd:6.82},
 hero:{height:1.85,position:[.95,0,-1.2] as const,reserved:{min:[.10,0,-1.92] as const,max:[1.82,2.12,-.45] as const}},
 assets:{panel:'/assets/models/zereca-wall-panel.glb',doorway:'/assets/models/zereca-doorway-fitted.glb',cabinet:'/assets/models/zereca-cabinet-recessed.glb',book:'/assets/models/zereca-book.glb'},
 panels:[{position:[-1.82,.42,-6.002] as const,height:3.2},{position:[1.82,.42,-6.002] as const,height:3.2}],
 doorway:{position:[0,0,3.218] as const,height:3.745505},
 cabinet:{position:[-3.498,0,-3.45] as const,height:1.6,yaw:Math.PI/2,cavityDepth:.35,shelfDepth:.29,shelves:{tops:[.56,.86,1.16] as const,width:.496,centerZ:.2479,thickness:.018}},
 lectern:{position:[-1.55,0,-.88] as const,top:1.06,tilt:.14,bookLength:.46},
 fixtures:[
  {id:'host-key',type:'spot' as const,position:[-.55,3.94,1.02] as const,target:[.95,1.02,-1.2] as const,intensity:820,color:'#f2e5d7',angle:.46,penumbra:.78,shadow:true},
  {id:'ceiling-fill',type:'area' as const,position:[-.72,4.14,-1.85] as const,rotation:[-Math.PI/2,0,0] as const,width:1.22,height:.44,intensity:18,color:'#b5c2d5'},
  {id:'host-rim',type:'area' as const,position:[2.7837,2.29,-3.5985] as const,rotation:[0,Math.PI-.65,0] as const,width:.055,height:2.04,intensity:125,color:'#b56b66'},
  {id:'archive-wash',type:'spot' as const,position:[-2.25,3.95,.2] as const,target:[-2.35,1.03,-2.2] as const,intensity:220,color:'#d6c6b4',angle:.65,penumbra:.65,shadow:false},
  {id:'floor-bounce',type:'area' as const,position:[-.4,4.055,-.62] as const,rotation:[-Math.PI/2,0,0] as const,width:2.4,height:.22,intensity:32,color:'#bdc3cc'},
  {id:'corridor-ceiling',type:'area' as const,position:[0,4.13,4.86] as const,rotation:[-Math.PI/2,0,0] as const,width:1.4,height:.34,intensity:12,color:'#bec3cf'},
  {id:'panel-left',type:'spot' as const,position:[-1.82,3.95,-4.95] as const,target:[-1.82,1.95,-6] as const,intensity:180,color:'#c0bec5',angle:.36,penumbra:.85,shadow:false},
  {id:'panel-right',type:'spot' as const,position:[1.82,3.95,-4.95] as const,target:[1.82,1.95,-6] as const,intensity:180,color:'#c0bec5',angle:.36,penumbra:.85,shadow:false},
 ],
 budget:{fps:60,compactFps:30,maxDpr:1.5,compactDpr:1.25,shadowMap:1024,shadowFps:10,dust:56,compactDust:28,reflection:'one finite PMREM; no live mirror'},
} as const;

/** The structural front wall is a single watertight extruded polygon around a subtracted aperture. */
export const invitationFrontWallPolygon=[[-3.61,0],[-1.3,0],[-1.3,3.1],[1.3,3.1],[1.3,0],[3.61,0],[3.61,4.42],[-3.61,4.42]] as const;

export const invitationShell:readonly RoomBox[]=[
 {name:'Room_Floor_Substrate',size:[7.44,.22,9.44],position:[0,-.11,-1.5],material:'floor'},
 {name:'Room_Ceiling_Substrate',size:[7.44,.22,9.44],position:[0,4.31,-1.5],material:'stone'},
 {name:'Room_Left_Wall',size:[.22,4.42,9.44],position:[-3.61,2.21,-1.5],material:'stone'},
 {name:'Room_Right_Wall',size:[.22,4.42,9.44],position:[3.61,2.21,-1.5],material:'stone'},
 {name:'Room_Back_Wall',size:[7.44,4.42,.22],position:[0,2.21,-6.11],material:'stone'},
 {name:'Corridor_Floor_Substrate',size:[4.6,.22,3.82],position:[0,-.11,4.91],material:'floor'},
 {name:'Corridor_Ceiling_Substrate',size:[4.6,.22,3.82],position:[0,4.31,4.91],material:'stone'},
 {name:'Corridor_Left_Wall',size:[.22,4.42,3.82],position:[-2.19,2.21,4.91],material:'stone'},
 {name:'Corridor_Right_Wall',size:[.22,4.42,3.82],position:[2.19,2.21,4.91],material:'stone'},
 {name:'Corridor_Back_Wall',size:[4.6,4.42,.22],position:[0,2.21,6.93],material:'stone'},
];

export const invitationArchitecture:readonly RoomBox[]=[
 // Attached pilasters, never freestanding columns against an opaque wall.
 {name:'Left_Wall_Pilaster',size:[.16,4.2,.24],position:[-3.422,2.1,-.62],material:'stone'},
 {name:'Right_Wall_Pilaster',size:[.16,4.2,.24],position:[3.422,2.1,-.62],material:'stone'},
 {name:'Back_Skirting',size:[7,.075,.055],position:[0,.0375,-5.978],material:'bronze'},
 {name:'Left_Skirting',size:[.055,.075,9],position:[-3.478,.0375,-1.5],material:'bronze'},
 {name:'Right_Skirting',size:[.055,.075,9],position:[3.478,.0375,-1.5],material:'bronze'},
 {name:'Ceiling_Cross_Beam',size:[7,.115,.29],position:[0,4.146,-.62],material:'stone'},
 {name:'Beam_Floor_Wash_Housing',size:[2.46,.034,.27],position:[-.4,4.077,-.62],material:'bronze'},
 {name:'Beam_Floor_Wash_Emitter',size:[2.4,.006,.22],position:[-.4,4.056,-.62],material:'light'},
 {name:'Left_Panel_Hidden_Mount',size:[.56,2.2,.035],position:[-1.82,1.93,-5.986],material:'dark'},
 {name:'Right_Panel_Hidden_Mount',size:[.56,2.2,.035],position:[1.82,1.93,-5.986],material:'dark'},
 {name:'Ceiling_Key_Rose',size:[.22,.025,.22],position:[-.55,4.1875,1.02],material:'bronze'},
 {name:'Ceiling_Key_Stem',size:[.035,.22,.035],position:[-.55,4.075,1.02],material:'bronze'},
 {name:'Ceiling_Key_Housing',size:[.20,.085,.18],position:[-.55,3.965,1.02],material:'dark'},
 {name:'Archive_Wash_Rose',size:[.2,.025,.2],position:[-2.25,4.1875,.2],material:'bronze'},
 {name:'Archive_Wash_Stem',size:[.035,.22,.035],position:[-2.25,4.075,.2],material:'bronze'},
 {name:'Archive_Wash_Housing',size:[.18,.085,.16],position:[-2.25,3.965,.2],material:'dark'},
 {name:'Ceiling_Fill_Housing',size:[1.28,.055,.49],position:[-.72,4.1725,-1.85],material:'bronze'},
 {name:'Ceiling_Fill_Emitter',size:[1.22,.008,.44],position:[-.72,4.141,-1.85],material:'light'},
 {name:'Corridor_Light_Housing',size:[1.46,.055,.39],position:[0,4.1725,4.86],material:'bronze'},
 {name:'Corridor_Light_Emitter',size:[1.4,.008,.34],position:[0,4.141,4.86],material:'light'},
 {name:'Left_Grazer_Housing',size:[.18,.20,.15],position:[-1.82,4.10,-4.95],material:'dark'},
 {name:'Right_Grazer_Housing',size:[.18,.20,.15],position:[1.82,4.10,-4.95],material:'dark'},
 {name:'Narrow_Rim_Emitter',size:[.055,2.04,.014],position:[2.7843,2.29,-3.5994],rotation:[0,-.65,0],material:'crimson'},
 {name:'Rim_Luminaire_Support',size:[.073,3.33,.045],position:[2.8,1.663,-3.62],rotation:[0,-.65,0],material:'dark'},
 {name:'Rim_Luminaire_Floor_Foot',size:[.25,.032,.16],position:[2.8,.015,-3.62],rotation:[0,-.65,0],material:'dark'},
];

/** Pure normalisation shared by runtime and actual-model checks; source geometry stays untouched. */
export function prepareInvitationProp(source:Object3D,height:number,flat=false){
 if(!Number.isFinite(height)||height<=0)throw new Error('Invitation prop height must be positive metres.');
 const object=source.clone(true),materials:Material[]=[];object.updateMatrixWorld(true);
 const nativeBounds=new Box3().setFromObject(object,true),size=nativeBounds.getSize(new Vector3()),scale=height/Math.max(.001,size.y);
 object.scale.multiplyScalar(scale);object.updateMatrixWorld(true);const box=new Box3().setFromObject(object,true),center=box.getCenter(new Vector3());
 object.position.x-=center.x;object.position.y-=box.min.y;object.position.z-=flat?center.z:box.min.z;
 let result:Object3D=object;
 if(flat){const group=new Group();group.add(object);group.rotation.x=-Math.PI/2;group.updateMatrixWorld(true);const flatBox=new Box3().setFromObject(group,true),flatCenter=flatBox.getCenter(new Vector3());group.position.set(-flatCenter.x,-flatBox.min.y,-flatCenter.z);result=group;}
 result.traverse(item=>{if(item instanceof Mesh){item.castShadow=true;item.receiveShadow=true;const sourceMaterials=Array.isArray(item.material)?item.material:[item.material];const copies=sourceMaterials.map(m=>{const copy=m.clone();materials.push(copy);return copy;});item.material=Array.isArray(item.material)?copies:copies[0];}});
 result.updateMatrixWorld(true);return{object:result,materials,nativeBounds,scale,bounds:new Box3().setFromObject(result,true)};
}
