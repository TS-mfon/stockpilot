export type ExecutionMode = "simulation" | "testnet" | "mainnet";

export type TradeRequest = {
  instructionId: string;
  account: `0x${string}`;
  tokenIn: `0x${string}`;
  tokenOut: `0x${string}`;
  venueId: string;
  amountIn: string;
  minimumAmountOut: string;
  deadline: number;
};

export type ExecutionResult = { status: "simulated" | "blocked" | "submitted"; instructionId: string; reason?: string; transactionHash?: string };

export interface ExecutionAdapter {
  validate(request: TradeRequest): Promise<{ valid: boolean; reasons: string[] }>;
  execute(request: TradeRequest): Promise<ExecutionResult>;
}

export class FailClosedExecutionAdapter implements ExecutionAdapter {
  constructor(private readonly mode: ExecutionMode = "simulation") {}

  async validate(request: TradeRequest) {
    const reasons: string[] = [];
    if (!request.instructionId || !request.account || !request.tokenIn || !request.tokenOut) reasons.push("Incomplete execution request");
    if (request.deadline <= Math.floor(Date.now() / 1000)) reasons.push("Execution deadline expired");
    if (this.mode !== "simulation") reasons.push("Live venue, eligibility, permission, relayer, and settlement gates are not configured");
    return { valid: reasons.length === 0, reasons };
  }

  async execute(request: TradeRequest): Promise<ExecutionResult> {
    const validation = await this.validate(request);
    if (!validation.valid) return { status: "blocked", instructionId: request.instructionId, reason: validation.reasons.join("; ") };
    return { status: "simulated", instructionId: request.instructionId, reason: "Simulation adapter does not submit transactions" };
  }
}
