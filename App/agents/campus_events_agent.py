import os
from dotenv import load_dotenv
import requests
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, ToolMessage, HumanMessage
from langchain_core.tools import tool

load_dotenv()

@tool
def get_campus_event_tool(query: str):
    """Provides information about campus clubs, events, and schedules."""
    return "Event data: The Annual Tech Fest is scheduled for next month."

class CampusEventsAgent:
    def __init__(self):
        llm = ChatGroq(
            model="llama-3.1-8b-instant",
            temperature=0.2,
            api_key=os.getenv("GROQ_API_KEY") 
        )

        self.tools_list = [get_campus_event_tool]
        self.tools_by_names = {t.name: t for t in self.tools_list}
        self.llm_with_tools = llm.bind_tools(self.tools_list)

    def agent_node(self, state: dict) -> dict:
        messages = state["messages"]

        if any(isinstance(msg, ToolMessage) for msg in messages):
            response = self.llm.invoke(messages)
            return {"messages": [response]}

        system_prompt = SystemMessage(content="""
        You are a Campus Events Assistant. Your task is to provide information about clubs, events, 
        and college schedules. Use the `get_campus_event_tool` to find information.
        
        CRITICAL INSTRUCTIONS:
        1. If a ToolMessage is ALREADY in the history, DO NOT call the tool again. Summarize the answer.
        2. If no tool results are present, call the tool exactly ONCE.
        """) 
        full_messages = [system_prompt] + messages
        response = self.llm_with_tools.invoke(full_messages)
        return {"messages": [response]}

    def tool_node(self, state: dict) -> dict:
        messages = state["messages"]
        last_message = messages[-1]
        tool_outputs = []

        if hasattr(last_message, "tool_calls") and last_message.tool_calls:
            for tool_call in last_message.tool_calls:
                tool_name = tool_call["name"]
                tool_args = tool_call["args"]
                tool_id = tool_call["id"]

                tool_function = self.tools_by_names.get(tool_name)
                if tool_function:
                    tool_result = tool_function.invoke(tool_args)
                else:
                    tool_result = f"Error: Tool `{tool_name}` not found"

                tool_outputs.append(
                    ToolMessage(
                        content=str(tool_result),
                        tool_call_id=tool_id,
                        name=tool_name
                    )
                )
        return {"messages": tool_outputs}