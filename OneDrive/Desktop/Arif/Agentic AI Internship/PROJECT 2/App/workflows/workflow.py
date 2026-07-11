import os
from typing import TypedDict, Annotated, Literal
from langgraph.graph import START, END, StateGraph
from langgraph.graph.message import add_messages
from App.agents.campus_info_agent import CampusInfoAgent

class AgentState(TypedDict):
    messages: Annotated[list, add_messages]
    campus_report: str

def route_campus_query(state: AgentState) -> Literal["campus_tools", "__end__"]:
    messages = state["messages"]
    last_message = messages[-1]

    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "campus_tools"

    state["campus_report"] = last_message.content
    return "__end__"

campus_agent = CampusInfoAgent()

workflow_builder = StateGraph(AgentState)

workflow_builder.add_node("campus_info_node", campus_agent.agent_node)
workflow_builder.add_node("campus_tools", campus_agent.tool_node)

workflow_builder.add_edge(START, "campus_info_node")
workflow_builder.add_conditional_edges(
    "campus_info_node",
    route_campus_query,
    {
        "campus_tools": "campus_tools",
        "__end__": END
    }
) 

workflow_builder.add_edge("campus_tools", "campus_info_node")

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


    print("\n\n-------------------------START DEBUGGING HERE---------------\n\n")

    print(output)

    print("\n\n-------------------------END DEBUGGING HERE---------------\n\n")