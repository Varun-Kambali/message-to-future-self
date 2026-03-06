import { useState, useEffect, useRef, useCallback } from "react";

/* ─── Google Fonts ─────────────────────────────────────────── */
const FONT_LINK = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400;1,500&family=Lora:ital,wght@0,400;0,500;1,400;1,500&family=Special+Elite&display=swap";

/* ─── Constants ─────────────────────────────────────────────── */
const COVER_COLORS = [
  { id: "oxblood",  label: "Oxblood",     leather: "#6b1e1e", spine: "#4a1212", gold: "#c9a84c" },
  { id: "navy",     label: "Navy",         leather: "#1a2744", spine: "#0f1a30", gold: "#c9a84c" },
  { id: "forest",   label: "Forest",       leather: "#1e3d2a", spine: "#132a1c", gold: "#c9a84c" },
  { id: "midnight", label: "Midnight",     leather: "#1a1a2e", spine: "#0f0f1e", gold: "#e8c97a" },
  { id: "tawny",    label: "Tawny",        leather: "#8b4a2a", spine: "#6b3318", gold: "#e8d5a3" },
];

const PROMPTS = [
  "What are you most afraid of right now?",
  "Describe your ideal ordinary Tuesday one year from now.",
  "What would your wiser self tell you today?",
  "What three things are you proud of this season?",
  "What has surprised you most about your life?",
  "What are you still waiting for permission to do?",
  "Write to the person you love most.",
  "What feeling do you most want to remember?",
];

const SAMPLE_ENTRIES = [
  {
    id: 1, type: "text", date: "March 6, 2025", deliverAt: "March 6, 2026",
    prompt: "What are you most afraid of right now?",
    content: "Dear future me,\n\nI'm writing this from the kitchen table at 11pm. Outside it's raining. I've been afraid of staying still — of looking up in five years and realizing nothing changed. I hope you're reading this somewhere better.\n\nWith hope,\nPast You",
    sealed: true, delivered: false, sealArt: null, sealEmoji: "🌿",
  },
  {
    id: 2, type: "audio", date: "January 12, 2025", deliverAt: "January 12, 2026",
    prompt: "What would your wiser self tell you today?",
    content: "A voice note recorded on a quiet Sunday morning. I talked about the job offer, about whether to take the leap. About what courage actually feels like from the inside.",
    transcript: "Hey... it's me. I'm sitting in the car outside the coffee shop because I needed a minute. I got the offer. The one I've been working toward for two years. And I'm terrified. Which probably means I should take it. My wiser self would say: fear and excitement feel exactly the same in your body. The only difference is the story you tell yourself about it. So I'm choosing the better story. I hope you took the leap.",
    sealed: true, delivered: true, sealArt: null, sealEmoji: "🌙",
  },
];

/* ─── Wax Seal Canvas Component ─────────────────────────────── */
function WaxSealCanvas({ color = "#8b1a1a", size = 80, imageData = null, emoji = "✦", interactive = false, onUpload }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const cx = size / 2, cy = size / 2, r = size / 2 - 4;

    ctx.clearRect(0, 0, size, size);

    // Wax base — radial gradient for 3D look
    const grad = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.25, r * 0.05, cx, cy, r);
    grad.addColorStop(0, lighten(color, 40));
    grad.addColorStop(0.35, color);
    grad.addColorStop(0.8, darken(color, 20));
    grad.addColorStop(1, darken(color, 40));
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Drip texture bumps
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + 0.3;
      const bx = cx + Math.cos(angle) * r * 0.82;
      const by = cy + Math.sin(angle) * r * 0.82;
      const bg = ctx.createRadialGradient(bx, by, 0, bx, by, r * 0.18);
      bg.addColorStop(0, lighten(color, 25) + "88");
      bg.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(bx, by, r * 0.18, 0, Math.PI * 2);
      ctx.fillStyle = bg;
      ctx.fill();
    }

    // Specular highlight
    const hl = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, 0, cx - r * 0.2, cy - r * 0.2, r * 0.45);
    hl.addColorStop(0, "rgba(255,255,255,0.38)");
    hl.addColorStop(1, "rgba(255,255,255,0)");
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = hl;
    ctx.fill();

    // Clip to circle for artwork
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.62, 0, Math.PI * 2);
    ctx.clip();

    if (imageData) {
      // Draw uploaded image with edge-detection outline style
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, cx - r * 0.62, cy - r * 0.62, r * 1.24, r * 1.24);
        ctx.restore();
        // Engraved outline overlay
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.62, 0, Math.PI * 2);
        ctx.clip();
        ctx.globalCompositeOperation = "multiply";
        ctx.drawImage(img, cx - r * 0.62, cy - r * 0.62, r * 1.24, r * 1.24);
        ctx.restore();
        // Gold engraved outline ring
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.63, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,220,120,0.6)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      };
      img.src = imageData;
    } else {
      ctx.restore();
      // Engraved emoji / monogram
      ctx.font = `${r * 0.55}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillText(emoji, cx + 1, cy + 1);
      ctx.fillStyle = "rgba(255,220,120,0.85)";
      ctx.fillText(emoji, cx, cy);
    }

    // Outer gold ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,215,80,0.5)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Inner debossed ring
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.68, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.68, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 0.5;
    ctx.stroke();

  }, [color, size, imageData, emoji]);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <canvas ref={canvasRef} width={size} height={size}
        style={{ display: "block", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.4))", borderRadius: "50%" }} />
      {interactive && onUpload && (
        <label style={{
          position: "absolute", inset: 0, borderRadius: "50%", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0)", transition: "background 0.2s",
        }}
          onMouseOver={e => e.currentTarget.style.background = "rgba(0,0,0,0.35)"}
          onMouseOut={e => e.currentTarget.style.background = "rgba(0,0,0,0)"}
        >
          <span style={{ color: "white", fontSize: 11, fontFamily: "'Special Elite', monospace", opacity: 0, transition: "opacity 0.2s", pointerEvents: "none" }}
            className="seal-upload-label">Upload art</span>
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={onUpload} />
        </label>
      )}
    </div>
  );
}

function lighten(hex, amt) {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, (n >> 16) + amt);
  const g = Math.min(255, ((n >> 8) & 0xff) + amt);
  const b = Math.min(255, (n & 0xff) + amt);
  return `rgb(${r},${g},${b})`;
}
function darken(hex, amt) { return lighten(hex, -amt); }

/* ─── Audio Player Component ────────────────────────────────── */
function AudioPlayer({ transcript }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [currentWord, setCurrentWord] = useState(0);
  const words = transcript ? transcript.split(" ") : [];
  const intervalRef = useRef(null);
  const totalDuration = words.length * 0.38; // simulated seconds

  function togglePlay() {
    if (playing) {
      clearInterval(intervalRef.current);
      setPlaying(false);
    } else {
      setPlaying(true);
      const startWord = Math.floor((progress / 100) * words.length);
      let w = startWord;
      intervalRef.current = setInterval(() => {
        w++;
        setCurrentWord(w);
        setProgress((w / words.length) * 100);
        if (w >= words.length) {
          clearInterval(intervalRef.current);
          setPlaying(false);
          setProgress(100);
        }
      }, 380);
    }
  }

  useEffect(() => () => clearInterval(intervalRef.current), []);

  function formatTime(pct) {
    const s = Math.floor((pct / 100) * totalDuration);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  return (
    <div style={{
      background: "linear-gradient(135deg, #1a1008, #2c1e0f)",
      borderRadius: 12, padding: "24px", border: "1px solid rgba(201,168,76,0.3)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.4)",
    }}>
      {/* Waveform visualizer */}
      <div style={{ display: "flex", alignItems: "center", gap: 2, height: 40, marginBottom: 16, justifyContent: "center" }}>
        {Array.from({ length: 48 }, (_, i) => {
          const h = 6 + Math.sin(i * 0.7) * 10 + Math.sin(i * 1.3) * 8 + Math.sin(i * 3.7) * 3;
          const filled = (i / 48) * 100 < progress;
          const dur = (300 + (i % 5) * 100) + "ms";
          return (
            <div key={i} style={{
              width: 3, height: h, borderRadius: 2,
              background: filled
                ? ("rgba(201,168,76," + (playing && filled ? 0.9 : 0.7) + ")")
                : "rgba(255,255,255,0.12)",
              transition: "background 0.1s",
              animation: (playing && filled) ? ("barPulse " + dur + " ease-in-out infinite alternate") : "none",
            }} />
          );
        })}
      </div>

      {/* Progress bar */}
      <div style={{ position: "relative", height: 3, background: "rgba(255,255,255,0.1)", borderRadius: 2, marginBottom: 12, cursor: "pointer" }}
        onClick={e => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = ((e.clientX - rect.left) / rect.width) * 100;
          setProgress(pct);
          setCurrentWord(Math.floor((pct / 100) * words.length));
        }}>
        <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #c9a84c, #e8d5a3)", borderRadius: 2, transition: "width 0.1s" }} />
        <div style={{ position: "absolute", top: "50%", left: `${progress}%`, transform: "translate(-50%,-50%)", width: 10, height: 10, borderRadius: "50%", background: "#c9a84c", boxShadow: "0 0 8px #c9a84c88" }} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={togglePlay} style={{
          width: 44, height: 44, borderRadius: "50%", border: "none",
          background: "linear-gradient(135deg, #c9a84c, #a07830)",
          color: "#1a1008", fontSize: 16, cursor: "pointer",
          boxShadow: "0 4px 16px rgba(201,168,76,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          {playing ? "⏸" : "▶"}
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontFamily: "'Special Elite', monospace", letterSpacing: "0.06em" }}>
            {formatTime(progress)} / {formatTime(100)}
          </div>
          <div style={{ color: "rgba(201,168,76,0.8)", fontSize: 11, fontFamily: "'Special Elite', monospace", marginTop: 2 }}>
            Voice Note · Personal
          </div>
        </div>
        <button onClick={() => setShowTranscript(t => !t)} style={{
          background: "none", border: "1px solid rgba(201,168,76,0.3)", color: "rgba(201,168,76,0.8)",
          padding: "6px 12px", borderRadius: 4, fontSize: 11, fontFamily: "'Special Elite', monospace",
          cursor: "pointer", letterSpacing: "0.06em",
        }}>
          {showTranscript ? "HIDE" : "TRANSCRIPT"}
        </button>
      </div>

      {/* Live transcript */}
      {showTranscript && (
        <div style={{
          marginTop: 20, padding: "16px", background: "rgba(0,0,0,0.3)", borderRadius: 8,
          borderLeft: "2px solid rgba(201,168,76,0.4)", maxHeight: 140, overflowY: "auto",
        }}>
          <p style={{ fontFamily: "'Lora', serif", fontSize: 14, lineHeight: 1.8, color: "rgba(255,255,255,0.7)", margin: 0, fontStyle: "italic" }}>
            {words.map((w, i) => (
              <span key={i} style={{
                color: i < currentWord ? "#e8d5a3" : "rgba(255,255,255,0.4)",
                fontWeight: i === currentWord - 1 && playing ? "500" : "normal",
                background: i === currentWord - 1 && playing ? "rgba(201,168,76,0.2)" : "none",
                borderRadius: 2, padding: "0 1px",
                transition: "color 0.2s, background 0.2s",
              }}>{w} </span>
            ))}
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Book Cover Component ───────────────────────────────────── */
function BookCover({ cover, title, onOpen, customImage }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{
      perspective: "1200px", cursor: "pointer",
      display: "inline-block",
    }}
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        width: 240, height: 320,
        position: "relative",
        transformStyle: "preserve-3d",
        transform: hovered ? "rotateY(-18deg) rotateX(3deg)" : "rotateY(-8deg) rotateX(2deg)",
        transition: "transform 0.5s cubic-bezier(0.34, 1.2, 0.64, 1)",
        filter: "drop-shadow(12px 16px 40px rgba(0,0,0,0.6))",
      }}>
        {/* Spine */}
        <div style={{
          position: "absolute", left: -28, top: 2, width: 28, height: "99%",
          background: `linear-gradient(180deg, ${cover.spine}, ${cover.leather}66)`,
          transformOrigin: "right", transform: "rotateY(90deg)",
          borderRadius: "3px 0 0 3px",
          boxShadow: "inset -3px 0 8px rgba(0,0,0,0.4)",
        }}>
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%) rotate(-90deg)",
            color: cover.gold, fontSize: 9, fontFamily: "'Special Elite', monospace",
            letterSpacing: "0.15em", whiteSpace: "nowrap", opacity: 0.7,
          }}>FUTURE SELF</div>
        </div>

        {/* Front cover */}
        <div style={{
          width: "100%", height: "100%", borderRadius: "2px 8px 8px 2px",
          background: `linear-gradient(160deg, ${lighten(cover.leather, 15)} 0%, ${cover.leather} 40%, ${darken(cover.leather, 10)} 100%)`,
          border: `1px solid ${darken(cover.leather, 20)}`,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          position: "relative", overflow: "hidden",
        }}>
          {/* Leather texture lines */}
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} style={{
              position: "absolute", left: 0, right: 0,
              top: `${(i / 12) * 100}%`, height: 1,
              background: "rgba(0,0,0,0.08)",
            }} />
          ))}
          {/* Gold border frame */}
          <div style={{
            position: "absolute", inset: 12,
            border: `1px solid ${cover.gold}55`,
            borderRadius: 4, pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", inset: 16,
            border: `0.5px solid ${cover.gold}33`,
            borderRadius: 2, pointerEvents: "none",
          }} />

          {/* Custom image or monogram */}
          {customImage ? (
            <img src={customImage} style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: `2px solid ${cover.gold}55`, marginBottom: 16 }} alt="cover" />
          ) : (
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              border: `1px solid ${cover.gold}66`,
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 16,
              background: `radial-gradient(circle, ${lighten(cover.leather, 8)}, ${darken(cover.leather, 5)})`,
            }}>
              <span style={{ color: cover.gold, fontSize: 28, opacity: 0.8 }}>✉</span>
            </div>
          )}

          <div style={{
            color: cover.gold, fontSize: 16, fontFamily: "'Playfair Display', serif",
            fontStyle: "italic", letterSpacing: "0.06em", textAlign: "center",
            textShadow: `0 1px 3px rgba(0,0,0,0.5)`, opacity: 0.9, padding: "0 20px",
            maxWidth: 160, lineHeight: 1.4,
          }}>
            {title || "My Journal"}
          </div>
          <div style={{
            color: cover.gold, fontSize: 9, fontFamily: "'Special Elite', monospace",
            letterSpacing: "0.2em", marginTop: 10, opacity: 0.5, textTransform: "uppercase",
          }}>Future Self Messenger</div>

          {/* Bottom page edges */}
          <div style={{ position: "absolute", bottom: 0, right: 0, width: "60%", height: 6, background: `linear-gradient(90deg, transparent, rgba(240,230,210,0.3))`, borderRadius: "0 8px 8px 0" }} />

          {hovered && (
            <div style={{
              position: "absolute", bottom: 24, left: 0, right: 0, textAlign: "center",
              color: cover.gold, fontSize: 11, fontFamily: "'Special Elite', monospace",
              letterSpacing: "0.12em", opacity: 0.8, animation: "fadeUp 0.3s ease",
            }}>OPEN JOURNAL →</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Page Flip Journal ──────────────────────────────────────── */
function Journal({ entries, cover, onClose, onNewEntry }) {
  const [currentPage, setCurrentPage] = useState(0); // 0 = first entry
  const [flipping, setFlipping] = useState(false);
  const [flipDir, setFlipDir] = useState(null);
  const [openEntry, setOpenEntry] = useState(null);

  function flip(dir) {
    if (flipping) return;
    if (dir === "next" && currentPage >= entries.length - 1) return;
    if (dir === "prev" && currentPage <= 0) return;
    setFlipDir(dir);
    setFlipping(true);
    setTimeout(() => {
      setCurrentPage(p => dir === "next" ? p + 1 : p - 1);
      setFlipping(false);
    }, 420);
  }

  const entry = entries[currentPage];
  if (!entry) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(10,8,5,0.92)", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(8px)", padding: "20px",
    }}>
      <style>{`
        @keyframes flipNext {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(-180deg); }
        }
        @keyframes flipPrev {
          0% { transform: rotateY(-180deg); }
          100% { transform: rotateY(0deg); }
        }
        @keyframes barPulse {
          from { transform: scaleY(0.7); }
          to { transform: scaleY(1.1); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ position: "relative", maxWidth: 860, width: "100%" }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position: "absolute", top: -48, right: 0,
          background: "none", border: "1px solid rgba(255,255,255,0.2)",
          color: "rgba(255,255,255,0.6)", padding: "6px 16px", borderRadius: 2,
          fontFamily: "'Special Elite', monospace", fontSize: 12, cursor: "pointer",
          letterSpacing: "0.08em",
        }}>✕ CLOSE</button>

        {/* Page number */}
        <div style={{ textAlign: "center", marginBottom: 12, color: "rgba(255,255,255,0.3)", fontFamily: "'Special Elite', monospace", fontSize: 11, letterSpacing: "0.12em" }}>
          ENTRY {currentPage + 1} OF {entries.length}
        </div>

        {/* Book spread */}
        <div style={{
          display: "flex", perspective: "2000px",
          filter: "drop-shadow(0 32px 80px rgba(0,0,0,0.8))",
        }}>
          {/* Left page (previous glimpse or blank) */}
          <div style={{
            flex: 1, minHeight: 520,
            background: "linear-gradient(to right, #f5efe0, #ede4d0)",
            borderRadius: "8px 0 0 8px",
            boxShadow: "inset -8px 0 20px rgba(0,0,0,0.15), inset 4px 0 8px rgba(255,255,255,0.4)",
            padding: "40px 32px 40px 40px",
            position: "relative", overflow: "hidden",
            display: "flex", flexDirection: "column", justifyContent: "space-between",
          }}>
            {/* Page lines */}
            {Array.from({ length: 18 }, (_, i) => (
              <div key={i} style={{ position: "absolute", left: 60, right: 20, top: 60 + i * 26, height: 1, background: "rgba(150,120,80,0.12)" }} />
            ))}
            <div style={{ position: "absolute", left: 52, top: 0, bottom: 0, width: 1, background: "rgba(180,60,60,0.15)" }} />

            {currentPage > 0 ? (
              <div style={{ opacity: 0.5 }}>
                <div style={{ fontFamily: "'Special Elite', monospace", fontSize: 10, letterSpacing: "0.1em", color: "#8a7060", marginBottom: 12 }}>
                  {entries[currentPage - 1].date.toUpperCase()}
                </div>
                <p style={{ fontFamily: "'Lora', serif", fontSize: 13, color: "#6a5a4a", lineHeight: 1.9, fontStyle: "italic" }}>
                  {entries[currentPage - 1].content.slice(0, 180)}…
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", opacity: 0.25 }}>
                <span style={{ fontSize: 40, marginBottom: 12 }}>✉</span>
                <div style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", color: "#6a5a4a", fontSize: 15 }}>Begin your story</div>
              </div>
            )}

            <div style={{ textAlign: "right", fontFamily: "'Special Elite', monospace", fontSize: 10, color: "#a09080" }}>
              {currentPage > 0 ? currentPage : ""}
            </div>
          </div>

          {/* Spine shadow */}
          <div style={{ width: 12, background: "linear-gradient(90deg, rgba(0,0,0,0.25), rgba(0,0,0,0.05))", zIndex: 2 }} />

          {/* Right page — current entry */}
          <div style={{
            flex: 1,
            background: "linear-gradient(to left, #f2ead8, #ede4d0)",
            borderRadius: "0 8px 8px 0",
            boxShadow: "inset 8px 0 20px rgba(0,0,0,0.08)",
            padding: "40px 40px 40px 32px",
            position: "relative", overflow: "hidden",
            animation: flipping ? (flipDir === "next" ? "flipNext 0.42s ease-in-out" : "flipPrev 0.42s ease-in-out") : "none",
            transformOrigin: "left",
            transformStyle: "preserve-3d",
          }}>
            {Array.from({ length: 18 }, (_, i) => (
              <div key={i} style={{ position: "absolute", left: 20, right: 60, top: 60 + i * 26, height: 1, background: "rgba(150,120,80,0.12)" }} />
            ))}

            <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column" }}>
              {/* Entry header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <div style={{ fontFamily: "'Special Elite', monospace", fontSize: 10, letterSpacing: "0.12em", color: "#8a7060", marginBottom: 4 }}>
                    {entry.date.toUpperCase()}
                  </div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 11, color: "#6a5a4a", fontStyle: "italic" }}>
                    Delivers {entry.deliverAt}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "'Special Elite', monospace", fontSize: 9, letterSpacing: "0.1em", color: entry.delivered ? "#4a7a4a" : "#8a7060", background: entry.delivered ? "#e0f0e0" : "#f0e8d8", padding: "3px 8px", borderRadius: 2 }}>
                    {entry.delivered ? "✓ DELIVERED" : "📮 SEALED"}
                  </span>
                  <span style={{ fontSize: 11, color: "#8a7060", fontFamily: "'Special Elite', monospace", letterSpacing: "0.06em" }}>
                    {entry.type.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Prompt */}
              {entry.prompt && (
                <div style={{
                  fontFamily: "'Lora', serif", fontStyle: "italic", fontSize: 12, color: "#7a6a5a",
                  borderLeft: "2px solid rgba(150,100,60,0.3)", paddingLeft: 12, marginBottom: 20,
                  lineHeight: 1.6,
                }}>
                  "{entry.prompt}"
                </div>
              )}

              {/* Audio player */}
              {entry.type === "audio" && (
                <div style={{ marginBottom: 20 }}>
                  <AudioPlayer transcript={entry.transcript} />
                </div>
              )}

              {/* Content — handwritten style */}
              <div style={{ flex: 1, overflow: "hidden" }}>
                {entry.sealed && !entry.delivered ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 160, opacity: 0.5 }}>
                    <span style={{ fontSize: 32, marginBottom: 12 }}>🔒</span>
                    <div style={{ fontFamily: "'Lora', serif", fontStyle: "italic", fontSize: 14, color: "#6a5a4a", textAlign: "center" }}>
                      This capsule is sealed.<br />It will reveal itself on {entry.deliverAt}.
                    </div>
                  </div>
                ) : (
                  <p style={{
                    fontFamily: "'Lora', serif", fontSize: 14.5, lineHeight: 2,
                    color: "#3a2e24", whiteSpace: "pre-line", fontStyle: "italic",
                    marginBottom: 0,
                  }}>
                    {entry.content}
                  </p>
                )}
              </div>

              {/* Page number */}
              <div style={{ textAlign: "right", fontFamily: "'Special Elite', monospace", fontSize: 10, color: "#a09080", marginTop: 12 }}>
                {currentPage + 1}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation arrows */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, padding: "0 60px" }}>
          <button onClick={() => flip("prev")} disabled={currentPage === 0} style={{
            background: currentPage === 0 ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.15)", color: currentPage === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)",
            padding: "10px 28px", borderRadius: 2, fontFamily: "'Special Elite', monospace", fontSize: 12,
            cursor: currentPage === 0 ? "not-allowed" : "pointer", letterSpacing: "0.1em",
          }}>← PREV</button>

          <button onClick={onNewEntry} style={{
            background: "linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.1))",
            border: "1px solid rgba(201,168,76,0.4)", color: "rgba(201,168,76,0.9)",
            padding: "10px 28px", borderRadius: 2, fontFamily: "'Special Elite', monospace", fontSize: 12,
            cursor: "pointer", letterSpacing: "0.1em",
          }}>+ NEW ENTRY</button>

          <button onClick={() => flip("next")} disabled={currentPage >= entries.length - 1} style={{
            background: currentPage >= entries.length - 1 ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.15)", color: currentPage >= entries.length - 1 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)",
            padding: "10px 28px", borderRadius: 2, fontFamily: "'Special Elite', monospace", fontSize: 12,
            cursor: currentPage >= entries.length - 1 ? "not-allowed" : "pointer", letterSpacing: "0.1em",
          }}>NEXT →</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Wax Seal Studio ────────────────────────────────────────── */
function WaxSealStudio({ onConfirm }) {
  const [sealColor, setSealColor] = useState("#8b1a1a");
  const [sealEmoji, setSealEmoji] = useState("✦");
  const [sealImage, setSealImage] = useState(null);
  const [waxPoured, setWaxPoured] = useState(false);
  const [pouring, setPouring] = useState(false);

  const SEAL_COLORS = [
    { hex: "#8b1a1a", name: "Crimson" }, { hex: "#1a3a6b", name: "Sapphire" },
    { hex: "#1a5c2a", name: "Emerald" }, { hex: "#5c1a5c", name: "Amethyst" },
    { hex: "#1a4a4a", name: "Teal" }, { hex: "#6b4a1a", name: "Amber" },
    { hex: "#2a2a2a", name: "Ebony" }, { hex: "#8b6914", name: "Gold" },
  ];
  const EMOJIS = ["✦", "🌙", "🌿", "🌸", "🕊", "⭐", "♦", "🔮", "🦋", "🌊", "🍃", "🌹"];

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setSealImage(ev.target.result);
    reader.readAsDataURL(file);
  }

  function pourWax() {
    setPouring(true);
    setTimeout(() => { setPouring(false); setWaxPoured(true); }, 900);
  }

  return (
    <div style={{ animation: "fadeUp 0.5s ease" }}>
      <style>{`
        @keyframes pourDrip {
          0% { height: 0; opacity: 0; }
          60% { height: 40px; opacity: 1; }
          100% { height: 0; opacity: 0; transform: translateY(40px) scaleX(1.5); }
        }
        @keyframes sealAppear {
          0% { transform: scale(0.3) rotate(-15deg); opacity: 0; }
          60% { transform: scale(1.08) rotate(3deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 400, marginBottom: 6 }}>
        Craft your wax seal
      </h2>
      <p style={{ color: "#7a6a5a", marginBottom: 32, fontFamily: "'Lora', serif", fontStyle: "italic", fontSize: 15 }}>
        Choose your wax color, upload artwork or pick a symbol — then pour.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
        {/* Left: controls */}
        <div>
          {/* Wax color */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: "'Special Elite', monospace", fontSize: 11, letterSpacing: "0.12em", color: "#7a6a5a", marginBottom: 12, textTransform: "uppercase" }}>Wax Color</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {SEAL_COLORS.map(c => (
                <button key={c.hex} title={c.name} onClick={() => { setSealColor(c.hex); setWaxPoured(false); }} style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: `radial-gradient(circle at 35% 35%, ${lighten(c.hex, 30)}, ${c.hex})`,
                  border: sealColor === c.hex ? "3px solid #c9a84c" : "2px solid transparent",
                  cursor: "pointer", outline: "none",
                  boxShadow: sealColor === c.hex ? "0 0 0 1px #c9a84c" : "0 2px 6px rgba(0,0,0,0.3)",
                  transition: "transform 0.15s", transform: sealColor === c.hex ? "scale(1.1)" : "scale(1)",
                }} />
              ))}
            </div>
          </div>

          {/* Symbol */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: "'Special Elite', monospace", fontSize: 11, letterSpacing: "0.12em", color: "#7a6a5a", marginBottom: 12, textTransform: "uppercase" }}>Symbol</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => { setSealEmoji(e); setSealImage(null); setWaxPoured(false); }} style={{
                  width: 40, height: 40, borderRadius: 6,
                  background: sealEmoji === e && !sealImage ? "rgba(201,168,76,0.15)" : "rgba(0,0,0,0.04)",
                  border: `1.5px solid ${sealEmoji === e && !sealImage ? "#c9a84c" : "rgba(0,0,0,0.1)"}`,
                  fontSize: 18, cursor: "pointer", transition: "all 0.15s",
                }}>{e}</button>
              ))}
            </div>
          </div>

          {/* Image upload */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: "'Special Elite', monospace", fontSize: 11, letterSpacing: "0.12em", color: "#7a6a5a", marginBottom: 12, textTransform: "uppercase" }}>Or Upload Custom Art</div>
            <label style={{
              display: "flex", alignItems: "center", gap: 12,
              background: sealImage ? "rgba(201,168,76,0.1)" : "rgba(0,0,0,0.04)",
              border: `2px dashed ${sealImage ? "#c9a84c" : "rgba(0,0,0,0.15)"}`,
              borderRadius: 8, padding: "16px 20px", cursor: "pointer",
              transition: "all 0.2s",
            }}>
              <span style={{ fontSize: 24 }}>{sealImage ? "✓" : "📷"}</span>
              <div>
                <div style={{ fontFamily: "'Lora', serif", fontSize: 14, color: "#3a2e24" }}>
                  {sealImage ? "Image uploaded — etched on wax" : "Upload a photo or drawing"}
                </div>
                <div style={{ fontFamily: "'Special Elite', monospace", fontSize: 10, color: "#8a7a6a", marginTop: 2 }}>
                  The outline will be engraved into the seal
                </div>
              </div>
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
            </label>
            {sealImage && (
              <button onClick={() => { setSealImage(null); setWaxPoured(false); }} style={{
                marginTop: 8, background: "none", border: "none", color: "#8a7a6a",
                fontFamily: "'Special Elite', monospace", fontSize: 11, cursor: "pointer",
              }}>✕ Remove image</button>
            )}
          </div>
        </div>

        {/* Right: preview & pour */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ marginBottom: 24, textAlign: "center" }}>
            <div style={{ fontFamily: "'Special Elite', monospace", fontSize: 10, letterSpacing: "0.12em", color: "#8a7a6a", marginBottom: 16, textTransform: "uppercase" }}>Preview</div>

            {/* Candle drip animation */}
            <div style={{ position: "relative", display: "inline-block" }}>
              {pouring && (
                <div style={{
                  position: "absolute", top: -48, left: "50%", transform: "translateX(-50%)",
                  width: 8, borderRadius: 4,
                  background: `linear-gradient(180deg, ${lighten(sealColor, 20)}, ${sealColor})`,
                  animation: "pourDrip 0.9s ease forwards",
                  transformOrigin: "top",
                }} />
              )}

              <div style={{ animation: waxPoured ? "sealAppear 0.6s cubic-bezier(0.34,1.3,0.64,1) forwards" : "none" }}>
                <WaxSealCanvas
                  color={sealColor}
                  size={140}
                  imageData={sealImage}
                  emoji={sealEmoji}
                />
              </div>
            </div>

            {!waxPoured && (
              <div style={{ marginTop: 20 }}>
                <button onClick={pourWax} disabled={pouring} style={{
                  background: `linear-gradient(135deg, ${sealColor}, ${darken(sealColor, 15)})`,
                  color: "rgba(255,220,120,0.9)", border: "none",
                  padding: "12px 32px", borderRadius: 4, fontFamily: "'Special Elite', monospace",
                  fontSize: 13, letterSpacing: "0.1em", cursor: "pointer",
                  boxShadow: `0 6px 24px ${sealColor}66`,
                  opacity: pouring ? 0.7 : 1,
                }}>
                  {pouring ? "Pouring…" : "🕯 Pour Wax"}
                </button>
                <div style={{ fontFamily: "'Lora', serif", fontStyle: "italic", fontSize: 12, color: "#8a7a6a", marginTop: 8 }}>
                  Watch the seal form
                </div>
              </div>
            )}

            {waxPoured && (
              <div style={{ marginTop: 20, animation: "fadeUp 0.4s ease" }}>
                <div style={{ fontFamily: "'Lora', serif", fontStyle: "italic", fontSize: 13, color: "#5a7a5a", marginBottom: 16 }}>
                  ✓ Seal is set
                </div>
                <button onClick={() => onConfirm({ color: sealColor, emoji: sealEmoji, image: sealImage })} style={{
                  background: "linear-gradient(135deg, #c9a84c, #a07830)",
                  color: "#1a1008", border: "none", padding: "12px 32px",
                  fontFamily: "'Special Elite', monospace", fontSize: 13, letterSpacing: "0.1em",
                  cursor: "pointer", borderRadius: 2,
                  boxShadow: "0 6px 24px rgba(201,168,76,0.4)",
                }}>
                  Use This Seal →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── New Entry Form ─────────────────────────────────────────── */
function NewEntryForm({ onSave, onCancel, cover }) {
  const [step, setStep] = useState(1); // 1=type, 2=write, 3=seal
  const [type, setType] = useState("text");
  const [text, setText] = useState("");
  const [prompt, setPrompt] = useState(null);
  const [years, setYears] = useState(1);
  const [sealData, setSealData] = useState({ color: "#8b1a1a", emoji: "✦", image: null });
  const [sealed, setSealed] = useState(false);

  function handleSave() {
    setSealed(true);
    setTimeout(() => {
      onSave({
        id: Date.now(), type, content: text, prompt, sealed: true, delivered: false,
        date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        deliverAt: new Date(Date.now() + years * 365.25 * 86400000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        sealColor: sealData.color, sealEmoji: sealData.emoji, sealImage: sealData.image,
      });
    }, 800);
  }

  return (
    <div style={{
      background: "#f5efe0",
      borderRadius: 12, padding: "48px",
      boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.1)",
      maxWidth: 680, width: "100%", margin: "0 auto",
      fontFamily: "'Lora', serif",
      position: "relative",
      animation: "fadeUp 0.5s ease",
    }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform: translateY(16px); } to { opacity:1; transform: translateY(0); } }
      `}</style>

      {/* Ruled lines */}
      {Array.from({ length: 20 }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: 72, right: 32, top: 90 + i * 28, height: 1, background: "rgba(140,100,60,0.1)", pointerEvents: "none" }} />
      ))}
      <div style={{ position: "absolute", left: 64, top: 0, bottom: 0, width: 1, background: "rgba(180,60,60,0.12)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Step indicators */}
        <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ flex: 1, height: 2, borderRadius: 1, background: s <= step ? "#8b4a2a" : "rgba(0,0,0,0.1)", transition: "background 0.4s" }} />
          ))}
        </div>

        {/* Step 1: Type */}
        {step === 1 && (
          <div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 400, fontSize: 26, marginBottom: 6, color: "#2a1e14" }}>
              What will you leave behind?
            </h3>
            <p style={{ color: "#7a6050", marginBottom: 28, fontStyle: "italic", fontSize: 15 }}>Choose how you want your future self to experience this moment.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 32 }}>
              {[
                { id: "text", icon: "✍", label: "Written", sub: "A letter in your hand" },
                { id: "audio", icon: "🎙", label: "Voice", sub: "Your actual voice" },
                { id: "video", icon: "📹", label: "Video", sub: "Your face, preserved" },
              ].map(opt => (
                <button key={opt.id} onClick={() => setType(opt.id)} style={{
                  background: type === opt.id ? "rgba(139,74,42,0.1)" : "rgba(255,255,255,0.5)",
                  border: `2px solid ${type === opt.id ? "#8b4a2a" : "rgba(0,0,0,0.12)"}`,
                  borderRadius: 10, padding: "20px 16px", textAlign: "center", cursor: "pointer",
                  transition: "all 0.2s",
                }}>
                  <div style={{ fontSize: 26, marginBottom: 8 }}>{opt.icon}</div>
                  <div style={{ fontFamily: "'Special Elite', monospace", fontSize: 13, color: "#2a1e14", marginBottom: 4 }}>{opt.label}</div>
                  <div style={{ fontFamily: "'Lora', serif", fontSize: 11, color: "#7a6050", fontStyle: "italic" }}>{opt.sub}</div>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(2)} style={{
              width: "100%", background: "#8b4a2a", color: "rgba(255,220,150,0.95)", border: "none",
              padding: "14px", fontFamily: "'Special Elite', monospace", fontSize: 13, letterSpacing: "0.1em", borderRadius: 2, cursor: "pointer",
            }}>CONTINUE →</button>
          </div>
        )}

        {/* Step 2: Write */}
        {step === 2 && (
          <div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 400, fontSize: 26, marginBottom: 6, color: "#2a1e14" }}>
              {type === "text" ? "Write your letter" : type === "audio" ? "Your voice note" : "Your video message"}
            </h3>
            {/* Prompts */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "'Special Elite', monospace", fontSize: 10, letterSpacing: "0.12em", color: "#8a7060", marginBottom: 10, textTransform: "uppercase" }}>Reflection prompts</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {PROMPTS.slice(0, 5).map(p => (
                  <button key={p} onClick={() => { setPrompt(p); setText(p + "\n\nDear future me,\n\n"); }} style={{
                    background: prompt === p ? "#8b4a2a" : "rgba(139,74,42,0.07)",
                    color: prompt === p ? "rgba(255,220,150,0.95)" : "#5a4030",
                    border: `1px solid ${prompt === p ? "#8b4a2a" : "rgba(139,74,42,0.2)"}`,
                    borderRadius: 4, padding: "6px 12px", fontSize: 11,
                    fontFamily: "'Special Elite', monospace", cursor: "pointer", transition: "all 0.2s",
                  }}>
                    {p.slice(0, 35)}…
                  </button>
                ))}
              </div>
            </div>

            {type === "text" ? (
              <textarea value={text} onChange={e => setText(e.target.value)}
                placeholder={"Dear future me,\n\nI'm writing this on a quiet evening…"}
                style={{
                  width: "100%", height: 220, background: "transparent", border: "none",
                  fontFamily: "'Lora', serif", fontStyle: "italic", fontSize: 15,
                  lineHeight: 2, color: "#2a1e14", resize: "none", outline: "none",
                  padding: "0 0 0 4px",
                }} />
            ) : (
              <div style={{ background: "rgba(139,74,42,0.06)", border: "2px dashed rgba(139,74,42,0.2)", borderRadius: 8, padding: "32px", textAlign: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{type === "audio" ? "🎙" : "📹"}</div>
                <div style={{ fontFamily: "'Lora', serif", fontStyle: "italic", fontSize: 14, color: "#7a6050", marginBottom: 16 }}>
                  {type === "audio" ? "Audio" : "Video"} recording available in full app
                </div>
                <textarea value={text} onChange={e => setText(e.target.value)}
                  placeholder="Add a note to accompany your recording…"
                  style={{ width: "100%", height: 100, background: "rgba(255,255,255,0.5)", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 6, padding: "12px", fontFamily: "'Lora', serif", fontSize: 14, color: "#2a1e14", resize: "none", outline: "none" }} />
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "'Special Elite', monospace", fontSize: 10, letterSpacing: "0.12em", color: "#8a7060", marginBottom: 10, textTransform: "uppercase" }}>
                Deliver in {years} year{years > 1 ? "s" : ""}
              </div>
              <input type="range" min={1} max={5} value={years} onChange={e => setYears(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#8b4a2a" }} />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep(1)} style={{ background: "none", border: "1px solid rgba(0,0,0,0.15)", color: "#7a6050", padding: "12px 20px", fontFamily: "'Special Elite', monospace", fontSize: 12, borderRadius: 2, cursor: "pointer" }}>← BACK</button>
              <button onClick={() => setStep(3)} disabled={!text.trim()} style={{
                flex: 1, background: text.trim() ? "#8b4a2a" : "rgba(0,0,0,0.1)",
                color: text.trim() ? "rgba(255,220,150,0.95)" : "#a09080",
                border: "none", padding: "12px", fontFamily: "'Special Elite', monospace", fontSize: 13, letterSpacing: "0.1em", borderRadius: 2, cursor: text.trim() ? "pointer" : "not-allowed",
              }}>CHOOSE SEAL →</button>
            </div>
          </div>
        )}

        {/* Step 3: Wax Seal Studio */}
        {step === 3 && (
          <div>
            <WaxSealStudio onConfirm={data => { setSealData(data); handleSave(); }} />
            <button onClick={() => setStep(2)} style={{ marginTop: 20, background: "none", border: "1px solid rgba(0,0,0,0.15)", color: "#7a6050", padding: "10px 20px", fontFamily: "'Special Elite', monospace", fontSize: 12, borderRadius: 2, cursor: "pointer" }}>← BACK</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Cover Customizer ───────────────────────────────────────── */
function CoverCustomizer({ cover, title, onSave, customImage }) {
  const [localCover, setLocalCover] = useState(cover);
  const [localTitle, setLocalTitle] = useState(title);
  const [localImage, setLocalImage] = useState(customImage);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "start" }}>
      <div>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 400, fontSize: 24, marginBottom: 24, color: "#2a1e14" }}>
          Design your cover
        </h3>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: "'Special Elite', monospace", fontSize: 10, letterSpacing: "0.12em", color: "#8a7060", marginBottom: 12, textTransform: "uppercase" }}>Leather Color</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {COVER_COLORS.map(c => (
              <button key={c.id} title={c.label} onClick={() => setLocalCover(c)} style={{
                width: 36, height: 36, borderRadius: 4,
                background: `linear-gradient(135deg, ${lighten(c.leather, 15)}, ${c.leather})`,
                border: localCover.id === c.id ? "3px solid #c9a84c" : "2px solid transparent",
                cursor: "pointer",
                boxShadow: localCover.id === c.id ? "0 0 0 1px #c9a84c" : "0 2px 6px rgba(0,0,0,0.2)",
                transition: "transform 0.15s",
                transform: localCover.id === c.id ? "scale(1.1)" : "scale(1)",
              }} />
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: "'Special Elite', monospace", fontSize: 10, letterSpacing: "0.12em", color: "#8a7060", marginBottom: 12, textTransform: "uppercase" }}>Journal Title</div>
          <input value={localTitle} onChange={e => setLocalTitle(e.target.value)} maxLength={40}
            placeholder="My Journal"
            style={{
              width: "100%", background: "rgba(255,255,255,0.6)", border: "1px solid rgba(0,0,0,0.15)",
              borderRadius: 4, padding: "10px 14px", fontFamily: "'Playfair Display', serif",
              fontStyle: "italic", fontSize: 16, color: "#2a1e14", outline: "none",
            }} />
        </div>

        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "'Special Elite', monospace", fontSize: 10, letterSpacing: "0.12em", color: "#8a7060", marginBottom: 12, textTransform: "uppercase" }}>Cover Image (optional)</div>
          <label style={{
            display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
            background: localImage ? "rgba(201,168,76,0.1)" : "rgba(0,0,0,0.04)",
            border: `2px dashed ${localImage ? "#c9a84c" : "rgba(0,0,0,0.15)"}`,
            borderRadius: 8, padding: "16px", transition: "all 0.2s",
          }}>
            <span style={{ fontSize: 20 }}>{localImage ? "✓" : "🖼"}</span>
            <div style={{ fontFamily: "'Lora', serif", fontSize: 14, color: "#3a2e24", fontStyle: "italic" }}>
              {localImage ? "Cover photo set" : "Upload a cover photo"}
            </div>
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
              const f = e.target.files[0];
              if (!f) return;
              const r = new FileReader();
              r.onload = ev => setLocalImage(ev.target.result);
              r.readAsDataURL(f);
            }} />
          </label>
        </div>

        <button onClick={() => onSave(localCover, localTitle, localImage)} style={{
          background: "#8b4a2a", color: "rgba(255,220,150,0.95)", border: "none",
          padding: "12px 32px", fontFamily: "'Special Elite', monospace", fontSize: 13,
          letterSpacing: "0.1em", borderRadius: 2, cursor: "pointer",
        }}>Save Cover</button>
      </div>

      <div style={{ display: "flex", justifyContent: "center", paddingTop: 20 }}>
        <BookCover cover={localCover} title={localTitle} customImage={localImage} onOpen={() => {}} />
      </div>
    </div>
  );
}

/* ─── Main App ───────────────────────────────────────────────── */
export default function App() {
  const [screen, setScreen] = useState("home"); // home | customize | new
  const [journalOpen, setJournalOpen] = useState(false);
  const [entries, setEntries] = useState(SAMPLE_ENTRIES);
  const [cover, setCover] = useState(COVER_COLORS[0]);
  const [journalTitle, setJournalTitle] = useState("Letters to the Future");
  const [coverImage, setCoverImage] = useState(null);

  function addEntry(entry) {
    setEntries(prev => [entry, ...prev]);
    setScreen("home");
    setJournalOpen(true);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 20% 50%, #1a0f08 0%, #0d0804 60%, #080503 100%)",
      color: "#e8ddd0",
      fontFamily: "'Lora', serif",
    }}>
      <style>{`
        @import url('${FONT_LINK}');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity:0;transform:translateY(16px); } to { opacity:1;transform:translateY(0); } }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes grain {
          0%,100%{transform:translate(0,0)} 10%{transform:translate(-2%,-2%)} 20%{transform:translate(2%,2%)}
          30%{transform:translate(-1%,2%)} 40%{transform:translate(1%,-1%)} 50%{transform:translate(-2%,1%)}
          60%{transform:translate(2%,-2%)} 70%{transform:translate(-1%,-1%)} 80%{transform:translate(1%,2%)} 90%{transform:translate(-2%,1%)}
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.3); border-radius: 2px; }
        .seal-upload-label { pointer-events: none; }
        label:hover .seal-upload-label { opacity: 1 !important; }
      `}</style>

      {/* Grain overlay */}
      <div style={{
        position: "fixed", inset: "-50%", pointerEvents: "none", zIndex: 0, opacity: 0.04,
        background: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        animation: "grain 0.5s steps(1) infinite",
      }} />

      {/* Nav */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "18px 40px", display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(201,168,76,0.1)",
        background: "rgba(10,6,3,0.85)", backdropFilter: "blur(12px)",
      }}>
        <button onClick={() => { setScreen("home"); setJournalOpen(false); }} style={{
          background: "none", border: "none", color: "rgba(201,168,76,0.8)", fontSize: 16,
          fontFamily: "'Playfair Display', serif", fontStyle: "italic", cursor: "pointer", letterSpacing: "0.04em",
        }}>✉ Future Self</button>
        <div style={{ display: "flex", gap: 28 }}>
          {[
            { id: "home", label: "Journal" },
            { id: "customize", label: "Customize Cover" },
            { id: "new", label: "+ New Entry" },
          ].map(({ id, label }) => (
            <button key={id} onClick={() => { setScreen(id); setJournalOpen(false); }} style={{
              background: "none", border: "none",
              color: screen === id ? "rgba(201,168,76,0.9)" : "rgba(255,255,255,0.35)",
              fontFamily: "'Special Elite', monospace", fontSize: 11, letterSpacing: "0.12em",
              textTransform: "uppercase", cursor: "pointer", transition: "color 0.2s",
            }}>{label}</button>
          ))}
        </div>
      </nav>

      <div style={{ paddingTop: 80 }}>
        {/* HOME: show journal book */}
        {screen === "home" && !journalOpen && (
          <div style={{ minHeight: "calc(100vh - 80px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 32px", animation: "fadeUp 0.7s ease" }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <p style={{ color: "rgba(201,168,76,0.5)", fontFamily: "'Special Elite', monospace", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 16 }}>
                Your time capsule journal
              </p>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px,4vw,44px)", fontWeight: 400, fontStyle: "italic", color: "rgba(232,221,208,0.95)", marginBottom: 8, lineHeight: 1.2 }}>
                {journalTitle}
              </h1>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, fontStyle: "italic", marginBottom: 48 }}>
                {entries.length} entr{entries.length !== 1 ? "ies" : "y"} sealed within
              </p>
            </div>

            {/* Book */}
            <div style={{ animation: "float 5s ease-in-out infinite", marginBottom: 48 }}>
              <BookCover cover={cover} title={journalTitle} customImage={coverImage} onOpen={() => setJournalOpen(true)} />
            </div>

            <button onClick={() => setJournalOpen(true)} style={{
              background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)",
              color: "rgba(201,168,76,0.8)", padding: "12px 36px", borderRadius: 2,
              fontFamily: "'Special Elite', monospace", fontSize: 12, letterSpacing: "0.15em",
              textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s",
            }}
              onMouseOver={e => { e.target.style.background = "rgba(201,168,76,0.2)"; }}
              onMouseOut={e => { e.target.style.background = "rgba(201,168,76,0.1)"; }}
            >Open Journal</button>
          </div>
        )}

        {/* JOURNAL open */}
        {journalOpen && (
          <Journal entries={entries} cover={cover} onClose={() => setJournalOpen(false)} onNewEntry={() => { setJournalOpen(false); setScreen("new"); }} />
        )}

        {/* CUSTOMIZE COVER */}
        {screen === "customize" && !journalOpen && (
          <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 40px", animation: "fadeUp 0.5s ease" }}>
            <CoverCustomizer
              cover={cover} title={journalTitle} customImage={coverImage}
              onSave={(c, t, img) => { setCover(c); setJournalTitle(t); setCoverImage(img); setScreen("home"); }}
            />
          </div>
        )}

        {/* NEW ENTRY */}
        {screen === "new" && !journalOpen && (
          <div style={{ padding: "48px 32px", display: "flex", justifyContent: "center", animation: "fadeUp 0.5s ease" }}>
            <NewEntryForm onSave={addEntry} onCancel={() => setScreen("home")} cover={cover} />
          </div>
        )}
      </div>
    </div>
  );
}
