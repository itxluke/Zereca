import Institution from "@/components/Institution";
import {filmChapters} from "@/components/cinema-chapters";

export default function Home() { return <>
  <Institution />
  <noscript>
    <style>{`.boot-entrance,.institution{display:none!important}.no-script-world{padding:64px 8%;max-width:1000px}.no-script-world section{padding:32px 0}.no-script-world h1,.no-script-world h2{margin-bottom:20px}.no-script-world a{text-decoration:underline}`}</style>
    <main className="no-script-world">
      <h1>Zereca — Move Different.</h1>
      <p>Software. Sound. Stories. Research. Independent disciplines. One shared instinct.</p>
      {filmChapters.filter(chapter=>!["threshold","unknown","assembly"].includes(chapter.id)).map(chapter=><section key={chapter.id}>
        <h2>{chapter.label}</h2><p>{chapter.subtitle}</p><p>{chapter.status}</p>
        {chapter.href&&<a href={chapter.href}>{chapter.link}</a>}
      </section>)}
      <p><a href="/work">Read ongoing and completed project notes</a></p>
      <p><a href="https://discord.gg/kx5AXmVrjV">Join Zereca on Discord</a></p>
    </main>
  </noscript>
</>; }
