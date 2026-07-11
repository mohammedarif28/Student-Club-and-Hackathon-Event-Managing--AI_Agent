import os
import requests
from dotenv import load_dotenv
from langchain_core.tools import tool
from langchain_groq import ChatGroq
from langchain_community.tools import DuckDuckGoSearchResults
from langchain.agents import create_agent
from langsmith import Client

load_dotenv()

@tool
def get_campus_info(topic: str) -> str:
    """Fetches official database records regarding campus regulations, structures, and student operations."""
    return{
        "rules": "Minimum 75% attendance is required to qualify for university examinations. Formal dress code applies for labs, seminars, and placement drives.",
        "events": "The Annual Hackathon is an elite 24-hour engineering product sprint hosted mid-semester. Check internal portals for team registrations.",
        "clubs": "The Tech Club administers core initiatives in advanced software engineering and AI systems development. Sports Council coordinates tournaments.",
        "locations": "Main Seminar Hall is situated on Block A (2nd Floor). The Innovation Laboratory is located on the IT Block (3rd Floor).",
        "facilities": "Central Library accommodates up to 500 students with digital research access. The Innovation Lab features high-performance GPU nodes.",
        "procedures": "To process an On-Duty (OD) clearance form, secure authorization signatures from the Class Advisor and Head of Department (HOD) exactly 24 hours prior to the schedule."
    }

class SmartAgent:
    def __init__(self):
        print("Initializing Smart Agent...")
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.search_tool = DuckDuckGoSearchResults()

        self.llm = ChatGroq(
            model="openai/gpt-oss-20b",
            api_key=self.groq_api_key,
            temperature=0,
        )
        client = Client()
        prompt = client.pull_prompt("hwchase17/react", dangerously_pull_public_prompt=True)

        self.agent = create_agent(
            model=self.llm,
            tools=[self.search_tool,get_campus_info],
            system_prompt=prompt.template,
        )
        print("agent is ready")

    def run_query(self, user_input: str) -> str:
        print(f"\nRunning query: {user_input}")
        response = self.agent.invoke({"messages": [("human",user_input)]})
        return response["messages"][-1].content
    


if __name__ == "__main__":
    my_agent = SmartAgent()
    answer = my_agent.run_query("What is the minimum attendance required to qualify for university examinations?")
    final_answer = answer.rpartition("Final Answer:")[-1].strip()
    print(f"Answer: {final_answer}")