# System Architecture Diagram

This document explains the data flow, agent pipeline, and system integration topology of the Inventory Reconciliation Agent application.

```mermaid
graph TD
    %% User Actions
    U[User Browser Web Client] -->|1. Authentication admin/admin123| AuthRouter[FastAPI Auth Router]
    U -->|2. Ingest CSV Spreadsheet| UploadRouter[FastAPI Upload Router]
    U -->|3. Run Sync / Reconcile| ReconcileRouter[FastAPI Reconcile Router]
    U -->|4. Chat assistant query / prompt| ChatRouter[FastAPI Chat Router]
    U -->|5. Export Signed PDF/CSV Reports| ReportRouter[FastAPI Report Router]

    %% Backend Services
    UploadRouter -->|Validate Columns & Save| IntendedDB[(SQLite Database)]
    
    ReconcileRouter -->|Queries CSV Intended Assets| IntendedDB
    ReconcileRouter -->|Hits GET /api/live-inventory| LiveAPI[Mock Live Inventory Endpoint]
    
    %% Multi-Agent Pipeline
    ReconcileRouter -->|Initiate Pipeline| Agent1[Agent 1: Reconciliation engine]
    Agent1 -->|Compute differences Programmatic Pandas| Agent2[Agent 2: Classification Agent]
    Agent2 -->|Gemini: Assign categories & severities| Agent3[Agent 3: Recommendation Agent]
    Agent3 -->|Gemini: Write action recommendations & Executive Summary| ReconcileRouter
    
    %% Database Writes
    ReconcileRouter -->|Save Anomalies & Summaries| IntendedDB
    
    %% Chat context
    ChatRouter -->|Queries Context & Chat logs| IntendedDB
    ChatRouter -->|Inject context & chat logs| Agent4[Agent 4: AI Chat Assistant]
    Agent4 -->|Gemini output| ChatRouter
    ChatRouter -->|Save query log| IntendedDB
    
    %% Report builds
    ReportRouter -->|Read DB results| IntendedDB
    ReportRouter -->|ReportLab PDF compilation| U
```

---

## Data Pipeline Details

1. **Upload Phase**:
   - The user selects a target CSV file.
   - The system checks for the presence of the seven mandatory schema fields.
   - Rows are written directly to the `assets` table linked to a fresh `inventory_uploads` row.

2. **Reconciliation Phase**:
   - The Reconciliation Engine queries all intended items from the database.
   - It fetches actual server setups from the live inventory system.
   - Programmatic difference analysis checks match parameters, grouping drifts by hostname, environment, owner, and capacities.
   - The discrepancy list is fed to the **Gemini Classification Agent**, which calculates operational risk weights (Critical, High, Medium, Low).
   - This output is routed to the **Gemini Recommendation Agent**, which writes remediation tasks and the overall Markdown briefing.
   - Outputs are stored in `reconciliation_results` and `ai_reports`.

3. **Query Chat Phase**:
   - The user chats with the AI Assistant.
   - The system queries the latest reconciliation outcomes from the DB.
   - Prompt context is built and sent to the **Gemini Chat Agent**, providing the user with detailed insights into drift anomalies.
