from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from langchain_core.messages import HumanMessage
from langchain_community.vectorstores import Chroma

app = FastAPI(
    title="Interactive Campus Info AI Agent",
    version="0.1.0",
    description="API to query campus rules, events, and institutional details using a multi-agent system"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root() -> dict:
    return {"message": "The Interactive Campus Info AI Agent API is live. Access docs at http://127.0.0.1:8000/docs"}

@app.get("/health")
def health_check() -> dict:
    return {"status": "OK"}

# -----------------------------------------------------
# Session Database / Cache Management Endpoints
# -----------------------------------------------------

data = set()

@app.post("/add-item")
def add_new_item(item: str) -> dict:
    data.add(item)
    return {"message": f"{item} successfully added to the database"}

@app.get("/display-all-items")
def display_all_items() -> dict:
    print(f"The data is : {data}")
    return {"message": f"Following items are in the database: {list(data)}"}

@app.get("/verify-item/{item_name}")
def verify_item(item_name: str) -> dict:
    if item_name in data:
        return {"message": f"{item_name} is in the database"}
    return {"message": f"{item_name} is not in the database"}

@app.put("/update-item")
def update_item(existing_item: str, new_item: str) -> dict:
    if existing_item not in data:
        return {"message": f"{existing_item} is not present in the database"}

    data.remove(existing_item)
    data.add(new_item)
    return {"message": f"{existing_item} has been updated to {new_item}"}

@app.delete("/delete-item")
def delete_item(item: str) -> dict:
    if item not in data:
        return {"message": f"{item} is not in the database"}

    data.remove(item)
    return {"message": f"{item} has been deleted from the database"}

@app.delete("/delete-all-item")
def delete_all_item() -> dict:
    data.clear()
    return {"message": "All items have been deleted from the database"}

# -----------------------------------------------------
# Multi-Agent Workflow & Interactive Chat Execution Endpoint
# -----------------------------------------------------

class WorkflowPayload(BaseModel):
    query: Optional[str] = None
    message: Optional[str] = None

@app.post("/api/chat")
@app.post("/execute-workflow")
def process_workflow(payload: Optional[WorkflowPayload] = None, query: Optional[str] = None) -> dict:
    """
    Triggers the compiled LangGraph multi-agent supervisor-router workflow.
    Supports payload with 'query' or 'message'.
    """
    active_query = (payload.query if payload and payload.query else None) or (payload.message if payload and payload.message else None) or query or "What are the rules for exam attendance and where is the placement cell?"
    try:
        inputs = {"messages": [HumanMessage(content=active_query)]}
        output = workflow.invoke(inputs)
        final_response = output["messages"][-1].content
        return {"status": "success", "result": final_response, "query": active_query}
    except Exception as e:
        return {"status": "error", "message": str(e)}