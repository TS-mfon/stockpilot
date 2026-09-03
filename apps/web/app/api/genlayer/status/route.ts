import { genlayerStatus } from "../../../../lib/genlayer";

export async function GET() { return Response.json(await genlayerStatus()); }
