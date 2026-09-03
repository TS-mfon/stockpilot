import { runtimeConfig } from "../../../../lib/runtime";

export async function GET(request: Request) {
  if (process.env.CRON_SECRET && request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return Response.json({ error: "unauthorized" }, { status: 401 });
  return Response.json({ ok: true, service: "stockpilot-heartbeat", mode: runtimeConfig.mode, at: new Date().toISOString() });
}
