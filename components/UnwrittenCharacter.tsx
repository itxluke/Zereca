"use client";
import {useLayoutEffect,useMemo,type MutableRefObject} from 'react';
import {useGLTF} from '@react-three/drei';
import {Material,Matrix4,Mesh,MeshStandardMaterial,PlaneGeometry,PointLight,Vector3,type Texture} from 'three';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {unwrittenModel} from './invitation-room-config';
import {createUnwrittenRigDriver,UNWRITTEN_RIG} from './unwritten-rig-driver';
export type UnwrittenController={update:(time:number,focus:number,strength:number,hand:Vector3,letter:Vector3)=>void};
/** Only repaired upper-body joints move; boots and coat hem remain planted. */
export default function UnwrittenCharacter({controller:controllerRef,crest}:{controller:MutableRefObject<UnwrittenController|null>;crest:Texture}){
 const model=useGLTF(unwrittenModel.url!,false,false);
 const instance=useMemo(()=>{
  const root=clone(model.scene),materials:Material[]=[];root.updateMatrixWorld(true);
  root.traverse(object=>{
   if(!(object instanceof Mesh))return;object.castShadow=true;object.receiveShadow=true;
   const source=Array.isArray(object.material)?object.material:[object.material];
   const copies=source.map(original=>{const copy=original.clone();if(object.name==='Body'&&copy instanceof MeshStandardMaterial)copy.metalness=.16;materials.push(copy);return copy;});
   object.material=Array.isArray(object.material)?copies:copies[0];
  });
  const driver=createUnwrittenRigDriver(root),envelope=root.getObjectByName(unwrittenModel.envelopeNode);
  let sealGeometry:PlaneGeometry|undefined;
  if(envelope){
   const normal=new Vector3(...unwrittenModel.sealNormal).normalize().transformDirection(new Matrix4().copy(envelope.matrixWorld).invert());
   const anchor=driver.getAnchorWorld('EnvelopeSealSurface',new Vector3());envelope.worldToLocal(anchor);
   sealGeometry=new PlaneGeometry(.014,.014);
   const material=new MeshStandardMaterial({map:crest,color:'#c5b9a7',emissive:'#c8946f',emissiveMap:crest,emissiveIntensity:.38,roughness:.76,metalness:.02,transparent:true,alphaTest:.04,depthWrite:false});materials.push(material);
   const seal=new Mesh(sealGeometry,material);seal.name='Zereca_Invitation_Crest';seal.position.copy(anchor).addScaledVector(normal,.0005);
   seal.quaternion.setFromUnitVectors(new Vector3(0,0,1),normal);envelope.add(seal);
   // A tiny warm seal light stays attached to the real letter; it illuminates the offered glove.
   const glow=new PointLight('#c99c76',.035,.42,2);glow.name='Invitation_Seal_Warmth';glow.position.copy(anchor).addScaledVector(normal,.028);envelope.add(glow);
  }
  root.scale.multiplyScalar(unwrittenModel.height/UNWRITTEN_RIG.nativeHeight);
  const update:UnwrittenController['update']=(time,focus,strength,hand,letter)=>{
   driver.update(time,focus,strength,1,1);root.updateWorldMatrix(true,true);
   driver.getAnchorWorld('R_ThreadPinch',hand);driver.getAnchorWorld('EnvelopeSealSurface',letter);
  };
  return {root,update,dispose(){driver.reset();materials.forEach(m=>m.dispose());sealGeometry?.dispose();}};
 },[model,crest]);
 useLayoutEffect(()=>{controllerRef.current=instance;return()=>{controllerRef.current=null;instance.dispose();};},[controllerRef,instance]);
 return <group name="Unwritten_Supplied_Repaired_Rig" position={unwrittenModel.placement}><primitive object={instance.root} dispose={null}/></group>;
}
