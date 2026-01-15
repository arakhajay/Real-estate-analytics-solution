# Standard Operating Procedure: AI Agent Architecture

## Core Philosophy: "Agents as Skills"
Going forward, we will treat AI Agents not as one-off scripts for specific pages, but as highly specialized, reusable **Microservices/Skills**. 

An Agent is defined by **what it can do (Capabilities)** and **what it knows (Context Access)**, not by **where it is used**.

### 1. The Golden Rule of Reuse
> **"Build once, perfect continuously, reuse everywhere."**

*   **Do not** create `due_diligence_market_researcher` and `quarterly_report_market_researcher`.
*   **Do** create a single `MarketSpecialist` agent.
    *   If the Due Diligence workflow needs deep history, pass that requirement in the *Context/State*, not by changing the agent code.
    *   If the Quarterly Report needs a different tone, pass the `role="Formal"` parameter in the state.

### 2. Rules for Creating New Agents

#### A. Single Responsibility Principle (SRP)
Each agent must have **one** specific domain of expertise.
*   ✅ **Good**: `LegalCounselAgent`, `MarketDataAnalyst`, `ConstructionEstimator`.
*   ❌ **Bad**: `RealEstateGeneralist`, `ReportWriterAndAnalyzer`.

#### B. Stateless Execution
Agents should not hold memory between workflows implicitly. They should operate strictly on the **State** passed to them.
*   **Input**: `AgentState` (a dictionary containing goals, available data, and constraints).
*   **Processing**: The agent uses its specific tools (RAG, Search, Calculator) using the input.
*   **Output**: Returns a *structured update* to the state (e.g., specific keys like `legal_risks` or `market_trends`), not just a generic string.

#### C. Standardized Interface
All agents must follow a consistent function signature compatible with our orchestration framework (e.g., LangGraph):
```python
def specific_agent_name(state: SharedState) -> dict:
    # 1. Read 'objective' and relevant data from State
    # 2. Perform specialized work (Tool calls, LLM inference)
    # 3. Return ONLY the data they generated
    return {"specific_output_key": "result"}
```

### 3. Usage & Orchestration

#### A. Complex Workflows are Graphs
A "Workflow" is simply a specific arrangement (Graph) of these reusable agents.
*   **Workflow A (Acquisition)**: `MarketSpecialist` -> `LegalCounsel` -> `InvestmentManager` -> `RiskOfficer`.
*   **Workflow B (Tenant Dispute)**: `LegalCounsel` -> `CommunicationsManager`.

#### B. The "Manager" Pattern
If a task is too complex, do not complicate the worker agents. Create a **Manager/Router** node that breaks the task down and delegates it to the existing specialized agents.

### 4. Improving Efficiency & Quality

*   **Iterative Improvement**: When an Agent fails in one workflow, fix the Agent. This immediately improves *every other workflow* that uses that Agent.
*   **Tool Sharing**: Common tools (e.g., `perplexity_search`, `calculate_mortgage`) should be libraries shared across agents, not hardcoded inside one.

### 5. Implementation Checklist
When proposing a new feature:
1.  **Check Existing Inventory**: Do we already have an agent that can do this? (e.g., "Do we need a new 'Rent Estimator' or just the 'MarketAnalyst'?")
2.  **Define Domain**: If new, what is its strict domain?
3.  **Define Inputs/Outputs**: What specific data does it need from the state, and what does it append?
4.  **Register**: Add it to the central Agent Registry (`src/api/agents/registry.py` - *to be created*).

---
*Follow this document for all future AI development.*
