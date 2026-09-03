import { FailClosedExecutionAdapter } from "../../../../../../packages/execution-adapters/src/index";

export async function POST(request: Request) {
  const body = await request.json();
  return Response.json(await new FailClosedExecutionAdapter("simulation").execute(body));
}
