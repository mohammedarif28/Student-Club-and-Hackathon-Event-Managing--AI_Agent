import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.tools import tool
from langchain_core.messages import SystemMessage, ToolMessage
from App.services.rag_service import RAGService

load_dotenv()

@tool
def get_campus_data(query: str):
    """
    This is a RAG tool which get information about the excel college campus rules from PDF.
    including campus rules, club details, and timings for students.
    """
    rag_service = RAGService()
    retriever = rag_service.get_retriever()
    response = retriever.invoke(query)
    return response

class CampusInfoAgent:
    def __init__(self):
        llm = ChatGroq(
            model="openai/gpt-oss-120b",
            temperature=0.1,
            max_tokens=1024,
            api_key=os.getenv("GROQ_API_KEY")
        )

        self.tools = [get_campus_data]
        self.tools_by_names = {t.name: t for t in self.tools}
        self.llm_with_tools = llm.bind_tools(self.tools)

    def agent_node(self, state: dict) -> dict:
        messages = state["messages"]

        system_prompt = SystemMessage(content=(
            "You are an Interactive Campus Info AI Agent. Your instructions are strict:\n"
            "1. Use the `get_campus_data` tool to fetch all the information about the campus.\n"
            "2. DO NOT ask human or the student for any clarifications, missing details or missing sections.\n"
            "3. If certain details are missing in the retrieved data, proceed using ONLY what is available.\n"
            "4. You MUST compile and output a final `CAMPUS INFORMATION AND GUIDELINES REPORT` based on the retrieved data.\n"
            "Ensure the phrase `CAMPUS INFORMATION AND GUIDELINES REPORT` is clearly printed at the start of your final report."
        ))

        full_messages = [system_prompt] + messages
        response = self.llm_with_tools.invoke(full_messages)
        return {"messages": [response]}    

    def tool_node(self, state: dict) -> dict:
        messages = state["messages"]
        last_message = messages[-1]
        tool_outputs = []

        if hasattr(last_message, "tool_calls") :
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
                    ToolMessage(content=str(tool_result), 
                                tool_call_id=tool_id, 
                                name=tool_name)
                )

        return {"messages": tool_outputs}
