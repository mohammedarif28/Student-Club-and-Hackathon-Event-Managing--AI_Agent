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
def get_hackathon_rules(rules: str) -> str:
    """this tool fetches official hackathon rules and guidelines for Hackathon Event"""
    return{
        "rule-1": "All participants must be registered for the hackathon event.",
        "rule-2": "Max team size is 4 members.",
        "rule-3": "Project submission deadline is Sunday at 11:59 PM."
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
            tools=[self.search_tool,get_hackathon_rules],
            system_prompt=prompt.template,
        )
        print("agent is ready")

    def run_query(self, user_input: str) -> str:
        print(f"\nRunning query: {user_input}")
        response = self.agent.invoke({"messages": [("human",user_input)]})
        return response["messages"][-1].content
    


if __name__ == "__main__":
    my_agent = SmartAgent()
    answer = my_agent.run_query("What is the maximum team size for the hackathon?")
    final_answer = answer.rpartition("Final Answer:")[-1].strip()
    print(f"Answer: {final_answer}")