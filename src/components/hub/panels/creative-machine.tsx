"use client";

import { useState } from "react";
import {
  Sparkles,
  ImageIcon,
  Loader2,
  Download,
  Copy,
  RefreshCw,
  Video,
} from "lucide-react";
import { GEM, GLOW } from "@/lib/cave-theme";

// ── Types ──────────────────────────────────────────────────────────────────────

type AspectRatio = "16:9" | "1:1" | "9:16" | "4:3";

const ASPECT_OPTIONS: { value: AspectRatio; label: string; desc: string }[] = [
  { value: "16:9",  label: "16:9",  desc: "Landscape / Facebook" },
  { value: "1:1",   label: "1:1",   desc: "Square / Instagram" },
  { value: "9:16",  label: "9:16",  desc: "Story / Reel" },
  { value: "4:3",   label: "4:3",   desc: "Classic" },
];

const STYLE_PRESETS = [
  { label: "Cinematic",      value: "cinematic, dramatic lighting, film grain" },
  { label: "Photorealistic", value: "photorealistic, natural lighting, DSLR" },
  { label: "Luxury",         value: "luxury real estate photography, golden hour, warm tones" },
  { label: "Editorial",      value: "editorial style, magazine quality, clean composition" },
  { label: "Aerial",         value: "aerial drone photography, wide angle, blue sky" },
  { label: "Raw",            value: "" },
];

const QUICK_PROMPTS = [
  "Stunning modern home exterior at golden hour with manicured lawn",
  "Bright open-plan kitchen with marble countertops and natural light",
  "Cozy living room with fireplace, neutral tones, and large windows",
  "Aerial view of upscale neighborhood with tree-lined streets",
  "Luxury pool deck overlooking city skyline at dusk",
  "Master bedroom suite with floor-to-ceiling windows and mountain view",
];

// ── Component ─────────────────────────────────────────────────────────────────

export function CreativeMachine() {
  const [prompt, setPrompt]           = useState("");
  const [aspect, setAspect]           = useState<AspectRatio>("16:9");
  const [style, setStyle]             = useState(STYLE_PRESETS[0].value);
  const [generating, setGenerating]   = useState(false);
  const [imageUrl, setImageUrl]       = useState<string | null>(null);
  const [predictionId, setPredictionId] = useState<string | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [copied, setCopied]           = useState(false);
  const [animating, setAnimating]     = useState(false);
  const [videoUrl, setVideoUrl]       = useState<string | null>(null);
  const [animateLoop, setAnimateLoop] = useState(false);

  async function generate() {
    if (!prompt.trim()) return;
    setGenerating(true);
    setError(null);
    setImageUrl(null);

    try {
      const res = await fetch("/api/creative/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), aspectRatio: aspect, style }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setImageUrl(data.imageUrl);
      setPredictionId(data.predictionId ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  }

  async function animate() {
    if (!imageUrl) return;
    setAnimating(true);
    setVideoUrl(null);
    setError(null);

    try {
      const res = await fetch("/api/creative/animate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          prompt: prompt.trim() || undefined,
          loop: animateLoop,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Animation failed");
      setVideoUrl(data.videoUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Animation failed");
    } finally {
      setAnimating(false);
    }
  }

  async function downloadImage() {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `leadmine-creative-${Date.now()}.webp`;
    a.target = "_blank";
    a.click();
  }

  function copyPrompt() {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div style={{
          width: 10, height: 14,
          clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)",
          background: GEM.diamond,
          filter: `drop-shadow(0 0 6px ${GEM.diamond})`,
        }} />
        <div>
          <h2 className="text-sm font-semibold text-white">Creative Machine</h2>
          <p className="text-xs" style={{ color: "#444" }}>Flux 1.1 Pro · Luma Dream Machine</p>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-2 gap-5">

        {/* Left — controls */}
        <div className="space-y-4">

          {/* Prompt */}
          <div className="rounded-2xl border p-4 space-y-3" style={{ background: "#080808", borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Prompt</span>
              <button
                onClick={copyPrompt}
                disabled={!prompt}
                className="flex items-center gap-1.5 text-xs transition-colors disabled:opacity-30"
                style={{ color: copied ? GEM.green : "#444" }}
              >
                <Copy size={11} />
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => e.key === "Enter" && e.metaKey && generate()}
              placeholder="Describe the image you want to generate…"
              rows={4}
              className="w-full resize-none rounded-xl px-3 py-2.5 text-sm text-white placeholder-neutral-800 focus:outline-none leading-relaxed"
              style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.06)" }}
            />

            {/* Quick prompts */}
            <div>
              <p className="text-xs mb-2" style={{ color: "#333" }}>Quick start</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPrompt(p)}
                    className="text-xs px-2.5 py-1 rounded-lg transition-colors"
                    style={{
                      background: "#111",
                      border: "1px solid rgba(255,255,255,0.06)",
                      color: "#555",
                    }}
                  >
                    {p.split(" ").slice(0, 4).join(" ")}…
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Aspect ratio */}
          <div className="rounded-2xl border p-4 space-y-3" style={{ background: "#080808", borderColor: "rgba(255,255,255,0.06)" }}>
            <span className="text-xs font-semibold text-white">Aspect Ratio</span>
            <div className="grid grid-cols-4 gap-2">
              {ASPECT_OPTIONS.map((opt) => {
                const active = aspect === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setAspect(opt.value)}
                    className="rounded-xl py-2.5 text-center transition-all"
                    style={{
                      background: active ? `${GEM.diamond}15` : "#0f0f0f",
                      border: `1px solid ${active ? GEM.diamond + "50" : "rgba(255,255,255,0.06)"}`,
                    }}
                  >
                    <div className="text-xs font-bold" style={{ color: active ? GEM.diamond : "#444" }}>
                      {opt.label}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "#2a2a2a", fontSize: 9 }}>
                      {opt.desc.split(" / ")[0]}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Style */}
          <div className="rounded-2xl border p-4 space-y-3" style={{ background: "#080808", borderColor: "rgba(255,255,255,0.06)" }}>
            <span className="text-xs font-semibold text-white">Style</span>
            <div className="grid grid-cols-3 gap-2">
              {STYLE_PRESETS.map((s) => {
                const active = style === s.value;
                return (
                  <button
                    key={s.label}
                    onClick={() => setStyle(s.value)}
                    className="rounded-xl py-2 text-xs transition-all"
                    style={{
                      background: active ? `${GEM.yellow}15` : "#0f0f0f",
                      border: `1px solid ${active ? GEM.yellow + "50" : "rgba(255,255,255,0.06)"}`,
                      color: active ? GEM.yellow : "#444",
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={generating || !prompt.trim()}
            className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40"
            style={{
              background: (!generating && prompt.trim()) ? GEM.green : "#111",
              color: (!generating && prompt.trim()) ? "#000" : "#333",
              boxShadow: (!generating && prompt.trim()) ? GLOW.green.medium : "none",
            }}
          >
            {generating ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Generating… (10–20s)
              </>
            ) : (
              <>
                <Sparkles size={15} />
                Generate Image
                <span className="text-xs opacity-60 ml-1">⌘↵</span>
              </>
            )}
          </button>
        </div>

        {/* Right — preview */}
        <div className="space-y-3">
          <div
            className="rounded-2xl border overflow-hidden flex items-center justify-center relative"
            style={{
              background: "#050505",
              borderColor: imageUrl ? `${GEM.diamond}30` : "rgba(255,255,255,0.05)",
              aspectRatio: aspect === "16:9" ? "16/9" : aspect === "1:1" ? "1/1" : aspect === "9:16" ? "9/16" : "4/3",
              minHeight: 240,
            }}
          >
            {generating && (
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div style={{
                    width: 28, height: 38,
                    clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)",
                    background: GEM.diamond,
                    filter: `drop-shadow(0 0 12px ${GEM.diamond})`,
                    animation: "pulse 1.5s ease-in-out infinite",
                  }} />
                </div>
                <p className="text-xs" style={{ color: "#444" }}>Flux 1.1 Pro rendering…</p>
              </div>
            )}
            {!generating && !imageUrl && (
              <div className="flex flex-col items-center gap-2 p-6 text-center">
                <ImageIcon size={28} style={{ color: "#1a1a1a" }} />
                <p className="text-xs" style={{ color: "#2a2a2a" }}>
                  Your generated image will appear here
                </p>
              </div>
            )}
            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt="Generated creative"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl px-4 py-3 text-xs" style={{
              background: "#1a0505",
              border: "1px solid rgba(255,60,60,0.2)",
              color: "#ff6060",
            }}>
              {error}
            </div>
          )}

          {/* Actions */}
          {imageUrl && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={downloadImage}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: "#0f0f0f",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#888",
                }}
              >
                <Download size={13} />
                Download
              </button>
              <button
                onClick={generate}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: "#0f0f0f",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#888",
                }}
              >
                <RefreshCw size={13} />
                Regenerate
              </button>
            </div>
          )}

          {/* Luma animate */}
          <div
            className="rounded-2xl border p-4 space-y-3"
            style={{
              background: "#080808",
              borderColor: imageUrl ? `${GEM.green}25` : "rgba(255,255,255,0.05)",
            }}
          >
            <div className="flex items-center gap-2">
              <Video size={13} style={{ color: imageUrl ? GEM.green : "#333" }} />
              <span className="text-xs font-semibold" style={{ color: imageUrl ? "#fff" : "#333" }}>
                Animate with Luma Dream Machine
              </span>
            </div>

            {!imageUrl && (
              <p className="text-xs" style={{ color: "#2a2a2a" }}>
                Generate an image first to unlock animation.
              </p>
            )}

            {imageUrl && (
              <>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setAnimateLoop(v => !v)}
                    className="relative rounded-full transition-colors"
                    style={{
                      width: 28, height: 16,
                      background: animateLoop ? GEM.green : "#1a1a1a",
                      border: `1px solid ${animateLoop ? GEM.green : "rgba(255,255,255,0.1)"}`,
                    }}
                  >
                    <div
                      className="absolute top-0.5 rounded-full transition-transform"
                      style={{
                        width: 12, height: 12,
                        background: "#fff",
                        transform: animateLoop ? "translateX(13px)" : "translateX(1px)",
                      }}
                    />
                  </div>
                  <span className="text-xs" style={{ color: "#555" }}>Loop video</span>
                </label>

                <button
                  onClick={animate}
                  disabled={animating}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                  style={{
                    background: !animating ? `${GEM.green}18` : "#0f0f0f",
                    border: `1px solid ${!animating ? GEM.green + "50" : "rgba(255,255,255,0.06)"}`,
                    color: !animating ? GEM.green : "#444",
                    boxShadow: !animating ? GLOW.green.soft : "none",
                  }}
                >
                  {animating ? (
                    <>
                      <Video size={13} className="animate-pulse" />
                      Animating… (~60s)
                    </>
                  ) : (
                    <>
                      <Video size={13} />
                      Animate Image
                    </>
                  )}
                </button>
              </>
            )}
          </div>

          {/* Video preview */}
          {videoUrl && (
            <div className="rounded-2xl overflow-hidden border" style={{ borderColor: `${GEM.green}30` }}>
              <video
                src={videoUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full"
              />
              <div className="flex gap-2 p-3" style={{ background: "#080808" }}>
                <a
                  href={videoUrl}
                  download={`leadmine-video-${Date.now()}.mp4`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: "#0f0f0f",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#888",
                  }}
                >
                  <Download size={13} />
                  Download Video
                </a>
                <button
                  onClick={animate}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: "#0f0f0f",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#888",
                  }}
                >
                  <RefreshCw size={13} />
                  Redo
                </button>
              </div>
            </div>
          )}

          {/* Prediction ID for reference */}
          {predictionId && (
            <p className="text-xs text-center" style={{ color: "#222" }}>
              Prediction: {predictionId}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
