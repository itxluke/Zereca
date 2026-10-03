import { CatmullRomCurve3, Group, PerspectiveCamera, Scene, Vector3 } from "three";
import { CSS3DObject, CSS3DRenderer } from "three/addons/renderers/CSS3DRenderer.js";
import { chapterAt, chapterProgress, filmChapters, chapterIndices } from "./cinema-chapters";
import { fitRoomLettering,roomLettering,warmCinemaTypography } from "./cinema-typography";

const ROOM = 2400;
const clamp = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
const smooth = (value: number) => { const x = clamp(value); return x * x * (3 - 2 * x); };
const rows = [[144, 320], [377, 574], [630, 825], [879, 1079], [1129, 1338]];
const roomSources = filmChapters.map(chapter => chapter.room);
type Style = Partial<CSSStyleDeclaration>;

/** A perspective DOM renderer for the same progress-driven architectural film.
 * Images stay decoded and mounted throughout room changes; only their visibility
 * changes. There is no independent animation clock or photograph crossfade. */
export async function createCinemaDomScene(host: HTMLElement, signal?: AbortSignal) {
  const aborted = () => new DOMException("The cinematic host was unmounted.", "AbortError");
  if (signal?.aborted || !host.isConnected) throw aborted();
  const controller = new AbortController();
  const mountObserver = new MutationObserver(() => {
    if (!host.isConnected) dispose();
  });
  mountObserver.observe(host.ownerDocument.documentElement, { childList: true, subtree: true });
  let renderer: CSS3DRenderer | undefined;
  let observer: ResizeObserver | undefined;
  let disposed = false;
  let progress = 0;
  let invitation = 0;
  const elements: HTMLElement[] = [];
  const images: HTMLImageElement[] = [];
  let clearWorld = () => {};
  let mounted = false;
  function dispose() {
    if (disposed) return;
    disposed = true;
    signal?.removeEventListener("abort", dispose);
    controller.abort(); mountObserver.disconnect(); observer?.disconnect();
    elements.forEach(element => element.remove()); clearWorld(); renderer?.domElement.remove();
    if (mounted && host.dataset.renderer === "css3d" && !host.querySelector(".film-renderer")) {
      host.classList.remove("scene-ready");
      for (const key of ["renderer", "progress", "chapter", "camera", "disassemblyFrame", "transition", "invitation"]) delete host.dataset[key];
    }
    images.length = 0; elements.length = 0;
  }
  signal?.addEventListener("abort", dispose, { once: true });

  function preload(path: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      images.push(image);
      image.decoding = "async";
      let settled = false;
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        image.onload = null;
        image.onerror = null;
        controller.signal.removeEventListener("abort", cancel);
        if (error) reject(error); else resolve(image);
      };
      const cancel = () => { image.removeAttribute("src"); finish(aborted()); };
      image.onerror = () => finish(new Error(`Cinema image could not be loaded: ${path}`));
      image.onload = () => {
        if (!image.naturalWidth) { finish(new Error(`Cinema image is empty: ${path}`)); return; }
        const decoded = typeof image.decode === "function" ? image.decode() : Promise.resolve();
        decoded.then(() => finish(controller.signal.aborted ? aborted() : undefined), () => finish(new Error(`Cinema image could not be decoded: ${path}`)));
      };
      controller.signal.addEventListener("abort", cancel, { once: true });
      if (controller.signal.aborted) cancel(); else image.src = path;
    });
  }

  try {
    if (signal?.aborted) { dispose(); throw aborted(); }
    const paths = [...new Set([
      ...roomSources.map(source => `/assets/${source}.webp`),
      "/assets/zereca-light.svg", "/assets/zereca-badge.svg", "/assets/software-core-atlas.webp",
      "/assets/archive-study.webp", "/assets/archive-chamber.webp",
    ])];
    await Promise.all([...paths.map(preload),warmCinemaTypography()]);
    if (controller.signal.aborted || !host.isConnected) throw aborted();
    mountObserver.disconnect();

    const world = new Scene();
    clearWorld = () => world.clear();
    const camera = new PerspectiveCamera(43, 1, 1, 8500);
    renderer = new CSS3DRenderer();
    const render = renderer;
    render.domElement.className = "film-renderer film-dom-renderer";
    render.domElement.setAttribute("aria-hidden", "true");
    Object.assign(render.domElement.style, { background: "#0b0b0d", pointerEvents: "none" });

    const plane = (width: number, height: number, name: string, style: Style = {}) => {
      const element = document.createElement("div");
      element.className = "film-dom-plane";
      element.dataset.filmObject = name;
      Object.assign(element.style, {
        width: `${width}px`, height: `${height}px`, boxSizing: "border-box",
        backfaceVisibility: "hidden", backgroundRepeat: "no-repeat", backgroundSize: "100% 100%",
        ...style,
      });
      const object = new CSS3DObject(element);
      // CSS3DObject sets this to auto, while the film's accessible controls live
      // outside the renderer. None of its photographic surfaces captures input.
      element.style.pointerEvents = "none";
      elements.push(element);
      return object;
    };
    const photo = (width: number, height: number, path: string, name: string) =>
      plane(width, height, name, { backgroundImage: `url("${path}")` });
    const inset = (parent: HTMLElement, style: Style, path?: string) => {
      const element = document.createElement("div");
      Object.assign(element.style, {
        position: "absolute", pointerEvents: "none", backgroundRepeat: "no-repeat",
        backgroundSize: "100% 100%", ...(path ? { backgroundImage: `url("${path}")` } : {}), ...style,
      });
      parent.appendChild(element);
      return element;
    };
    const cuboid = (width: number, height: number, depth: number, name: string, color = "#17171a") => {
      const group = new Group();
      const face = (w: number, h: number, side: string, fill: string) => {
        const object = plane(w, h, `${name}-${side}`, { background: fill, border: "1px solid #ffffff08" });
        group.add(object);
        return object;
      };
      const front = face(width, height, "front", `linear-gradient(112deg,#ffffff09,transparent 48%),${color}`);
      front.position.z = depth / 2;
      const back = face(width, height, "back", color);
      back.position.z = -depth / 2; back.rotation.y = Math.PI;
      const left = face(depth, height, "left", "#101013");
      left.position.x = -width / 2; left.rotation.y = -Math.PI / 2;
      const right = face(depth, height, "right", "#202024");
      right.position.x = width / 2; right.rotation.y = Math.PI / 2;
      const top = face(width, depth, "top", "#343339");
      top.position.y = height / 2; top.rotation.x = -Math.PI / 2;
      const bottom = face(width, depth, "bottom", "#0f0f12");
      bottom.position.y = -height / 2; bottom.rotation.x = Math.PI / 2;
      return { group, front };
    };
    const word = (text: string, width: number, height: number, index: number) => {
      const object = plane(width, height, `word-${filmChapters[index].id}`, { color: "#b5aea0", opacity: index === 0 ? ".13" : ".23" });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      const lettering=context?fitRoomLettering(context,text,filmChapters[index].id):{...roomLettering(filmChapters[index].id),size:390};
      const type = document.createElement("span");
      type.textContent = text;
      Object.assign(type.style, {
        position: "absolute", inset: "0", display: "flex", justifyContent: "center", alignItems: "center",
        whiteSpace: "nowrap", fontFamily: lettering.family, fontWeight: "500",
        fontSize: `${lettering.size * width / 2048}px`, lineHeight: "1", letterSpacing: "0",
        color:lettering.outline?"transparent":lettering.color,
        webkitTextStroke:lettering.outline?`1.2px ${lettering.color}`:"0px",
      });
      object.element.appendChild(type);
      return object;
    };
    const rooms: Group[] = [];
    const words: CSS3DObject[] = [];
    const pillars: Group[] = [];
    const photos: CSS3DObject[] = [];
    const plinths: Group[] = [];
    for (let i = 0; i < filmChapters.length; i++) {
      const room = new Group();
      room.position.x = i * ROOM; world.add(room); rooms.push(room);
      const wall = photo(2550, 1435, `/assets/${roomSources[i]}.webp`, `room-${filmChapters[i].id}`);
      wall.position.z = -1280; room.add(wall); photos.push(wall);
      const floor = cuboid(2400, 12, 1700, `room-floor-${i}`, "#101013");
      floor.group.position.set(0, -710, -360); room.add(floor.group);
      const ceiling = cuboid(2400, 12, 1700, `room-ceiling-${i}`, "#151518");
      ceiling.group.position.set(0, 710, -360); room.add(ceiling.group);
      const giant = word(filmChapters[i].word, i === chapterIndices.unclassified ? 2180 : 1750, i === chapterIndices.unclassified ? 545 : 437, i);
      giant.position.set(i === 0 ? 0 : 240, 160, -770); room.add(giant); words.push(giant);
      if (i === chapterIndices.devs) {
        const base = new Group(); room.add(base); plinths.push(base);
        const plinth = cuboid(580, 95, 230, `plinth-${i}`, "#141417");
        base.add(plinth.group);
        const trim = cuboid(582, 2, 232, `plinth-trim-${i}`, "#777165");
        trim.group.position.y = 48; base.add(trim.group);
      }
      if (i < filmChapters.length - 1) {
        const divider = cuboid(850, 2500, 220, `divider-${i}`, "#141416");
        Object.assign(divider.front.element.style, {
          backgroundImage: "url(\"/assets/archive-chamber.webp\")",
          backgroundSize: "4442.295px 2500px", backgroundPosition: "-3368.23px 0px",
        });
        // Its opaque front is at z=-100 and covers the lens during the lateral
        // passage. It is a physical obstruction, never an opacity transition.
        divider.group.position.set(i * ROOM + ROOM / 2, 0, -210);
        const seam = plane(2, 2500, `divider-seam-${i}`, { background: i === chapterIndices.devs || i === chapterIndices.unclassified ? "#512025" : "#57534b" });
        seam.position.set(-425, 0, 111); divider.group.add(seam);
        world.add(divider.group); pillars.push(divider.group);
      }
    }

    const mark = photo(305, 305, "/assets/zereca-light.svg", "threshold-canonical-crest");
    mark.position.set(-4, 214, -1278); mark.element.style.opacity = ".8"; rooms[chapterIndices.threshold].add(mark);
    const core = new Group();
    core.position.z = -650; rooms[chapterIndices.devs].add(core);
    const layers = rows.map(([start, end], i) => {
      const layer = plane(700, 700 * (end - start) / 1122, `software-layer-${i + 1}`, {
        overflow: "hidden", backgroundImage: "url(\"/assets/software-core-atlas.webp\")",
        backgroundSize: "700px 874.689px", backgroundPosition: `0px ${-start * 700 / 1122}px`,
      });
      core.add(layer); return layer;
    });
    const witness = photo(770, 433, "/assets/archive-study.webp", "archive-study");
    witness.position.z = -750; witness.rotation.y = -.06; rooms[chapterIndices.unclassified].add(witness);
    const archiveEdge = cuboid(125, 2000, 130, "archive-photographic-column", "#242326");
    Object.assign(archiveEdge.front.element.style, {
      backgroundImage: "url(\"/assets/archive-chamber.webp\")",
      backgroundSize: "3553.6667px 2000px", backgroundPosition: "-2695.0053px 0px",
    });
    archiveEdge.group.position.set(740, 0, -440); rooms[chapterIndices.unclassified].add(archiveEdge.group);
    const research = new Group();
    research.position.z = -700; rooms[chapterIndices.research].add(research);
    const panels = [0, 1, 2].map(i => {
      const panel = cuboid(140, 260, 4, `research-panel-${i}`, "#333338");
      panel.group.position.set((i - 1) * 138, -20 + i * 20, -i * 70);
      panel.group.rotation.y = -.25 + i * .1; research.add(panel.group); return panel.group;
    });

    // The final invitation is an architectural leaf with a real hinge and six
    // opaque faces. Its only crest is the canonical source SVG, on the leaf.
    const portal = new Group();
    portal.position.z = -750; rooms[chapterIndices.assembly].add(portal);
    const reveal = plane(420, 830, "invitation-door-reveal", { background: "linear-gradient(90deg,#171318,#322528)" });
    reveal.position.set(250, -20, -35); portal.add(reveal);
    for (const [x, name] of [[22, "left"], [478, "right"]] as const) {
      const jamb = cuboid(18, 868, 55, `invitation-jamb-${name}`, "#303035");
      jamb.group.position.set(x, -20, 0); portal.add(jamb.group);
    }
    const lintel = cuboid(456, 18, 55, "invitation-lintel", "#303035");
    lintel.group.position.set(250, 414, 0); portal.add(lintel.group);
    const hinge = new Group();
    hinge.position.set(40, -20, 0); portal.add(hinge);
    const leaf = cuboid(420, 830, 34, "invitation-leaf", "#1b1b20");
    leaf.group.position.x = 210; hinge.add(leaf.group);
    inset(leaf.front.element, { left: "152.5px", top: "212.5px", width: "115px", height: "115px", opacity: ".8" }, "/assets/zereca-light.svg");
    inset(leaf.front.element, { right: "33.5px", top: "444px", width: "3px", height: "62px", background: "linear-gradient(90deg,#5f5c57,#c1b8a7,#69665e)", boxShadow: "2px 0 0 #050506" });
    inset(leaf.front.element, { inset: "12px", border: "1px solid #c0b49b17" });

    const entry = .74;
    const entryX = Math.sin(entry * Math.PI) * 35;
    const entryY = Math.sin(entry * Math.PI) * 5;
    const tracks = filmChapters.slice(0, -1).map((_, i) => new CatmullRomCurve3([
      new Vector3(i * ROOM + entryX, entryY, 100 - entry * 40),
      new Vector3(i * ROOM + 460, 20, 60),
      new Vector3(i * ROOM + ROOM / 2, 10, 105),
      new Vector3((i + 1) * ROOM - 430, -12, 35),
      new Vector3((i + 1) * ROOM, 0, 100),
    ], false, "centripetal"));
    const target = new Vector3();
    const show = (group: Group, visible: boolean) => {
      if (group.userData.filmVisible === visible) return;
      group.userData.filmVisible = visible;
      group.visible = visible;
      group.traverse(object => {
        if (object instanceof CSS3DObject) object.element.style.visibility = visible ? "visible" : "hidden";
      });
    };
    function draw(value: number) {
      if (disposed) return;
      progress = clamp(value);
      const index = progress >= 1 ? filmChapters.length - 1 : chapterAt(progress);
      const local = chapterProgress(index, progress);
      const passage = index < filmChapters.length - 1 ? smooth((local - entry) / (1 - entry)) : 0;
      if (passage > 0) camera.position.copy(tracks[index].getPoint(passage));
      else camera.position.set(index * ROOM + Math.sin(local * Math.PI) * 35, Math.sin(local * Math.PI) * 5, 100 - local * 40);
      target.set(camera.position.x + Math.sin(passage * Math.PI) * 95, 0, camera.position.z - 1200);
      camera.lookAt(target);
      rooms.forEach((room, i) => show(room, i === index || i === index + 1));
      pillars.forEach((pillar, i) => show(pillar, i === index));
      words.forEach((giant, i) => { giant.position.y = 160 + (i === index ? local * 26 : 0); });
      const frame = Math.round(clamp((chapterProgress(chapterIndices.devs, progress) - .07) / .62) * 36);
      const q = frame / 36;
      const spread = 148 * smooth(q / .42) * (1 - smooth((q - .75) / .25));
      layers.forEach((layer, i) => {
        layer.position.set(Math.sin(q * Math.PI) * i * 13, 35 - i * 9 + (2 - i) * spread, -i * 25 + Math.sin(q * Math.PI) * i * 10);
        layer.rotation.set(0, Math.sin(q * Math.PI) * (.04 + i * .035), Math.sin(q * Math.PI) * (.007 * (i - 2)));
      });
      panels.forEach((panel, i) => { panel.position.z = -i * 70 + Math.sin(chapterProgress(chapterIndices.research, progress) * Math.PI) * (i - 1) * 60; });
      mark.element.style.filter = `brightness(${.86 + Math.sin(chapterProgress(chapterIndices.threshold, progress) * Math.PI) * .14})`;
      hinge.rotation.y = -invitation * .72;
      render.render(world, camera);
      host.dataset.progress = progress.toFixed(5);
      host.dataset.chapter = filmChapters[index].id;
      host.dataset.camera = camera.position.toArray().map(value => value.toFixed(2)).join(",");
      host.dataset.disassemblyFrame = String(frame);
      host.dataset.transition = passage > 0 ? "passage" : "room";
      host.dataset.renderer = "css3d";
      host.dataset.invitation = invitation.toFixed(3);
    }
    function resize() {
      if (disposed || !host.isConnected) return;
      const width = Math.max(1, host.clientWidth), height = Math.max(1, host.clientHeight);
      camera.aspect = width / height; camera.fov = camera.aspect < 1.1 ? 55 : 43;
      camera.updateProjectionMatrix(); render.setSize(width, height);
      const mobile = camera.aspect < .85;
      const extent = (z: number) => {
        const viewH = 2 * Math.tan(camera.fov * Math.PI / 360) * (100 - z);
        return { viewH, viewW: viewH * camera.aspect };
      };
      const fit = (object: Group | CSS3DObject, w: number, h: number, desktopW: number, desktopH: number, mobileW: number, mobileH: number) => {
        const { viewH, viewW } = extent(object.position.z);
        object.scale.setScalar(Math.min(viewW * (mobile ? mobileW : desktopW) / w, viewH * (mobile ? mobileH : desktopH) / h));
        object.position.x = mobile ? 0 : viewW * .24;
        object.position.y = mobile ? viewH * .24 : 20;
      };
      fit(core, 700, 740, .46, .57, .75, .25);
      fit(witness, 770, 433, .47, .65, .83, .27);
      const portalExtent = extent(-750);
      fit(research, 460, 320, .35, .6, .7, .23);
      const doorScale = Math.min(portalExtent.viewW * (mobile ? .7 : .33) / 456, portalExtent.viewH * (mobile ? .33 : .83) / 868);
      portal.scale.setScalar(doorScale);
      portal.position.x = (mobile ? 0 : portalExtent.viewW * .24) - 250 * doorScale;
      portal.position.y = (mobile ? portalExtent.viewH * .24 : 20) + 20 * doorScale;
      const edgeExtent = extent(-440);
      archiveEdge.group.position.x = edgeExtent.viewW * .52;
      archiveEdge.group.scale.x = mobile ? .4 : 1;
      const backdropScale = Math.max(1, 2 * Math.tan(camera.fov * Math.PI / 360) * 1380 * camera.aspect / 2450);
      photos.forEach(wall => wall.scale.setScalar(backdropScale));
      mark.scale.setScalar(backdropScale); mark.position.set(-4 * backdropScale, 214 * backdropScale, -1278);
      plinths.forEach((base, i) => {
        const object = core;
        base.scale.setScalar(object.scale.x * .75);
        base.position.set(object.position.x, mobile ? -355 : -390, -880);
      });
      draw(progress);
    }
    if (disposed || controller.signal.aborted || !host.isConnected) { dispose(); throw aborted(); }
    host.appendChild(render.domElement);
    mounted = true;
    observer = new ResizeObserver(resize); observer.observe(host);
    resize();
    if (disposed || controller.signal.aborted || !host.isConnected) { dispose(); throw aborted(); }
    host.classList.add("scene-ready");
    return { draw, resize, dispose, setInvitation(value: number) { invitation = clamp(value); draw(progress); } };
  } catch (error) {
    dispose();
    throw error;
  }
}
