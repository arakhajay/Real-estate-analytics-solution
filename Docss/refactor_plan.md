# Refactoring Plan: Composable AI Architecture

## 1. Goal
Transition from **Hardcoded Scripts** to **Reusable Microservice Agents** (Skills) to enable complex, composable workflows (e.g., "Investment Committee").

## 2. Issues to Address
1.  **Hardcoded Prompts:** Agents like `macro_agent` have "NYC 2026" hardcoded. They can't check "Miami 2025".
2.  **Trapped Logic:** Valuable agents (`Risk Manager`, `Lease Lawyer`) are stuck inside API route functions.
3.  **Strict State:** The `AgentState` TypedDict is too rigid (`macro_data`, `legal_data` keys are mandatory).

## 3. Implementation Steps

### Step 1: Create the "Skill Registry"
Create a new file `src/api/agents.py` to house all agent functions.
*   **Action:** Move `macro_agent`, `market_agent`, `legal_agent` from `server.py` to `agents.py`.
*   **Action:** Extract `Risk Manager` logic from `run_scenario` and create a `risk_agent`.
*   **Action:** Extract `Lease Analyzer` logic from `analyze_legal` and create `lease_agent`.

### Step 2: Standardize the Agent Interface
Parameterize all agents to accept a flexible `State` or `Instructions`.
*   **Old:** `prompt = "Find NYC 2026 data..."`
*   **New:** `prompt = f"Find {state.get('location', 'NYC')} data for {state.get('year', '2026')}..."`

### Step 3: Define a Flexible State Schema
Replace rigid `AgentState` with a more flexible schema that allows agents to write to their own namespace.
*   Use `Annotated[dict, operator.or_]` or a similar merging strategy if using LangGraph, or simply a flexible Dict.

### Step 4: Refactor `server.py`
*   Import the agents from `src/api/agents.py`.
*   Rebuild `app_graph` using these imported, flexible agents.
*   Update `/analytics/scenario` and `/legal/analyze` to call the new agent functions instead of inline code.

## 4. Execution Order
1.  **Create `src/api/agents.py`** containing the refactored, parameterized agent functions.
2.  **Update `src/api/server.py`** to import and use these agents.
3.  **Verify** that existing endpoints (`/analytics/report`, `/analytics/scenario`) still work.
