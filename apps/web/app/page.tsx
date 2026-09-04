"use client";

import { useState } from "react";
import { createWalletClient, custom, encodeFunctionData, parseUnits } from "viem";
import { base, baseSepolia } from "viem/chains";

type Asset = { id: string; symbol: string; name: string; contractAddress: `0x${string}`; underlyingSymbol: string; sector: string; themes: string[] };
type Result = { portfolioHash: string; allocations: { assetId: string; weight: number; reason: string }[]; assets: Asset[]; mandate: Record<string, unknown>; execution: { blockers: string[] }; health: Record<string, number> };
type AgentOption = { asset_id: string; route_id: string; weight: number; reason_codes: string[] };
type AgentResult = { requestId?: string; mode: string; status?: string; transactionHash?: string; decision: { decision: string; asset_id: string; route_id: string; weight: number; reason_codes: string[]; options?: AgentOption[] } | null; decisionHash?: string; reason?: string };
type Route = { id: string; assetId: string; venueId: string; status: string; liquidityUsd: number | null; priceImpactBps: number | null; reason: string; pool?: `0x${string}`; factory?: `0x${string}`; router?: `0x${string}`; quoteAmountOut?: string };
type RouteResult = { bestRoute: Route | null; mode: string; routes: Route[]; venue: { name: string } };
type WalletState = { address: `0x${string}`; chainId: number } | null;

declare global { interface Window { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } } }

export default function Home() {
  const [prompt, setPrompt] = useState("Build me a diversified technology portfolio using all verified assets, with no company above 25%.");
  const [result, setResult] = useState<Result | null>(null);
  const [agent, setAgent] = useState<AgentResult | null>(null);
  const [routes, setRoutes] = useState<RouteResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [agentBusy, setAgentBusy] = useState(false);
  const [error, setError] = useState("");
  const [wallet, setWallet] = useState<WalletState>(null);
  const [purchaseStatus, setPurchaseStatus] = useState("");
  async function build() {
    setBusy(true); setError("");
    try { const response = await fetch("/api/portfolio", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error); setResult(body); await findRoutes(); }
    catch (value) { setError(value instanceof Error ? value.message : "Unable to build portfolio"); }
    finally { setBusy(false); }
  }
  async function analyzeWithGenLayer() {
    setAgentBusy(true); setError("");
    try { const response = await fetch("/api/agent/analyze", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mandate: prompt }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error); setAgent(body); }
    catch (value) { setError(value instanceof Error ? value.message : "GenLayer analysis failed"); }
    finally { setAgentBusy(false); }
  }
  async function findRoutes(amountUsdc = 100) { const response = await fetch(`/api/routes?amountUsdc=${encodeURIComponent(amountUsdc)}`); setRoutes(await response.json()); }
  async function connectWallet() {
    setError("");
    if (!window.ethereum) { setError("Install a compatible wallet extension to connect."); return; }
    try {
      const client = createWalletClient({ chain: baseSepolia, transport: custom(window.ethereum) });
      const [address] = await client.requestAddresses();
      const chainId = await client.getChainId();
      setWallet({ address, chainId });
    } catch (value) { setError(value instanceof Error ? value.message : "Wallet connection failed"); }
  }
  async function preparePurchase(allocation: Result["allocations"][number]) {
    setPurchaseStatus(""); setError("");
    if (!wallet) { await connectWallet(); return; }
    const asset = result?.assets.find((item) => item.id === allocation.assetId);
    if (!asset) { setError("Asset metadata is unavailable."); return; }
    const route = routes?.routes.find((item) => item.assetId === asset.id);
    if (!route) { setError("No route record exists for this asset."); return; }
    if (route.status !== "available" || !route.router || !route.factory || !route.quoteAmountOut) { setPurchaseStatus("Purchase blocked: this asset has no verified pool and quote."); return; }
    if (wallet.chainId !== base.id) { setPurchaseStatus("Switch your wallet to Base mainnet to buy Coinbase Tokenized Stocks."); return; }
    const amountUsdc = window.prompt("USDC amount to spend", "100");
    if (!amountUsdc || !/^\d+(\.\d{1,6})?$/.test(amountUsdc)) { setPurchaseStatus("Enter a valid USDC amount."); return; }
    const fresh = await (await fetch(`/api/routes?amountUsdc=${encodeURIComponent(amountUsdc)}`)).json() as RouteResult;
    const quoted = fresh.routes.find((item) => item.assetId === asset.id);
    if (!quoted?.quoteAmountOut || quoted.status !== "available" || !quoted.router || !quoted.factory) { setPurchaseStatus("No current quote is available; try again."); return; }
    const client = createWalletClient({ chain: base, transport: custom(window.ethereum!) });
    const tokenIn = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`;
    const amountIn = parseUnits(amountUsdc, 6);
    const minimumOut = BigInt(quoted.quoteAmountOut) * 99n / 100n;
    const erc20Abi = [{ name: "approve", type: "function", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] }] as const;
    const routerAbi = [{ name: "swapExactTokensForTokens", type: "function", stateMutability: "nonpayable", inputs: [{ name: "amountIn", type: "uint256" }, { name: "amountOutMin", type: "uint256" }, { name: "routes", type: "tuple[]", components: [{ name: "from", type: "address" }, { name: "to", type: "address" }, { name: "stable", type: "bool" }, { name: "factory", type: "address" }] }, { name: "to", type: "address" }, { name: "deadline", type: "uint256" }], outputs: [{ type: "uint256[]" }] }] as const;
    setPurchaseStatus("Approve USDC in your wallet…");
    await client.writeContract({ address: tokenIn, abi: erc20Abi, functionName: "approve", args: [quoted.router, amountIn], account: wallet.address });
    setPurchaseStatus("Confirm the swap in your wallet…");
    const hash = await client.writeContract({ address: quoted.router, abi: routerAbi, functionName: "swapExactTokensForTokens", args: [amountIn, minimumOut, [{ from: tokenIn, to: asset.contractAddress, stable: false, factory: quoted.factory }], wallet.address, BigInt(Math.floor(Date.now() / 1000) + 300)], account: wallet.address });
    setPurchaseStatus(`Swap submitted: ${hash.slice(0, 18)}…`);
  }
  async function pollAgent() {
    if (!agent?.transactionHash || !agent.requestId) return;
    const response = await fetch(`/api/agent/status?transactionHash=${encodeURIComponent(agent.transactionHash)}&requestId=${encodeURIComponent(agent.requestId)}`);
    setAgent(await response.json());
  }
  return <main>
    <header><span className="mark">SP</span><span>StockPilot</span><span className="badge">{wallet ? `${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}` : "CONNECT WALLET"}</span><button className="wallet" onClick={connectWallet}>{wallet ? `CHAIN ${wallet.chainId}` : "Connect wallet"}</button></header>
    <section className="hero"><p className="eyebrow">GENLAYER-POWERED PORTFOLIO AGENT</p><h1>Describe the portfolio<br />you want.</h1><p className="lede">StockPilot evaluates verified Coinbase Tokenized Stock candidates on Base with GenLayer, then presents a reviewable portfolio. Rules and execution gates stay deterministic.</p><div className="builder"><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} /><button onClick={build} disabled={busy}>{busy ? "BUILDING…" : "Build portfolio"}</button></div><div className="actions"><button onClick={analyzeWithGenLayer} disabled={agentBusy}>{agentBusy ? "ASKING GENLAYER…" : "Analyze with GenLayer"}</button><button onClick={() => findRoutes()}>Discover routes</button></div>{error && <p className="error">{error}</p>}<p className="hint">Try: “use all verified assets, cap each at 25%, and avoid semiconductor concentration.”</p></section>
    {result && <section className="result"><div className="result-head"><div><p className="eyebrow">PORTFOLIO OPTIONS</p><h2>{String(result.mandate.theme)}</h2><p className="muted">Deterministic proposal · hash {result.portfolioHash.slice(0, 18)}…</p></div><div className="health">{Math.round(Object.values(result.health).reduce((a, b) => a + b, 0) / Object.values(result.health).length)}<small>HEALTH</small></div></div><div className="allocations">{result.allocations.map((allocation) => { const asset = result.assets.find((item) => item.id === allocation.assetId); const route = routes?.routes.find((item) => item.assetId === allocation.assetId); return <article className="allocation" key={allocation.assetId}><div><strong>{asset?.symbol ?? allocation.assetId} · {asset?.name}</strong><p>{asset?.sector} · {asset?.themes.join(" · ")}</p><p>{allocation.reason}</p><p className="route-status">{route ? `${route.status.toUpperCase()} ROUTE · ${route.reason}` : "Discover routes to review execution availability."}</p><button className="buy" onClick={() => preparePurchase(allocation)}>Review purchase</button></div><b>{Math.round(allocation.weight * 100)}%</b></article>; })}</div>{purchaseStatus && <p className="notice"><strong>Purchase gate</strong><span>{purchaseStatus}</span></p>}<div className="notice"><strong>Execution gate</strong><span>{result.execution.blockers.join(" · ")}</span></div></section>}
    {agent && <section className="result"><p className="eyebrow">GENLAYER PORTFOLIO OPTIONS</p><h2>{agent.decision?.decision ?? "PENDING"}</h2><p className="muted">{agent.mode === "genlayer" ? `Studionet consensus · ${agent.status ?? "submitted"}` : agent.reason}</p>{agent.decision?.options?.length ? <div className="allocations">{agent.decision.options.map((option) => { const asset = result?.assets.find((item) => item.id === option.asset_id); return <article className="allocation" key={`${option.asset_id}-${option.route_id}`}><div><strong>{asset?.symbol ?? option.asset_id} · {asset?.name}</strong><p>{asset?.sector ?? "Verified Base asset"}</p><p>{option.reason_codes.join(" · ")}</p><button className="buy" onClick={() => result && preparePurchase({ assetId: option.asset_id, weight: option.weight / 1e18, reason: option.reason_codes.join(" · ") })}>Review purchase</button></div><b>{(option.weight / 1e16).toFixed(1)}%</b></article>; })}</div> : agent.decision && <div className="decision-grid"><span>Asset <b>{agent.decision.asset_id}</b></span><span>Route <b>{agent.decision.route_id}</b></span><span>Weight <b>{(agent.decision.weight / 1e16).toFixed(1)}%</b></span><span>Reasons <b>{agent.decision.reason_codes.join(" · ")}</b></span></div>}{agent.transactionHash && <><p className="muted">Transaction: {agent.transactionHash.slice(0, 20)}…</p><button className="poll" onClick={pollAgent}>Refresh GenLayer status</button></>}</section>}
    {routes && <section className="result"><p className="eyebrow">ROUTE DISCOVERY</p><h2>{routes.venue.name}</h2><div className="decision-grid"><span>Available <b>{routes.routes.filter((route) => route.status === "available").length}</b></span><span>Unavailable <b>{routes.routes.filter((route) => route.status !== "available").length}</b></span><span>Chain <b>Base mainnet</b></span><span>Quote <b>Verified onchain</b></span></div><p className="muted">Cards with an available pool can be bought with a wallet-signed USDC approval and swap. Assets without a verified pool remain unavailable.</p></section>}
    <footer><span>Base target · testnet review path</span><span>GenLayer decides · rules enforce · user approves</span></footer>
  </main>;
}
