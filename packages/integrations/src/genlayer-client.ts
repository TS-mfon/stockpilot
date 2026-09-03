import { createAccount, createClient } from "genlayer-js";

export function createStudionetClient() {
  const privateKey = process.env.GENLAYER_OPERATOR_PRIVATE_KEY as `0x${string}` | undefined;
  if (!privateKey) throw new Error("GENLAYER_OPERATOR_PRIVATE_KEY is not configured");
  return createClient({ endpoint: process.env.NEXT_PUBLIC_GENLAYER_RPC_URL ?? "https://studio.genlayer.com/api", account: createAccount(privateKey) });
}

export async function readGenLayerContract(address: `0x${string}`, functionName: string, args: unknown[] = []) {
  return createStudionetClient().readContract({ address, functionName, args: args as never[] });
}
