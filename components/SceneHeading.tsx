type Props={title:string;level:1|2};

/** Only the solid ink is announced. The displaced outline is a decorative depth layer. */
export default function SceneHeading({title,level}:Props){
 const Heading=level===1?'h1':'h2';
 return <Heading className="scene-title" aria-label={title.replace(/\|/g,' ')}>{title.split('|').map((line,index)=><span className={`scene-title-line ${index===1?'scene-title-response':''}`} key={index}>
  <span className="scene-title-echo" aria-hidden="true">{line}</span>
  {index===1?<em className="scene-title-ink">{line}</em>:<span className="scene-title-ink">{line}</span>}
 </span>)}</Heading>;
}
