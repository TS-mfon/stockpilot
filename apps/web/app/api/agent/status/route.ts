import { createAccount, createClient } from "genlayer-js";
import { runtimeConfig } from "../../../../lib/runtime";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const transactionHash = url.searchParams.get("transactionHash") as `0x${string}` | null;
  const requestId = url.searchParams.get("requestId");
  const address = process.env.GENLAYER_STOCKPILOT_AGENT_ADDRESS as `0x${string}` | undefined;
  const key = process.env.GENLAYER_OPERATOR_PRIVATE_KEY as `0x${string}` | undefined;
  if (!transactionHash || !requestId || !address || !key) return Response.json({ error: "transactionHash, requestId, and agent configuration are required" }, { status: 400 });
  try {
    const client = createClient({ endpoint: runtimeConfig.genlayerRpcUrl, account: createAccount(key) });
    const transaction = await client.getTransaction({ hash: transactionHash as `0x${string}` & { length: 66 } });
    const status = transaction.statusName ?? String(transaction.status);
    if (status !== "FINALIZED" && status !== "ACCEPTED") return Response.json({ mode: "genlayer", requestId, transactionHash, status, decision: null });
    let decision: unknown = null;
    for (let attempt = 0; attempt < 6; attempt++) {
      decision = await client.readContract({ address, functionName: "get_decision", args: [requestId] });
      if (decision && typeof decision === "object" && "decision" in decision) break;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    const decisionHash = await client.readContract({ address, functionName: "get_decision_hash", args: [requestId] });
    return Response.json({ mode: "genlayer", requestId, transactionHash, status, decision, decisionHash });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "status lookup failed" }, { status: 502 }); }
}
