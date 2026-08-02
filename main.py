from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from langchain_core.messages import HumanMessage
from App.workflows.workflow import workflow

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

class WorkflowPayload(BaseModel):
    query: Optional[str] = None
    message: Optional[str] = None

@app.post("/api/chat")
@app.post("/execute-workflow")
def process_workflow(payload: Optional[WorkflowPayload] = None, query: Optional[str] = None) -> dict:
    active_query = (payload.query if payload and payload.query else None) or (payload.message if payload and payload.message else None) or query or "What are the rules for exam attendance and where is the placement cell?"
    try:
        inputs = {"messages": [HumanMessage(content=active_query)]}
        output = workflow.invoke(inputs)
        final_response = output["messages"][-1].content
        return {"status": "success", "result": final_response, "query": active_query}
    except Exception as e:
        return {"status": "error", "message": str(e)}