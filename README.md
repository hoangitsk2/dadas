# DADAS

Messenger analytics pipeline for high-volume AI analysis with multi-key rotation and parallel job orchestration.

## Included modules
- `src/types.ts`: Core enums and data contracts for jobs, API keys, and analysis results.
- `src/apiManager.ts`: API key rotation and quota tracking for Google AI Studio models.
- `src/modelAssignment.ts`: Job-to-model routing plus fallback mapping.
- `src/jobQueue.ts`: In-memory job scheduler with dependency checks and retry flow.
- `src/preprocess.ts`: Messenger JSON parsing, normalization, and block splitting.
