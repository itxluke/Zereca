"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type Props = {
  reduced: boolean;
  ready: boolean;
  progress: number;
  failed: boolean;
  onCinema: () => void;
  onBasic: () => void;
};

export default function ExperienceSelection({ reduced, ready, progress, failed, onCinema, onBasic }: Props) {
  const [mode, setMode] = useState("cinema");
  const root = useRef<HTMLElement>(null);
  const motion = useRef<((x: number, y: number) => void) | null>(null);
  const fraction = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  const percent = Math.round((ready ? 1 : fraction) * 100);

  useEffect(() => {
    const element = root.current;
    if (!element || reduced) return;
    const emblem = element.querySelector(".selection-emblem");
    if (!emblem) return;
    const x = gsap.quickTo(emblem, "x", { duration: 1.2, ease: "power3.out" });
    const y = gsap.quickTo(emblem, "y", { duration: 1.2, ease: "power3.out" });
    motion.current = (horizontal, vertical) => { x(horizontal); y(vertical); };
    return () => {
      motion.current = null;
      x.tween.kill();
      y.tween.kill();
      gsap.set(emblem, { clearProps: "transform" });
    };
  }, [reduced]);

  return (
    <section ref={root} className="experience-selection" aria-labelledby="experience-selection-title" data-reduced={reduced}
      onPointerMove={event => {
        if (event.pointerType !== "mouse" || reduced) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        motion.current?.((event.clientX / bounds.width - .5) * 10, (event.clientY / bounds.height - .5) * 7);
      }}
      onPointerLeave={() => motion.current?.(0, 0)}>
      <div className="selection-scene" aria-hidden="true">
        <picture>
          <source media="(max-width: 760px)" srcSet="/assets/selection/chamber-mobile.webp" />
          <img className="selection-chamber" src="/assets/selection/chamber.webp" width="1672" height="941" alt="" fetchPriority="high" />
        </picture>
        <div className="selection-light" />
        <div className="selection-emblem"><img src="/assets/selection/emblem.webp" width="1534" height="1025" alt="" decoding="async" /></div>
      </div>

      <header className="selection-header">
        <span className="selection-brand"><img src="/assets/zereca-light.svg" width="94" height="94" alt="" /><span>ZERECA</span><i aria-hidden="true" /></span>
        <span className="selection-motto">Move Different.</span>
      </header>

      <div className="selection-content">
        <p className="selection-eyebrow">Select your experience</p>
        <h1 id="experience-selection-title">Enter the<br />world</h1>
        <RadioGroup className="selection-options" aria-label="Choose your experience" value={mode} onValueChange={setMode}
          onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); if (mode === "basic") window.location.assign("/basic"); else onCinema(); } }}>
          {[
            { value: "cinema", number: "01", title: "Cinema", detail: "A journey through the unknown" },
            { value: "basic", number: "02", title: "Basic", detail: "Explore at your own pace" },
          ].map(option => (
            <label className="selection-option" data-selected={mode === option.value} key={option.value} htmlFor={`experience-${option.value}`}>
              <span className="selection-number" aria-hidden="true">{option.number}</span>
              <RadioGroupItem id={`experience-${option.value}`} value={option.value} className={`selection-radio ${option.value === "cinema" ? "boot-option" : ""}`} onFocus={() => setMode(option.value)} aria-label={option.title} aria-describedby={`experience-${option.value}-detail`} />
              <span className="selection-option-copy"><span className="selection-option-title">{option.title}</span><span className="selection-option-detail" id={`experience-${option.value}-detail`}>{option.detail}</span></span>
              <span className="selection-option-frame" aria-hidden="true" />
            </label>
          ))}
        </RadioGroup>
        {mode === "cinema" ? (
          <button className="selection-continue" type="button" onClick={onCinema}><span>Enter cinema</span><span className="selection-continue-seal" aria-hidden="true"><img src="/assets/zereca-light.svg" width="32" height="32" alt="" /></span></button>
        ) : (
          <a className="selection-continue" href="/basic" onClick={onBasic}><span>Enter Basic</span><span className="selection-continue-seal" aria-hidden="true"><img src="/assets/zereca-light.svg" width="32" height="32" alt="" /></span></a>
        )}
      </div>

      <footer className="selection-footer">
        <p className="selection-instructions">Click to select <span aria-hidden="true">·</span> Enter to continue</p>
        <div className="selection-preparation" role="progressbar" aria-label="Preparing the cinematic world" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
          <span className="selection-progress-ring" aria-hidden="true" style={{ "--selection-progress": `${percent}%` } as React.CSSProperties} />
          <p role="status">{failed ? "Basic view is available" : ready ? "World ready" : "Preparing the world"}{!ready && !failed && <span className="selection-percent">{percent}%</span>}</p>
        </div>
        <div className="selection-footer-rule" aria-hidden="true"><i /><img src="/assets/zereca-light.svg" width="40" height="40" alt="" /><i /></div>
      </footer>
    </section>
  );
}
