import Link from 'next/link';
import {zereca} from '@/components/zereca-brand';
import {exhibits} from '@/components/exhibits';
import './basic.css';
export const metadata={title:'Zereca — The Work',description:zereca.description,alternates:{canonical:'/basic'},openGraph:{title:'Zereca — The Work',description:zereca.description,url:`${zereca.origin}/basic`}};
export default function Basic(){return <main className="basic-world">
 <header className="basic-header"><Link prefetch={false} href="/" className="brand"><img src="/assets/zereca-light.svg" alt="" width="36" height="36"/>ZERECA</Link><nav aria-label="Zereca navigation"><Link prefetch={false} href="/">Cinema</Link><Link prefetch={false} href="/work">The journal</Link><a href={zereca.discord} target="_blank" rel="noopener noreferrer">Discord</a></nav></header>
 <section className="basic-introduction"><p className="eyebrow">WITHIN ZERECA</p><h1>Software.<br/><em>Stories. Sound.</em></h1><p>The work, at your own pace.</p></section>
 <section className="basic-projects" aria-labelledby="basic-projects-title"><h2 id="basic-projects-title">Ongoing work</h2>{exhibits.filter(item=>item.group==='ongoing'&&item.id!=='unknown').map(item=><article id={item.id} key={item.id}><p className="eyebrow">{item.discipline}</p><h3>{item.title}</h3><span className="basic-status">{item.status}</span><p>{item.summary}</p><a href={item.href||`/work#${item.id}`} target={item.href?.startsWith('https')?'_blank':undefined} rel={item.href?.startsWith('https')?'noopener noreferrer':undefined}>{item.linkLabel||'Read the project notes'}</a></article>)}</section>
 <section className="basic-completed" aria-labelledby="basic-completed-title"><h2 id="basic-completed-title">Completed studies</h2>{exhibits.filter(item=>item.group==='completed').map(item=><article key={item.id}><h3>{item.title}</h3><p>{item.summary}</p><Link prefetch={false} href={`/work#${item.id}`}>View the study</Link></article>)}</section>
 <section className="basic-invitation"><p className="eyebrow">THE NEXT DOOR</p><h2>You’re expected.</h2><p>The work continues inside Zereca.</p><a href={zereca.discord} target="_blank" rel="noopener noreferrer">Join Zereca on Discord</a></section>
 <footer className="basic-footer"><span>ZERECA · Move Different.</span><nav aria-label="Zereca channels"><a href={zereca.instagram} target="_blank" rel="noopener noreferrer">Instagram</a><a href={zereca.unclassified} target="_blank" rel="noopener noreferrer">Unclassified</a><a href={zereca.records} target="_blank" rel="noopener noreferrer">Records</a></nav></footer>
 </main>;}
