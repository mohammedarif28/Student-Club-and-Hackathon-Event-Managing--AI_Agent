from typing import TypedDict, Annotated
from langgraph.graph import START, END, StateGraph
from langgraph.graph.message import add_messages
from App.agents.campus_info_agent import CampusInfoAgent
from App.agents.campus_events_agent import CampusEventsAgent

class AgentState(TypedDict):
    messages: Annotated[list, add_messages]

info_agent = CampusInfoAgent()
events_agent = CampusEventsAgent()

workflow_builder = StateGraph(AgentState)

workflow_builder.add_node("info_node", info_agent.agent_node)
workflow_builder.add_node("info_tool_node", info_agent.tool_node)
workflow_builder.add_node("events_node", events_agent.agent_node)
workflow_builder.add_node("events_tool_node", events_agent.tool_node)

def supervisor_router(state):
    query = state["messages"][-1].content.lower()
    if any(word in query for word in ["event", "club", "fest", "schedule"]):
        return "events_node"
    return "info_node"

workflow_builder.add_conditional_edges(START, supervisor_router)

# Use conditional edges to prevent the infinite loop
def should_continue_info(state):
    # If the last message has tool calls, go to tool node, else stop
    if state["messages"][-1].tool_calls:
        return "info_tool_node"
    return END

def should_continue_events(state):
    if state["messages"][-1].tool_calls:
        return "events_tool_node"
    return END

workflow_builder.add_conditional_edges("info_node", should_continue_info)
workflow_builder.add_edge("info_tool_node", "info_node")

workflow_builder.add_conditional_edges("events_node", should_continue_events)
workflow_builder.add_edge("events_tool_node", "events_node")

workflow = workflow_builder.compile()

if __name__ == "__main__":
    from langchain_core.messages import HumanMessage

    input = {
        "messages": [HumanMessage(content="What are the rules for exam attendance and where is the placement cell?")]
    }

    print("\n\n--------------------------OUTPUT STARTS HERE--------------\n\n")
    output = workflow.invoke(input)

    print(output["messages"][-1].content)
    
    print("\n\n--------------------------OUTPUT ENDS HERE-----------------\n\n")