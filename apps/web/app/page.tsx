"use client";

import { useState } from "react";

type Result = { portfolioHash: string; allocations: { assetId: string; weight: number; reason: string }[]; mandate: Record<string, unknown>; execution: { blockers: string[] }; health: Record<string, number> };
type AgentResult = { requestId?: string; mode: string; status?: string; transactionHash?: string; decision: { decision: string; asset_id: string; route_id: string; weight: number; reason_codes: string[] } | null; decisionHash?: string; reason?: string };
type RouteResult = { bestRoute: { id: string; venue: string; pool: string; liquidityUsd: number; priceImpactBps: number; feeBps: number } | null; mode: string; routes: { id: string; assetId: string; liquidityUsd: number; priceImpactBps: number; feeBps: number }[] };

export default function Home() {
  const [prompt, setPrompt] = useState("Build me a diversified AI infrastructure portfolio with at least 6 assets and no company above 20%.");
  const [result, setResult] = useState<Result | null>(null);
  const [agent, setAgent] = useState<AgentResult | null>(null);
  const [routes, setRoutes] = useState<RouteResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [agentBusy, setAgentBusy] = useState(false);
  const [error, setError] = useState("");
  async function build() {
    setBusy(true); setError("");
    try { const response = await fetch("/api/portfolio", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error); setResult(body); }
    catch (value) { setError(value instanceof Error ? value.message : "Unable to build portfolio"); }
    finally { setBusy(false); }
  }
  async function analyzeWithGenLayer() {
    setAgentBusy(true); setError("");
    try { const response = await fetch("/api/agent/analyze", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mandate: prompt }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error); setAgent(body); }
    catch (value) { setError(value instanceof Error ? value.message : "GenLayer analysis failed"); }
    finally { setAgentBusy(false); }
  }
  async function findRoutes() { const response = await fetch("/api/routes"); setRoutes(await response.json()); }
  async function pollAgent() {
    if (!agent?.transactionHash || !agent.requestId) return;
    const response = await fetch(`/api/agent/status?transactionHash=${encodeURIComponent(agent.transactionHash)}&requestId=${encodeURIComponent(agent.requestId)}`);
    setAgent(await response.json());
  }
  return <main>
    <header><span className="mark">SP</span><span>StockPilot</span><span className="badge">SIMULATION MODE</span></header>
    <section className="hero"><p className="eyebrow">GENLAYER-POWERED PORTFOLIO AGENT</p><h1>Describe the portfolio<br />you want.</h1><p className="lede">StockPilot sends verified candidate assets and routes to GenLayer. GenLayer returns a bounded, auditable decision; deterministic code handles the math.</p><div className="builder"><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} /><button onClick={build} disabled={busy}>{busy ? "BUILDING…" : "Build portfolio"}</button></div><div className="actions"><button onClick={analyzeWithGenLayer} disabled={agentBusy}>{agentBusy ? "ASKING GENLAYER…" : "Analyze with GenLayer"}</button><button onClick={findRoutes}>Find demo routes</button></div>{error && <p className="error">{error}</p>}<p className="hint">Try: “growth AI infrastructure, at least 6 companies, cap each at 15%.”</p></section>
    {result && <section className="result"><div className="result-head"><div><p className="eyebrow">YOUR PORTFOLIO</p><h2>{String(result.mandate.theme)}</h2><p className="muted">Validated proposal · hash {result.portfolioHash.slice(0, 18)}…</p></div><div className="health">{Math.round(Object.values(result.health).reduce((a, b) => a + b, 0) / Object.values(result.health).length)}<small>HEALTH</small></div></div><div className="allocations">{result.allocations.map((allocation) => <div className="allocation" key={allocation.assetId}><div><strong>{allocation.assetId}</strong><p>{allocation.reason}</p></div><b>{Math.round(allocation.weight * 100)}%</b></div>)}</div><div className="notice"><strong>Live execution is blocked.</strong><span>{result.execution.blockers.join(" · ")}</span></div></section>}
    {agent && <section className="result"><p className="eyebrow">GENLAYER DECISION</p><h2>{agent.decision?.decision ?? "PENDING"}</h2><p className="muted">{agent.mode === "genlayer" ? `Studionet consensus · ${agent.status ?? "submitted"}` : agent.reason}</p>{agent.decision && <div className="decision-grid"><span>Asset <b>{agent.decision.asset_id}</b></span><span>Route <b>{agent.decision.route_id}</b></span><span>Weight <b>{(agent.decision.weight / 1e16).toFixed(1)}%</b></span><span>Reasons <b>{agent.decision.reason_codes.join(" · ")}</b></span></div>}{agent.transactionHash && <><p className="muted">Transaction: {agent.transactionHash.slice(0, 20)}…</p><button className="poll" onClick={pollAgent}>Refresh GenLayer status</button></>}</section>}
    {routes && <section className="result"><p className="eyebrow">ROUTE DISCOVERY</p><h2>{routes.bestRoute ? routes.bestRoute.venue : "No route"}</h2>{routes.bestRoute && <div className="decision-grid"><span>Pool <b>{routes.bestRoute.pool}</b></span><span>Liquidity <b>${routes.bestRoute.liquidityUsd.toLocaleString()}</b></span><span>Price impact <b>{routes.bestRoute.priceImpactBps} bps</b></span><span>Status <b>DEMO QUOTE</b></span></div>}<p className="muted">Routes are selected from the approved registry; this demo never submits a transaction.</p></section>}
    <footer><span>Base target · chain 8453</span><span>GenLayer decides · rules enforce · user approves</span></footer>
  </main>;
}
