"use client";

import { useState } from "react";

type Result = { portfolioHash: string; allocations: { assetId: string; weight: number; reason: string }[]; mandate: Record<string, unknown>; execution: { blockers: string[] }; health: Record<string, number> };

export default function Home() {
  const [prompt, setPrompt] = useState("Build me a diversified AI infrastructure portfolio with at least 6 assets and no company above 20%.");
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function build() {
    setBusy(true); setError("");
    try { const response = await fetch("/api/portfolio", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error); setResult(body); }
    catch (value) { setError(value instanceof Error ? value.message : "Unable to build portfolio"); }
    finally { setBusy(false); }
  }
  return <main>
    <header><span className="mark">SP</span><span>StockPilot</span><span className="badge">SIMULATION MODE</span></header>
    <section className="hero"><p className="eyebrow">INTENT-DRIVEN PORTFOLIO CONSTRUCTION</p><h1>Describe the portfolio<br />you want.</h1><p className="lede">Turn a thesis into a transparent, constraint-aware portfolio proposal. AI suggests; deterministic rules validate.</p><div className="builder"><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} /><button onClick={build} disabled={busy}>{busy ? "BUILDING…" : "Build portfolio"}</button></div>{error && <p className="error">{error}</p>}<p className="hint">Try: “growth tech, avoid fossil fuels, at least 6 companies, cap each at 15%.”</p></section>
    {result && <section className="result"><div className="result-head"><div><p className="eyebrow">YOUR PORTFOLIO</p><h2>{String(result.mandate.theme)}</h2><p className="muted">Validated proposal · hash {result.portfolioHash.slice(0, 18)}…</p></div><div className="health">{Math.round(Object.values(result.health).reduce((a, b) => a + b, 0) / Object.values(result.health).length)}<small>HEALTH</small></div></div><div className="allocations">{result.allocations.map((allocation) => <div className="allocation" key={allocation.assetId}><div><strong>{allocation.assetId}</strong><p>{allocation.reason}</p></div><b>{Math.round(allocation.weight * 100)}%</b></div>)}</div><div className="notice"><strong>Live execution is blocked.</strong><span>{result.execution.blockers.join(" · ")}</span></div></section>}
    <footer><span>Base target · chain 8453</span><span>AI reasoning is never execution authority</span></footer>
  </main>;
}
