# GPT-5.6 artifact boundary

Run `npm run generate:agents` with `OPENAI_API_KEY` configured to create `strategy-and-audit.json` from two separate schema-constrained Responses API calls:

1. the Outcome Lead synthesizes the recovery plan; and
2. the Independent Auditor challenges it using a different role prompt and output schema.

Generated JSON is ignored until deliberately reviewed because it contains run-specific response IDs and timestamps. The deterministic application remains usable without external credentials; it does not pretend that fallback calculations are live model output.
