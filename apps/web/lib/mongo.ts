import { MongoClient, type Collection, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const globalForMongo = globalThis as typeof globalThis & { stockPilotMongo?: Promise<MongoClient> };

function clientPromise(): Promise<MongoClient> | null {
  if (!uri) return null;
  globalForMongo.stockPilotMongo ??= new MongoClient(uri).connect();
  return globalForMongo.stockPilotMongo;
}

export async function collection<T extends object>(name: string): Promise<Collection<T> | null> {
  const client = clientPromise();
  if (!client) return null;
  const connected = await client;
  return connected.db(process.env.MONGODB_DB_NAME ?? "stockpilot").collection<T>(name);
}

export async function savePortfolio(portfolio: Record<string, unknown>): Promise<void> {
  const portfolios = await collection<Record<string, unknown>>("portfolios");
  if (portfolios) await portfolios.updateOne({ portfolioId: portfolio.portfolioId }, { $set: portfolio }, { upsert: true });
}

export async function getPortfolio(portfolioId: string): Promise<Record<string, unknown> | null> {
  const portfolios = await collection<Record<string, unknown>>("portfolios");
  return portfolios ? portfolios.findOne({ portfolioId }) : null;
}

export async function recordAudit(event: Record<string, unknown>): Promise<void> {
  const audit = await collection<Record<string, unknown>>("audit_events");
  if (audit) await audit.insertOne({ ...event, createdAt: new Date().toISOString() });
}
