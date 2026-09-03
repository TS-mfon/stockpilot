import { FailClosedExecutionAdapter } from "../../../../../../packages/execution-adapters/src/index";

export async function POST(request: Request) {
  const body = await request.json();
  const result = await new FailClosedExecutionAdapter("simulation").validate(body);
  return Response.json(result, { status: result.valid ? 200 : 422 });
}
