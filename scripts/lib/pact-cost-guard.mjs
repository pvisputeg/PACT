import { readFile, writeFile } from 'node:fs/promises';

export const HARD_PROJECT_CAP_USD = 5;
export const DEFAULT_PROJECT_BUDGET_USD = 4.5;
export const GPT_5_6_INPUT_PER_MILLION_USD = 5;
export const GPT_5_6_OUTPUT_PER_MILLION_USD = 30;

export function resolveBudget(rawBudget = process.env.PACT_MAX_API_SPEND_USD) {
  const budget = rawBudget === undefined ? DEFAULT_PROJECT_BUDGET_USD : Number(rawBudget);
  if (!Number.isFinite(budget) || budget <= 0 || budget > HARD_PROJECT_CAP_USD) {
    throw new Error(`PACT_MAX_API_SPEND_USD must be greater than 0 and no more than $${HARD_PROJECT_CAP_USD.toFixed(2)}.`);
  }
  return roundUsd(budget);
}

export function estimateTokens(value) {
  return Math.ceil((typeof value === 'string' ? value : JSON.stringify(value)).length / 4);
}

export function estimateCostUsd({ inputTokens, outputTokens }) {
  return roundUsd(
    (inputTokens / 1_000_000) * GPT_5_6_INPUT_PER_MILLION_USD
      + (outputTokens / 1_000_000) * GPT_5_6_OUTPUT_PER_MILLION_USD,
  );
}

export function totalCommittedUsd(ledger) {
  return roundUsd(ledger.entries.reduce((sum, entry) => sum + entry.costUsd, 0));
}

export function reserveCall(ledger, reservation) {
  const existing = ledger.entries.find((entry) => entry.id === reservation.id);
  if (existing) throw new Error(`Cost reservation ${reservation.id} already exists. Resume from the saved checkpoint or inspect the local cost ledger before retrying.`);
  const unsettled = ledger.entries.find((entry) => entry.agent === reservation.agent && entry.status === 'reserved');
  if (unsettled) {
    throw new Error(`Cost guard found an unsettled ${reservation.agent} reservation (${unsettled.id}). This may represent a paid interrupted call; inspect the ledger before authorizing another.`);
  }

  const nextTotal = roundUsd(totalCommittedUsd(ledger) + reservation.costUsd);
  if (nextTotal > ledger.budgetCapUsd) {
    throw new Error(`Cost guard blocked ${reservation.agent}: $${nextTotal.toFixed(4)} committed would exceed the $${ledger.budgetCapUsd.toFixed(2)} project budget.`);
  }

  ledger.entries.push({ ...reservation, status: 'reserved', createdAt: new Date().toISOString() });
  return ledger;
}

export function reconcileCall(ledger, id, usage) {
  const entry = ledger.entries.find((candidate) => candidate.id === id);
  if (!entry) throw new Error(`Missing cost reservation ${id}.`);
  const actualCostUsd = estimateCostUsd(usage);
  entry.status = 'settled';
  entry.costUsd = actualCostUsd;
  entry.inputTokens = usage.inputTokens;
  entry.outputTokens = usage.outputTokens;
  entry.requests = usage.requests;
  entry.settledAt = new Date().toISOString();
  return ledger;
}

export function acknowledgeUnsettledCall(ledger, agent) {
  const entry = ledger.entries.find((candidate) => candidate.agent === agent && candidate.status === 'reserved');
  if (!entry) return null;
  entry.status = 'charged-uncertain';
  entry.acknowledgedAt = new Date().toISOString();
  return entry;
}

export async function readLedger(ledgerUrl, budgetCapUsd) {
  try {
    const ledger = JSON.parse(await readFile(ledgerUrl, 'utf8'));
    if (ledger.budgetCapUsd !== budgetCapUsd) {
      throw new Error(`Existing cost ledger uses a $${Number(ledger.budgetCapUsd).toFixed(2)} cap. Keep that cap or deliberately archive the ledger before changing it.`);
    }
    return ledger;
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
    return { version: 1, budgetCapUsd, entries: [] };
  }
}

export async function writeLedger(ledgerUrl, ledger) {
  await writeFile(ledgerUrl, `${JSON.stringify(ledger, null, 2)}\n`, 'utf8');
}

function roundUsd(value) {
  return Math.round(value * 1_000_000) / 1_000_000;
}
