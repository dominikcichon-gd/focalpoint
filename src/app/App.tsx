import { useState, useId, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type FocalX = "left" | "center" | "right";
type FocalY = "top" | "center" | "bottom";
type HeroLayout = "A" | "B";
type ImageSlot = "desktop" | "mobile";

interface ImageDef {
  slot: ImageSlot;
  url: string;
  thumbUrl: string;
  nat: { w: number; h: number };
  alt: string;
}

// ─── Image definitions ────────────────────────────────────────────────────────

const DESKTOP_IMG: ImageDef = {
  slot: "desktop",
  url: "https://images.unsplash.com/photo-1471506480208-91b3a4cc78be?w=3000&auto=format&fit=crop",
  thumbUrl: "https://images.unsplash.com/photo-1471506480208-91b3a4cc78be?w=400&auto=format&fit=crop",
  nat: { w: 4214, h: 2799 },
  alt: "Cyclist on winding mountain road at dusk — wide landscape",
};

const MOBILE_IMG: ImageDef = {
  slot: "mobile",
  url: "https://images.unsplash.com/photo-1603613991118-95642daecd36?w=2000&auto=format&fit=crop",
  thumbUrl: "https://images.unsplash.com/photo-1603613991118-95642daecd36?w=400&auto=format&fit=crop",
  nat: { w: 4000, h: 6000 },
  alt: "Mountain biker on red trail — portrait composition",
};

// ─── Constants ────────────────────────────────────────────────────────────────

const BREAKPOINT = 1024;
const MIN_W = 365;
const MAX_W = 1276;
const HERO_H = 600;
const ACCENT = "#5B6CFF";

const FX: Record<FocalX, number> = { left: 0.2, center: 0.5, right: 0.8 };
const FY: Record<FocalY, number> = { top: 0.2, center: 0.5, bottom: 0.8 };
const FOCAL_XS: FocalX[] = ["left", "center", "right"];
const FOCAL_YS: FocalY[] = ["top", "center", "bottom"];

const LABEL: Record<FocalX, Record<FocalY, string>> = {
  left:   { top: "Top Left",    center: "Centre Left",  bottom: "Bottom Left"   },
  center: { top: "Top Centre",  center: "Centre",       bottom: "Bottom Centre" },
  right:  { top: "Top Right",   center: "Centre Right", bottom: "Bottom Right"  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function vpT(w: number) { return Math.max(0, Math.min(1, (w - MIN_W) / (MAX_W - MIN_W))); }
function fluidMargin(w: number) { return Math.round(lerp(17, 44, vpT(w))); }
function opCSS(fx: FocalX, fy: FocalY) { return `${Math.round(FX[fx] * 100)}% ${Math.round(FY[fy] * 100)}%`; }

function miniMapData(cW: number, cH: number, fx: number, fy: number, nat: { w: number; h: number }) {
  const imgAspect = nat.w / nat.h;
  const miniW = 148;
  const miniH = Math.round(miniW / imgAspect);

  const coverScale = Math.max(cW / nat.w, cH / nat.h);
  const imgW = nat.w * coverScale;
  const imgH = nat.h * coverScale;
  const imgX = fx * (cW - imgW);
  const imgY = fy * (cH - imgH);

  const visX = -imgX / coverScale;
  const visY = -imgY / coverScale;
  const visW = cW / coverScale;
  const visH = cH / coverScale;
  const s = miniW / nat.w;

  return {
    miniW, miniH,
    cropX: visX * s, cropY: visY * s,
    cropW: visW * s, cropH: visH * s,
    dotX: fx * miniW, dotY: fy * miniH,
  };
}

// ─── Slider CSS ───────────────────────────────────────────────────────────────

const SLIDER_CSS = `
  .vp-slider { -webkit-appearance: none; width: 100%; height: 2px;
    border-radius: 1px; outline: none; cursor: pointer; }
  .vp-slider::-webkit-slider-thumb {
    -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%;
    background: ${ACCENT}; cursor: pointer;
    box-shadow: 0 0 0 3px rgba(91,108,255,0.22), 0 2px 8px rgba(91,108,255,0.5); }
  .vp-slider::-moz-range-thumb {
    width: 16px; height: 16px; border-radius: 50%; background: ${ACCENT};
    cursor: pointer; border: none;
    box-shadow: 0 0 0 3px rgba(91,108,255,0.22), 0 2px 8px rgba(91,108,255,0.5); }
`;

// ─── MiniMap ─────────────────────────────────────────────────────────────────

function MiniMap({ cW, cH, fx, fy, img }: { cW: number; cH: number; fx: number; fy: number; img: ImageDef }) {
  const uid = useId().replace(/:/g, "");
  const d = miniMapData(cW, cH, fx, fy, img.nat);
  const cx = Math.max(0, d.cropX);
  const cy = Math.max(0, d.cropY);
  const cw = Math.min(d.cropW, d.miniW - cx);
  const ch = Math.min(d.cropH, d.miniH - cy);

  return (
    <div style={{ position: "absolute", bottom: 14, right: 14, zIndex: 40, borderRadius: 3, overflow: "hidden", border: "1px solid rgba(91,108,255,0.4)", boxShadow: "0 4px 20px rgba(0,0,0,0.55)" }}>
      <div style={{ position: "relative", width: d.miniW, height: d.miniH }}>
        <img src={img.thumbUrl} alt="Full image reference" draggable={false} style={{ display: "block", width: d.miniW, height: d.miniH, objectFit: "fill" }} />
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }} viewBox={`0 0 ${d.miniW} ${d.miniH}`}>
          <defs>
            <mask id={`cm-${uid}`}>
              <rect width={d.miniW} height={d.miniH} fill="white" />
              <rect x={cx} y={cy} width={cw} height={ch} fill="black" />
            </mask>
          </defs>
          <rect width={d.miniW} height={d.miniH} fill="rgba(0,0,0,0.58)" mask={`url(#cm-${uid})`} />
          <rect x={cx + 0.5} y={cy + 0.5} width={cw - 1} height={ch - 1} fill="none" stroke={ACCENT} strokeWidth={1.5} />
          <circle cx={d.dotX} cy={d.dotY} r={3.5} fill={ACCENT} />
          <circle cx={d.dotX} cy={d.dotY} r={6} fill="none" stroke={ACCENT} strokeWidth={1} opacity={0.55} />
        </svg>
      </div>
      <div style={{ background: "#0e0e0e", borderTop: "1px solid rgba(91,108,255,0.2)", padding: "4px 8px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          {img.slot} · {img.nat.w}×{img.nat.h}
        </span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: ACCENT, letterSpacing: "0.08em" }}>
          {Math.round(fx * 100)}% {Math.round(fy * 100)}%
        </span>
      </div>
    </div>
  );
}

// ─── Crosshair ────────────────────────────────────────────────────────────────

function Crosshair({ cW, cH, fx, fy, label }: { cW: number; cH: number; fx: number; fy: number; label: string }) {
  const x = fx * cW;
  const y = fy * cH;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)", zIndex: 30, pointerEvents: "none", transition: "left 0.55s cubic-bezier(0.4,0,0.2,1), top 0.55s cubic-bezier(0.4,0,0.2,1)" }}>
      <div style={{ position: "absolute", height: 1, width: 52, left: -26, top: 0, background: ACCENT, boxShadow: "0 0 6px rgba(91,108,255,0.9)" }} />
      <div style={{ position: "absolute", width: 1, height: 52, top: -26, left: 0, background: ACCENT, boxShadow: "0 0 6px rgba(91,108,255,0.9)" }} />
      <div style={{ position: "absolute", width: 10, height: 10, left: -5, top: -5, background: ACCENT, borderRadius: "50%", boxShadow: "0 0 0 3px rgba(91,108,255,0.22), 0 0 10px rgba(91,108,255,0.7)" }} />
      <div style={{ position: "absolute", width: 26, height: 26, left: -13, top: -13, border: `1.5px solid ${ACCENT}`, borderRadius: "50%", opacity: 0.65 }} />
      <div style={{ position: "absolute", left: 17, top: -13, background: ACCENT, color: "#fff", fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 500, letterSpacing: "0.05em", padding: "3px 9px", borderRadius: 3, whiteSpace: "nowrap", boxShadow: "0 2px 12px rgba(91,108,255,0.55)" }}>
        {label}
      </div>
    </div>
  );
}

// ─── HeroContent ─────────────────────────────────────────────────────────────

function HeroContent({ layout, cW }: { layout: HeroLayout; cW: number }) {
  const margin = fluidMargin(cW);
  const isMobile = cW < 560;
  const isB = layout === "B";
  const maxW = Math.round(lerp(260, 400, vpT(cW)));
  const headingSize = Math.round(lerp(24, 40, vpT(cW)));

  const outerStyle: React.CSSProperties = {
    position: "absolute", inset: 0, padding: margin,
    display: "flex", pointerEvents: "none",
    ...(isMobile
      ? { flexDirection: "column", justifyContent: isB ? "flex-end" : "flex-start", alignItems: "flex-start" }
      : { flexDirection: "row", alignItems: "center", justifyContent: isB ? "flex-end" : "flex-start" }),
  };

  return (
    <div style={outerStyle}>
      <div style={{ maxWidth: maxW, textAlign: !isMobile && isB ? "right" : "left" }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.18em", color: "rgba(255,255,255,0.55)", textTransform: "uppercase", marginBottom: 10, lineHeight: 1 }}>
          Adventure Cycling · 2025
        </p>
        <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: headingSize, fontWeight: 600, color: "#fff", lineHeight: 1.08, marginBottom: 20, textShadow: "0 1px 14px rgba(0,0,0,0.5)" }}>
          Where every road leads somewhere new
        </h1>
        <button style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, background: "#fff", color: "#111", border: "none", borderRadius: 2, padding: "9px 20px", cursor: "pointer" }}>
          Explore routes
        </button>
      </div>
    </div>
  );
}

// ─── Hero — crossfades between desktop and mobile images at BREAKPOINT ────────

function Hero({
  cW, layout,
  dFX, dFY, mFX, mFY,
  showOverlay, animated,
}: {
  cW: number; layout: HeroLayout;
  dFX: FocalX; dFY: FocalY;
  mFX: FocalX; mFY: FocalY;
  showOverlay: boolean; animated: boolean;
}) {
  const isDesktop = cW >= BREAKPOINT;
  const isB = layout === "B";
  const activeFX = isDesktop ? FX[dFX] : FX[mFX];
  const activeFY = isDesktop ? FY[dFY] : FY[mFY];
  const activeImg = isDesktop ? DESKTOP_IMG : MOBILE_IMG;
  const activeLabel = LABEL[isDesktop ? dFX : mFX][isDesktop ? dFY : mFY];

  return (
    <div style={{ position: "relative", width: cW, height: HERO_H, flexShrink: 0, transition: animated ? "width 0.65s cubic-bezier(0.4,0,0.2,1)" : "none", willChange: "width" }}>
      {/* Clipped image layer */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#1e1e1e" }}>

        {/* Desktop image */}
        <img
          src={DESKTOP_IMG.url}
          alt={DESKTOP_IMG.alt}
          draggable={false}
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover",
            objectPosition: opCSS(dFX, dFY),
            opacity: isDesktop ? 1 : 0,
            transition: "opacity 0.5s ease, object-position 0.55s cubic-bezier(0.4,0,0.2,1)",
          }}
        />

        {/* Mobile image */}
        <img
          src={MOBILE_IMG.url}
          alt={MOBILE_IMG.alt}
          draggable={false}
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover",
            objectPosition: opCSS(mFX, mFY),
            opacity: isDesktop ? 0 : 1,
            transition: "opacity 0.5s ease, object-position 0.55s cubic-bezier(0.4,0,0.2,1)",
          }}
        />

        {/* Gradient */}
        <div style={{ position: "absolute", inset: 0, background: isB ? "linear-gradient(to left, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.1) 58%, transparent)" : "linear-gradient(to right, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.1) 58%, transparent)" }} />
      </div>

      {/* Content */}
      <HeroContent layout={layout} cW={cW} />

      {/* Overlay (outside overflow-hidden) */}
      {showOverlay && (
        <>
          <Crosshair cW={cW} cH={HERO_H} fx={activeFX} fy={activeFY} label={activeLabel} />
          <MiniMap cW={cW} cH={HERO_H} fx={activeFX} fy={activeFY} img={activeImg} />
        </>
      )}
    </div>
  );
}

// ─── Min-specific image comparison ─────────────────────────────────────────────────
// Shows desktop hero + mobile hero side by side — both at their natural breakpoint sizes,
// scaled to fit, with their independent focal points applied.

function ArtDirectionCompare({
  layout, dFX, dFY, mFX, mFY, showOverlay,
}: {
  layout: HeroLayout;
  dFX: FocalX; dFY: FocalY;
  mFX: FocalX; mFY: FocalY;
  showOverlay: boolean;
}) {
  const desktopScale = Math.min(580 / MAX_W, 1);
  const mobileScale = Math.min(260 / MIN_W, 1);

  function ScaledHeroWrap({ w, scale, children }: { w: number; scale: number; children: React.ReactNode }) {
    return (
      <div style={{ width: Math.round(w * scale), height: Math.round(HERO_H * scale), overflow: "hidden", position: "relative", flexShrink: 0, boxShadow: "0 4px 28px rgba(0,0,0,0.18)" }}>
        <div style={{ position: "absolute", width: w, height: HERO_H, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      <div style={{ display: "flex", gap: 28, alignItems: "flex-start", flexWrap: "wrap" }}>

        {/* Desktop hero */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80" }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "#4ade80" }}>Desktop image · ≥ {BREAKPOINT}px</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#4ade80", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", padding: "2px 7px", borderRadius: 2 }}>
              object-position: {opCSS(dFX, dFY)}
            </span>
          </div>
          <ScaledHeroWrap w={MAX_W} scale={desktopScale}>
            <Hero cW={MAX_W} layout={layout} dFX={dFX} dFY={dFY} mFX={mFX} mFY={mFY} showOverlay={showOverlay} animated={false} />
          </ScaledHeroWrap>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#4ade80", letterSpacing: "0.05em" }}>
            {LABEL[dFX][dFY]} — {MAX_W} × {HERO_H}px
          </p>
        </div>

        {/* Mobile hero */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: ACCENT }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: ACCENT }}>Mobile image · &lt; {BREAKPOINT}px</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: ACCENT, background: "rgba(91,108,255,0.1)", border: "1px solid rgba(91,108,255,0.25)", padding: "2px 7px", borderRadius: 2 }}>
              object-position: {opCSS(mFX, mFY)}
            </span>
          </div>
          <ScaledHeroWrap w={MIN_W} scale={mobileScale}>
            <Hero cW={MIN_W} layout={layout} dFX={dFX} dFY={dFY} mFX={mFX} mFY={mFY} showOverlay={showOverlay} animated={false} />
          </ScaledHeroWrap>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: ACCENT, letterSpacing: "0.05em" }}>
            {LABEL[mFX][mFY]} — {MIN_W} × {HERO_H}px
          </p>
        </div>
      </div>

      {/* Callout */}
      <div style={{ maxWidth: 660, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 5, padding: "16px 20px" }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Min-specific image</p>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.72 }}>
          At <strong style={{ color: "rgba(255,255,255,0.7)" }}>{BREAKPOINT}px</strong> the desktop image fades out and the mobile image fades in. Each image has its own{" "}
          <code style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, background: "rgba(255,255,255,0.08)", padding: "1px 6px", borderRadius: 3, color: "#c9d1d9" }}>object-position</code>
          {" "}so the focal point is set independently per image — the desktop crop emphasises the wide landscape while the mobile crop is tuned to the tighter portrait composition.
        </p>
      </div>
    </div>
  );
}

// ─── Focal panel — controls for one image ────────────────────────────────────

function FocalPanel({
  img, isActive,
  focalX, focalY,
  onChangeFocalX, onChangeFocalY,
}: {
  img: ImageDef;
  isActive: boolean;
  focalX: FocalX;
  focalY: FocalY;
  onChangeFocalX: (x: FocalX) => void;
  onChangeFocalY: (y: FocalY) => void;
}) {
  const imgAspect = img.nat.w / img.nat.h;
  const thumbW = imgAspect >= 1 ? 72 : 44;
  const thumbH = imgAspect >= 1 ? 44 : 66;
  const currentLabel = LABEL[focalX][focalY];
  const currentOpCSS = opCSS(focalX, focalY);
  const isDesktopSlot = img.slot === "desktop";

  return (
    <div
      style={{
        display: "flex", flexDirection: "column", gap: 10,
        padding: "12px 14px",
        borderRadius: 5,
        border: isActive ? `1px solid ${isDesktopSlot ? "rgba(74,222,128,0.4)" : "rgba(91,108,255,0.45)"}` : "1px solid rgba(255,255,255,0.07)",
        background: isActive ? (isDesktopSlot ? "rgba(74,222,128,0.05)" : "rgba(91,108,255,0.06)") : "rgba(255,255,255,0.02)",
        transition: "border-color 0.25s, background 0.25s",
        minWidth: 260,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: isDesktopSlot ? "#4ade80" : ACCENT, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: isActive ? (isDesktopSlot ? "#4ade80" : ACCENT) : "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase", lineHeight: 1.2 }}>
            {img.slot === "desktop" ? `Desktop · ≥ ${BREAKPOINT}px` : `Mobile · < ${BREAKPOINT}px`}
          </p>
          {isActive && (
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em", marginTop: 1 }}>Active</p>
          )}
        </div>
      </div>

      {/* Image thumb + focal grid */}
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        {/* Thumbnail preview showing object-position */}
        <div style={{ width: thumbW, height: thumbH, flexShrink: 0, borderRadius: 2, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", background: "#1a1a1a", position: "relative" }}>
          <img
            src={img.thumbUrl}
            alt={img.alt}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: currentOpCSS, transition: "object-position 0.4s ease", display: "block" }}
          />
          {/* Focal dot on thumbnail */}
          <div style={{ position: "absolute", left: `${FX[focalX] * 100}%`, top: `${FY[focalY] * 100}%`, transform: "translate(-50%,-50%)", width: 5, height: 5, borderRadius: "50%", background: isDesktopSlot ? "#4ade80" : ACCENT, boxShadow: `0 0 4px ${isDesktopSlot ? "rgba(74,222,128,0.8)" : "rgba(91,108,255,0.8)"}`, transition: "left 0.4s ease, top 0.4s ease" }} />
        </div>

        {/* 3×3 grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 3 }}>
          {FOCAL_YS.map((y) =>
            FOCAL_XS.map((x) => {
              const active = x === focalX && y === focalY;
              const accentColor = isDesktopSlot ? "#4ade80" : ACCENT;
              return (
                <button
                  key={`${x}-${y}`}
                  onClick={() => { onChangeFocalX(x); onChangeFocalY(y); }}
                  title={LABEL[x][y]}
                  style={{
                    width: 22, height: 22, borderRadius: 3, border: "none",
                    background: active ? accentColor : "rgba(255,255,255,0.07)",
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.15s, box-shadow 0.15s",
                    boxShadow: active ? `0 0 8px ${accentColor}66` : "none",
                  }}
                >
                  <div style={{ width: active ? 6 : 3.5, height: active ? 6 : 3.5, borderRadius: "50%", background: active ? (isDesktopSlot ? "#000" : "#fff") : "rgba(255,255,255,0.35)", transition: "all 0.15s" }} />
                </button>
              );
            })
          )}
        </div>

        {/* Current focal label */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 3 }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#f0f0f0", letterSpacing: "-0.01em", lineHeight: 1.2 }}>{currentLabel}</span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: isDesktopSlot ? "#4ade80" : ACCENT, letterSpacing: "0.05em" }}>{currentOpCSS}</span>
        </div>
      </div>

      {/* Axis chips */}
      <div style={{ display: "flex", gap: 10 }}>
        <div>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 4 }}>H</p>
          <div style={{ display: "flex", gap: 2 }}>
            {FOCAL_XS.map((x) => {
              const active = focalX === x;
              const accentColor = isDesktopSlot ? "#4ade80" : ACCENT;
              return (
                <button key={x} onClick={() => onChangeFocalX(x)} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 500, padding: "3px 8px", borderRadius: 3, border: "none", cursor: "pointer", textTransform: "capitalize", transition: "all 0.15s", background: active ? accentColor : "rgba(255,255,255,0.07)", color: active ? (isDesktopSlot ? "#000" : "#fff") : "rgba(255,255,255,0.45)" }}>
                  {x}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 4 }}>V</p>
          <div style={{ display: "flex", gap: 2 }}>
            {FOCAL_YS.map((y) => {
              const active = focalY === y;
              const accentColor = isDesktopSlot ? "#4ade80" : ACCENT;
              return (
                <button key={y} onClick={() => onChangeFocalY(y)} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 500, padding: "3px 8px", borderRadius: 3, border: "none", cursor: "pointer", textTransform: "capitalize", transition: "all 0.15s", background: active ? accentColor : "rgba(255,255,255,0.07)", color: active ? (isDesktopSlot ? "#000" : "#fff") : "rgba(255,255,255,0.45)" }}>
                  {y}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function PanelLabel({ children }: { children: React.ReactNode }) {
  return <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>{children}</p>;
}

function ToggleOption({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, padding: "5px 11px", borderRadius: 3, border: `1px solid ${checked ? "rgba(91,108,255,0.45)" : "rgba(255,255,255,0.08)"}`, cursor: "pointer", background: checked ? "rgba(91,108,255,0.1)" : "transparent", color: checked ? ACCENT : "rgba(255,255,255,0.45)", width: "100%", textAlign: "left", transition: "all 0.15s" }}>
      <div style={{ width: 14, height: 14, borderRadius: 3, flexShrink: 0, border: `1.5px solid ${checked ? ACCENT : "rgba(255,255,255,0.22)"}`, background: checked ? ACCENT : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
        {checked && <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </div>
      {label}
    </button>
  );
}

function PanelDivider() {
  return <div style={{ width: 1, alignSelf: "stretch", background: "rgba(255,255,255,0.07)", flexShrink: 0 }} />;
}

// ─── Docs view ────────────────────────────────────────────────────────────────

const CODE_BG = "#1a1c23";
const CODE_BORDER = "rgba(255,255,255,0.07)";

function CodeBlock({ code, language = "css" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  function copy() { navigator.clipboard.writeText(code.trim()); setCopied(true); setTimeout(() => setCopied(false), 1800); }
  return (
    <div style={{ position: "relative", borderRadius: 6, overflow: "hidden", border: `1px solid ${CODE_BORDER}`, marginTop: 10, marginBottom: 4 }}>
      <div style={{ background: "#13141a", borderBottom: `1px solid ${CODE_BORDER}`, padding: "6px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{language}</span>
        <button onClick={copy} style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: copied ? "#6ee7b7" : "rgba(255,255,255,0.35)", background: "transparent", border: "none", cursor: "pointer", letterSpacing: "0.06em", transition: "color 0.2s" }}>{copied ? "Copied!" : "Copy"}</button>
      </div>
      <pre style={{ margin: 0, padding: "16px 18px", background: CODE_BG, overflowX: "auto", fontFamily: "'DM Mono', monospace", fontSize: 12.5, lineHeight: 1.75, color: "#c9d1d9" }}>
        <code>{code.trim()}</code>
      </pre>
    </div>
  );
}

function DocSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 20, fontWeight: 600, color: "#f0f0f0", marginBottom: 16, letterSpacing: "-0.02em", paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>{title}</h2>
      {children}
    </section>
  );
}

function DocP({ children }: { children: React.ReactNode }) {
  return <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "rgba(255,255,255,0.62)", lineHeight: 1.78, marginBottom: 14 }}>{children}</p>;
}

function DocNote({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "rgba(91,108,255,0.08)", border: "1px solid rgba(91,108,255,0.2)", borderRadius: 5, padding: "12px 16px", marginBottom: 14, display: "flex", gap: 10 }}>
      <span style={{ color: ACCENT, fontSize: 14, flexShrink: 0, marginTop: 1 }}>→</span>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, margin: 0 }}>{children}</p>
    </div>
  );
}

function IC({ children }: { children: React.ReactNode }) {
  return <code style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.08)", padding: "1px 6px", borderRadius: 3, color: "#c9d1d9" }}>{children}</code>;
}

function DocStep({ n, heading, children }: { n: number; heading: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 14, marginBottom: 32 }}>
      <div style={{ width: 24, height: 24, borderRadius: "50%", background: ACCENT, color: "#fff", fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>{n}</div>
      <div style={{ flex: 1 }}>
        <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: "#f0f0f0", marginBottom: 8, letterSpacing: "-0.01em" }}>{heading}</h3>
        {children}
      </div>
    </div>
  );
}

function DocsView() {
  return (
    <div style={{ flex: 1, overflowY: "auto", background: "#0d0d0d" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "52px 40px 80px" }}>

        <div style={{ marginBottom: 52 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 3, height: 28, background: ACCENT, borderRadius: 2 }} />
            <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 28, fontWeight: 600, color: "#f5f5f5", letterSpacing: "-0.03em", margin: 0 }}>Implementing Responsive Hero Focal Points</h1>
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, maxWidth: 620 }}>
            A practical guide to the CSS technique — single image with focal point, and art-directed multi-image heroes where desktop and mobile use different photographs with independent focal points.
          </p>
        </div>

        <DocSection title="Single image with object-position">
          <DocP>The complete technique is two CSS properties. <IC>object-fit: cover</IC> fills the container while preserving aspect ratio. <IC>object-position</IC> anchors the crop to the part of the image you care about.</DocP>
          <CodeBlock language="css" code={`
.hero__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: var(--focal-point, 50% 50%);
}
          `} />
          <CodeBlock language="html" code={`
<div class="hero">
  <img
    class="hero__image"
    src="hero.jpg"
    alt="..."
    style="--focal-point: 20% 80%"
  />
</div>
          `} />
          <DocNote>The two values are <strong>horizontal%</strong> then <strong>vertical%</strong>. 0% 0% is top-left, 100% 100% is bottom-right. The 20%/80% offsets (rather than 0%/100%) keep the subject away from the very edge of the frame.</DocNote>
        </DocSection>

        <DocSection title="Min-specific image — different images per breakpoint">
          <DocP>
            When a single image cannot serve both a wide landscape desktop crop and a tall portrait mobile crop well, swap to a different photograph entirely. This is called <strong style={{ color: "#f0f0f0" }}>min-specific image</strong>. Each image gets its own <IC>object-position</IC>.
          </DocP>

          <DocStep n={1} heading="Pure CSS with a media query">
            <DocP>The simplest approach: render both images, hide one at each breakpoint. Each image has its own focal point.</DocP>
            <CodeBlock language="css" code={`
.hero { position: relative; width: 100%; height: 600px; overflow: hidden; }

.hero__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  inset: 0;
}

/* Desktop image — visible above 1024px */
.hero__image--desktop {
  object-position: 20% 80%;   /* Bottom Left focal point */
  opacity: 1;
}
.hero__image--mobile  { opacity: 0; }

/* Mobile image — visible below 1024px */
@media (max-width: 1023px) {
  .hero__image--desktop { opacity: 0; }
  .hero__image--mobile  {
    opacity: 1;
    object-position: 50% 30%;  /* Top Centre focal point */
  }
}
            `} />
            <CodeBlock language="html" code={`
<div class="hero">
  <img class="hero__image hero__image--desktop" src="desktop.jpg" alt="..." />
  <img class="hero__image hero__image--mobile"  src="mobile.jpg"  alt="..." />
</div>
            `} />
            <DocNote>Both images are always in the DOM. Add a crossfade transition with <IC>transition: opacity 0.4s ease</IC> if you want a smooth swap instead of a hard cut. This prototype uses this approach with the transition on the viewport slider.</DocNote>
          </DocStep>

          <DocStep n={2} heading="HTML picture element (recommended for production)">
            <DocP>
              The <IC>&lt;picture&gt;</IC> element is the semantically correct solution. The browser downloads only the image it will use — the opacity trick above downloads both. Use <IC>picture</IC> in production and the opacity approach in prototype/CMS-driven contexts.
            </DocP>
            <CodeBlock language="html" code={`
<div class="hero">
  <picture>
    <!-- Desktop image — loaded when viewport ≥ 1024px -->
    <source
      media="(min-width: 1024px)"
      srcset="desktop.jpg"
    />
    <!-- Mobile image — loaded otherwise (default) -->
    <img
      class="hero__image"
      src="mobile.jpg"
      alt="Cyclist on mountain road"
      style="--focal-point-desktop: 20% 80%; --focal-point-mobile: 50% 30%"
    />
  </picture>
</div>
            `} />
            <CodeBlock language="css" code={`
.hero__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: var(--focal-point-mobile, 50% 50%);
}

@media (min-width: 1024px) {
  .hero__image {
    object-position: var(--focal-point-desktop, 50% 50%);
  }
}
            `} />
            <DocNote>With <IC>picture</IC>, the breakpoint is declared in the <IC>media</IC> attribute on <IC>&lt;source&gt;</IC>. The <IC>object-position</IC> breakpoint must match exactly — keep both values in the same config object in your CMS or template to avoid drift.</DocNote>
          </DocStep>

          <DocStep n={3} heading="React component for art-directed heroes">
            <CodeBlock language="tsx" code={`
type FocalX = "left" | "center" | "right";
type FocalY = "top"  | "center" | "bottom";

const FOCAL_X: Record<FocalX, string> = {
  left: "20%", center: "50%", right: "80%",
};
const FOCAL_Y: Record<FocalY, string> = {
  top: "20%", center: "50%", bottom: "80%",
};

interface ArtDirectedHeroProps {
  desktopSrc: string;
  mobileSrc:  string;
  alt: string;
  desktopFocalX?: FocalX;
  desktopFocalY?: FocalY;
  mobileFocalX?:  FocalX;
  mobileFocalY?:  FocalY;
  breakpoint?: number;   // default 1024
  children?: React.ReactNode;
}

export function ArtDirectedHero({
  desktopSrc, mobileSrc, alt,
  desktopFocalX = "center", desktopFocalY = "center",
  mobileFocalX  = "center", mobileFocalY  = "center",
  breakpoint = 1024,
  children,
}: ArtDirectedHeroProps) {
  const desktopPos = \`\${FOCAL_X[desktopFocalX]} \${FOCAL_Y[desktopFocalY]}\`;
  const mobilePos  = \`\${FOCAL_X[mobileFocalX]}  \${FOCAL_Y[mobileFocalY]}\`;

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: 600 }}
    >
      {/* Desktop image */}
      <img
        src={desktopSrc}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover
                   opacity-0 max-[1023px]:opacity-100
                   min-[1024px]:opacity-100 max-[1023px]:!opacity-0"
        style={{ objectPosition: desktopPos }}
      />
      {/* Mobile image */}
      <img
        src={mobileSrc}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover
                   min-[1024px]:opacity-0"
        style={{ objectPosition: mobilePos }}
      />
      {children}
    </div>
  );
}

/* Usage */
<ArtDirectedHero
  desktopSrc="/hero-landscape.jpg"
  mobileSrc="/hero-portrait.jpg"
  alt="Cyclist on mountain road"
  desktopFocalX="left"
  desktopFocalY="bottom"
  mobileFocalX="center"
  mobileFocalY="top"
>
  <HeroContent />
</ArtDirectedHero>
            `} />
          </DocStep>
        </DocSection>

        <DocSection title="Storing min-specific image in your CMS">
          <DocP>Keep both images and both focal points as a single content type. The breakpoint should be a site-wide constant — not per-entry — to prevent inconsistency.</DocP>
          <CodeBlock language="ts" code={`
// types/hero.ts
export interface HeroBlock {
  desktop: {
    image: string;          // URL
    focalX: "left" | "center" | "right";
    focalY: "top"  | "center" | "bottom";
  };
  mobile: {
    image: string;
    focalX: "left" | "center" | "right";
    focalY: "top"  | "center" | "bottom";
  };
}

// Site constant — change once, applies everywhere
export const HERO_BREAKPOINT = 1024;
          `} />
          <DocNote>If your CMS doesn't support separate desktop/mobile image fields natively, add them as named slots in your content schema (e.g. <IC>heroDesktopImage</IC> and <IC>heroMobileImage</IC>). Avoid storing the breakpoint per-entry — it will diverge.</DocNote>
        </DocSection>

        <DocSection title="Focal point quick reference">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, background: "rgba(255,255,255,0.05)", borderRadius: 6, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
            {[
              { label: "Top Left",      value: "20% 20%" },
              { label: "Top Centre",    value: "50% 20%" },
              { label: "Top Right",     value: "80% 20%" },
              { label: "Centre Left",   value: "20% 50%" },
              { label: "Centre",        value: "50% 50%" },
              { label: "Centre Right",  value: "80% 50%" },
              { label: "Bottom Left",   value: "20% 80%" },
              { label: "Bottom Centre", value: "50% 80%" },
              { label: "Bottom Right",  value: "80% 80%" },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: "#141414", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: "#f0f0f0" }}>{label}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: ACCENT }}>{value}</span>
              </div>
            ))}
          </div>
        </DocSection>

      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  // Desktop image focal point
  const [dFX, setDFX] = useState<FocalX>("left");
  const [dFY, setDFY] = useState<FocalY>("bottom");

  // Mobile image focal point
  const [mFX, setMFX] = useState<FocalX>("center");
  const [mFY, setMFY] = useState<FocalY>("top");

  const [viewportWidth, setViewportWidth] = useState(MAX_W);
  const [layout, setLayout] = useState<HeroLayout>("A");
  const [showOverlay, setShowOverlay] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [animated, setAnimated] = useState(false);
  const [activeView, setActiveView] = useState<"prototype" | "docs">("prototype");
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDesktop = viewportWidth >= BREAKPOINT;
  const t = vpT(viewportWidth);
  const bpT = vpT(BREAKPOINT); // slider position of breakpoint tick

  function snapTo(w: number) {
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    setAnimated(true);
    setViewportWidth(w);
    animTimerRef.current = setTimeout(() => setAnimated(false), 750);
  }

  function handleSlider(e: React.ChangeEvent<HTMLInputElement>) {
    setAnimated(false);
    setViewportWidth(Number(e.target.value));
  }

  const sliderFill = `linear-gradient(to right, ${ACCENT} ${t * 100}%, rgba(255,255,255,0.15) ${t * 100}%)`;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", fontFamily: "'DM Sans', sans-serif", background: "#0f0f0f" }}>
      <style>{SLIDER_CSS}</style>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header style={{ height: 52, flexShrink: 0, background: "#161616", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 22, height: 22, background: ACCENT, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 7, height: 7, background: "#fff", borderRadius: "50%" }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#f0f0f0", letterSpacing: "-0.01em" }}>Focal Point Prototype</span>
          <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 12 }}>·</span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em" }}>Min-specific image</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {activeView === "prototype" && (["A", "B"] as HeroLayout[]).map((l) => (
            <button key={l} onClick={() => setLayout(l)} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, padding: "5px 12px", borderRadius: 3, border: "none", cursor: "pointer", background: layout === l ? "rgba(255,255,255,0.12)" : "transparent", color: layout === l ? "#fff" : "rgba(255,255,255,0.35)", transition: "all 0.15s" }}>
              Layout {l}
            </button>
          ))}
          {activeView === "prototype" && <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.1)", margin: "0 6px" }} />}
          {(["prototype", "docs"] as const).map((v) => (
            <button key={v} onClick={() => setActiveView(v)} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, padding: "5px 12px", borderRadius: 3, border: "none", cursor: "pointer", background: activeView === v ? ACCENT : "rgba(255,255,255,0.06)", color: activeView === v ? "#fff" : "rgba(255,255,255,0.4)", boxShadow: activeView === v ? "0 0 10px rgba(91,108,255,0.35)" : "none", transition: "all 0.15s", textTransform: "capitalize" }}>
              {v === "prototype" ? "Prototype" : "Dev Docs"}
            </button>
          ))}
        </div>
      </header>

      {/* ── Docs ──────────────────────────────────────────────────────────── */}
      {activeView === "docs" && <DocsView />}

      {/* ── Canvas ────────────────────────────────────────────────────────── */}
      {activeView === "prototype" && (
        <div style={{ flex: 1, overflow: "auto", background: compareMode ? "#ebebea" : "#e0e0de" }}>
          <div style={{ minHeight: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: compareMode ? "flex-start" : "center", padding: compareMode ? "44px 52px" : "64px 52px", gap: 40, minWidth: "fit-content" }}>
            {compareMode ? (
              <>
                <div style={{ alignSelf: "flex-start" }}>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "#999" }}>
                    Min-specific image Preview · Desktop {MAX_W}px vs Mobile {MIN_W}px · Layout {layout}
                  </p>
                </div>
                <ArtDirectionCompare layout={layout} dFX={dFX} dFY={dFY} mFX={mFX} mFY={mFY} showOverlay={showOverlay} />
              </>
            ) : (
              <>
                {/* Viewport label + breakpoint badge */}
                <div style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "#999" }}>
                    {viewportWidth}px × {HERO_H}px · Layout {layout}
                  </span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: isDesktop ? "#4ade80" : ACCENT, background: isDesktop ? "rgba(74,222,128,0.1)" : "rgba(91,108,255,0.1)", border: `1px solid ${isDesktop ? "rgba(74,222,128,0.3)" : "rgba(91,108,255,0.3)"}`, padding: "2px 9px", borderRadius: 10, letterSpacing: "0.06em", transition: "all 0.3s" }}>
                    {isDesktop ? `Desktop image · ≥ ${BREAKPOINT}px` : `Mobile image · < ${BREAKPOINT}px`}
                  </span>
                </div>

                {/* Hero */}
                <div style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.06), 0 12px 48px rgba(0,0,0,0.2)" }}>
                  <Hero cW={viewportWidth} layout={layout} dFX={dFX} dFY={dFY} mFX={mFX} mFY={mFY} showOverlay={showOverlay} animated={animated} />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Controls ──────────────────────────────────────────────────────── */}
      {activeView === "prototype" && (
        <div style={{ flexShrink: 0, background: "#111111", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "stretch", gap: 20, flexWrap: "wrap" }}>

            {/* ── Two image focal panels ── */}
            <FocalPanel img={DESKTOP_IMG} isActive={isDesktop} focalX={dFX} focalY={dFY} onChangeFocalX={setDFX} onChangeFocalY={setDFY} />
            <FocalPanel img={MOBILE_IMG}  isActive={!isDesktop} focalX={mFX} focalY={mFY} onChangeFocalX={setMFX} onChangeFocalY={setMFY} />

            <PanelDivider />

            {/* ── Viewport slider ── */}
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 10, minWidth: 240, flex: 1, maxWidth: 340 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <PanelLabel>Viewport width</PanelLabel>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: isDesktop ? "#4ade80" : ACCENT, background: isDesktop ? "rgba(74,222,128,0.1)" : "rgba(91,108,255,0.1)", padding: "2px 8px", borderRadius: 3, letterSpacing: "0.06em", transition: "all 0.3s" }}>
                  {viewportWidth}px
                </span>
              </div>

              {/* Slider + breakpoint tick */}
              <div style={{ position: "relative" }}>
                <input className="vp-slider" type="range" min={MIN_W} max={MAX_W} step={1} value={viewportWidth} onChange={handleSlider} style={{ background: sliderFill }} />
                {/* Breakpoint tick mark */}
                <div style={{ position: "absolute", left: `${bpT * 100}%`, top: "50%", transform: "translate(-50%, -50%)", width: 2, height: 10, background: "rgba(255,255,255,0.4)", borderRadius: 1, pointerEvents: "none" }} />
                <div style={{ position: "absolute", left: `${bpT * 100}%`, top: "calc(50% + 9px)", transform: "translateX(-50%)", fontFamily: "'DM Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap", letterSpacing: "0.06em", pointerEvents: "none" }}>
                  {BREAKPOINT}px
                </div>
              </div>

              {/* Snap buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                <button onClick={() => snapTo(MIN_W)} style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.1em", padding: "4px 9px", borderRadius: 3, border: "none", cursor: "pointer", background: viewportWidth === MIN_W ? ACCENT : "rgba(255,255,255,0.07)", color: viewportWidth === MIN_W ? "#fff" : "rgba(255,255,255,0.4)", transition: "all 0.15s", textTransform: "uppercase" }}>
                  Mobile 365
                </button>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
                <button onClick={() => snapTo(BREAKPOINT)} style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.1em", padding: "4px 9px", borderRadius: 3, border: "none", cursor: "pointer", background: viewportWidth === BREAKPOINT ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.07)", color: viewportWidth === BREAKPOINT ? "#fff" : "rgba(255,255,255,0.4)", transition: "all 0.15s", textTransform: "uppercase" }}>
                  BP 1024
                </button>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
                <button onClick={() => snapTo(MAX_W)} style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.1em", padding: "4px 9px", borderRadius: 3, border: "none", cursor: "pointer", background: viewportWidth === MAX_W ? "#4ade80" : "rgba(255,255,255,0.07)", color: viewportWidth === MAX_W ? "#000" : "rgba(255,255,255,0.4)", transition: "all 0.15s", textTransform: "uppercase" }}>
                  Desktop 1276
                </button>
              </div>
            </div>

            <PanelDivider />

            {/* ── Display + hint ── */}
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 14 }}>
              <div>
                <PanelLabel>Display</PanelLabel>
                <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 5, minWidth: 148 }}>
                  <ToggleOption label="Show focal point" checked={showOverlay} onChange={setShowOverlay} />
                  <ToggleOption label="Min-specific image preview" checked={compareMode} onChange={setCompareMode} />
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
