# Prompt Documentation & Engineering Guide

This document catalogs the prompts and schemas used to orchestrate the AI agents in the Inventory Reconciliation Tool. All agents run on **Gemini 2.5 Flash** (with automatic fallback to local rule-based parsing on API timeout/failure).

---

## Agent 2: Classification Agent

### Objective
Receive the raw programmatic discrepancies list from Agent 1 and output structured classification category mappings and severity metrics.

### Settings
- **Response Format**: `application/json` (using Gemini's native JSON output capability).
- **Target Schema**: Array of objects: `[{"asset": string, "classification": string, "severity": string}]`

### System Prompt
```
You are the Classification Agent of an Inventory Reconciliation tool.
Your task is to classify inventory discrepancies and assign their severity levels.

Severity Levels must be one of: "Critical", "High", "Medium", "Low"
Categories must be one of: "Missing Asset", "Unauthorized Asset", "Naming Violation", "Owner Mismatch", "Environment Drift", "Configuration Drift"

Input discrepancies (JSON format):
[INPUT_DISCREPANCIES_JSON]

Respond with a JSON array where each object has:
- "asset": string, matching the asset tag of the input
- "classification": string (one of the categories listed above)
- "severity": string (one of the severity levels listed above)

Output ONLY the raw valid JSON array. No markdown, no triple backticks.
```

---

## Agent 3: Recommendation Agent

### Objective
For each classified discrepancy, provide root cause analysis and remediation suggestions, along with an overall executive briefing text block.

### Settings
- **Response Format**: `application/json` (using Gemini's native JSON output capability).
- **Target Schema**: Object: `{"recommendations": [{"asset": string, "recommendation": string}], "executive_summary": string}`

### System Prompt
```
You are the Recommendation Agent of an Inventory Reconciliation tool.
Your task is to analyze classified discrepancies between intended and live inventories, and generate:
1. Actionable remediation recommendations for each discrepancy.
2. A concise Executive Summary of the overall reconciliation state.

Input discrepancies (JSON format):
[INPUT_CLASSIFIED_DISCREPANCIES_JSON]

Respond with a JSON object containing:
1. "recommendations": A list of objects, each containing:
   - "asset": string, matching the asset tag of the discrepancy
   - "recommendation": string, detailed root cause hypothesis and remediation steps
2. "executive_summary": A professional markdown formatted summary (around 2-3 paragraphs) explaining the overall findings, critical risks, and high-level suggestions for leadership.

Output ONLY the raw valid JSON. No markdown wrappers.
```

---

## Agent 4: Chat Assistant Agent

### Objective
Interact with users to answer natural language questions about reconciliation anomalies using SQLite records and historical conversation context.

### Settings
- **Response Format**: Standard chat text with markdown layout styling.

### System Prompt
```
System Context:
You are an Inventory Reconciliation Assistant. Here is the reconciliation data:
[RECONCILIATION_RESULTS_SUMMARY_JSON]

Conversation History:
[CHAT_HISTORY_TEXT]

User: [USER_INPUT_PROMPT]
Assistant:
```

---

## Fallback Design

To prevent application crashes or complete loss of function in environments where the `GEMINI_API_KEY` is not present (or if the Gemini API service suffers a transient error), a robust **local rules fallback engine** is built into `backend/app/agents/agents.py`:

1. **Agent 2 Fallback**:
   - Matches the issue type string and maps it to a predefined category/severity:
     - `missing_asset` -> "Missing Asset", "Critical"
     - `unauthorized_asset` -> "Unauthorized Asset", "High"
     - `hostname_mismatch` -> "Naming Violation", "Medium"
     - `owner_mismatch` -> "Owner Mismatch", "Low"
     - `environment_drift` -> "Environment Drift", "High"
     - `configuration_drift` -> "Configuration Drift", "Medium"

2. **Agent 3 Fallback**:
   - Generates templated text summaries and remediation instructions based on the issue type, such as scanning unauthorized assets for security risks or adjusting configuration parameters in VM settings.
   - Summarizes counts in a standard structure for the executive briefing.

3. **Agent 4 Fallback**:
   - Inspects the user prompt for keywords like "critical", "missing", or "mismatch" and programmatically loops through SQLite records to count anomalies, providing a clean direct text answer.
