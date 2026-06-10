import os
import json
import logging
import google.generativeai as genai
from typing import List, Dict, Any, Tuple

logger = logging.getLogger(__name__)

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
else:
    logger.warning("GEMINI_API_KEY environment variable not set. Gemini features will run in mock/fallback mode.")

def get_gemini_model(model_name: str = "gemini-2.5-flash") -> Any:
    """Gets the Gemini model or returns None if not configured."""
    if not api_key:
        return None
    try:
        return genai.GenerativeModel(model_name)
    except Exception as e:
        logger.error(f"Error initializing Gemini model: {e}")
        # Try falling back to gemini-1.5-flash
        try:
            return genai.GenerativeModel("gemini-1.5-flash")
        except Exception as e2:
            logger.error(f"Error initializing fallback model: {e2}")
            return None

class ReconciliationAgent:
    """
    Agent 1: Reconciliation Agent
    Responsibilities:
    - Read intended inventory (list of assets from CSV)
    - Fetch live inventory (list of live assets from API)
    - Compare records and detect discrepancies
    """
    def reconcile(self, csv_assets: List[Dict[str, Any]], live_assets: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        csv_map = {asset["asset_tag"]: asset for asset in csv_assets}
        live_map = {asset["asset_tag"]: asset for asset in live_assets}
        
        discrepancies = []
        
        # 1. Check for missing assets (in CSV but not in Live)
        for tag, csv_asset in csv_map.items():
            if tag not in live_map:
                discrepancies.append({
                    "asset": tag,
                    "issue": "missing_asset",
                    "details": {
                        "intended": {
                            "hostname": csv_asset.get("hostname"),
                            "owner": csv_asset.get("owner"),
                            "environment": csv_asset.get("environment"),
                            "cpu": csv_asset.get("cpu"),
                            "ram": csv_asset.get("ram"),
                            "storage": csv_asset.get("storage")
                        },
                        "live": None
                    }
                })
        
        # 2. Check for unexpected assets (in Live but not in CSV)
        for tag, live_asset in live_map.items():
            if tag not in csv_map:
                discrepancies.append({
                    "asset": tag,
                    "issue": "unauthorized_asset",
                    "details": {
                        "intended": None,
                        "live": {
                            "hostname": live_asset.get("hostname"),
                            "owner": live_asset.get("owner"),
                            "environment": live_asset.get("environment"),
                            "cpu": live_asset.get("cpu"),
                            "ram": live_asset.get("ram"),
                            "storage": live_asset.get("storage")
                        }
                    }
                })
        
        # 3. Check for mismatches (in both but properties differ)
        for tag, csv_asset in csv_map.items():
            if tag in live_map:
                live_asset = live_map[tag]
                mismatch_details = {}
                
                # Check hostname
                if csv_asset.get("hostname") != live_asset.get("hostname"):
                    mismatch_details["hostname"] = {
                        "intended": csv_asset.get("hostname"),
                        "live": live_asset.get("hostname")
                    }
                
                # Check owner
                if csv_asset.get("owner") != live_asset.get("owner"):
                    mismatch_details["owner"] = {
                        "intended": csv_asset.get("owner"),
                        "live": live_asset.get("owner")
                    }
                
                # Check environment
                if csv_asset.get("environment") != live_asset.get("environment"):
                    mismatch_details["environment"] = {
                        "intended": csv_asset.get("environment"),
                        "live": live_asset.get("environment")
                    }
                
                # Check configuration (cpu, ram, storage)
                config_mismatch = {}
                for field in ["cpu", "ram", "storage"]:
                    c_val = csv_asset.get(field)
                    l_val = live_asset.get(field)
                    if c_val != l_val:
                        config_mismatch[field] = {
                            "intended": c_val,
                            "live": l_val
                        }
                if config_mismatch:
                    mismatch_details["config"] = config_mismatch
                
                if mismatch_details:
                    # Let's create multiple issue entries or a combined one.
                    # We will create a combined result per asset for clean UI representation,
                    # but list the specific issue types.
                    issue_types = []
                    if "hostname" in mismatch_details:
                        issue_types.append("hostname_mismatch")
                    if "owner" in mismatch_details:
                        issue_types.append("owner_mismatch")
                    if "environment" in mismatch_details:
                        issue_types.append("environment_drift")
                    if "config" in mismatch_details:
                        issue_types.append("configuration_drift")
                    
                    # Store as primary issue the first mismatch, detail stores all
                    primary_issue = issue_types[0] if issue_types else "configuration_drift"
                    discrepancies.append({
                        "asset": tag,
                        "issue": primary_issue,
                        "all_issues": issue_types,
                        "details": {
                            "intended": {
                                "hostname": csv_asset.get("hostname"),
                                "owner": csv_asset.get("owner"),
                                "environment": csv_asset.get("environment"),
                                "cpu": csv_asset.get("cpu"),
                                "ram": csv_asset.get("ram"),
                                "storage": csv_asset.get("storage")
                            },
                            "live": {
                                "hostname": live_asset.get("hostname"),
                                "owner": live_asset.get("owner"),
                                "environment": live_asset.get("environment"),
                                "cpu": live_asset.get("cpu"),
                                "ram": live_asset.get("ram"),
                                "storage": live_asset.get("storage")
                            },
                            "mismatches": mismatch_details
                        }
                    })
        
        return discrepancies

class ClassificationAgent:
    """
    Agent 2: Classification Agent
    Responsibilities:
    - Categorize issue type (Missing Asset, Unauthorized Asset, Naming Violation, Owner Mismatch, Environment Drift, Configuration Drift)
    - Assign severity (Critical, High, Medium, Low)
    """
    def get_fallback_classification(self, issue_type: str) -> Tuple[str, str]:
        mapping = {
            "missing_asset": ("Missing Asset", "Critical"),
            "unauthorized_asset": ("Unauthorized Asset", "High"),
            "hostname_mismatch": ("Naming Violation", "Medium"),
            "owner_mismatch": ("Owner Mismatch", "Low"),
            "environment_drift": ("Environment Drift", "High"),
            "configuration_drift": ("Configuration Drift", "Medium")
        }
        return mapping.get(issue_type, ("Configuration Drift", "Medium"))

    def classify_issues(self, discrepancies: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        model = get_gemini_model()
        if not model:
            # Fallback local rules
            for item in discrepancies:
                cat, sev = self.get_fallback_classification(item["issue"])
                item["classification"] = cat
                item["severity"] = sev
            return discrepancies

        # We construct a prompt with all items for batch processing to save tokens and time
        prompt = """
        You are the Classification Agent of an Inventory Reconciliation tool.
        Your task is to classify inventory discrepancies and assign their severity levels.

        Severity Levels must be one of: "Critical", "High", "Medium", "Low"
        Categories must be one of: "Missing Asset", "Unauthorized Asset", "Naming Violation", "Owner Mismatch", "Environment Drift", "Configuration Drift"

        Input discrepancies (JSON format):
        """ + json.dumps(discrepancies, indent=2) + """

        Respond with a JSON array where each object has:
        - "asset": string, matching the asset tag of the input
        - "classification": string (one of the categories listed above)
        - "severity": string (one of the severity levels listed above)

        Output ONLY the raw valid JSON array. No markdown, no triple backticks.
        """

        try:
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            classifications = json.loads(response.text)
            
            # Map back to discrepancies
            class_map = {c["asset"]: c for c in classifications if "asset" in c}
            for item in discrepancies:
                info = class_map.get(item["asset"])
                if info:
                    item["classification"] = info.get("classification", self.get_fallback_classification(item["issue"])[0])
                    item["severity"] = info.get("severity", self.get_fallback_classification(item["issue"])[1])
                else:
                    cat, sev = self.get_fallback_classification(item["issue"])
                    item["classification"] = cat
                    item["severity"] = sev
        except Exception as e:
            logger.error(f"Gemini classification failed: {e}. Using local rules.")
            for item in discrepancies:
                cat, sev = self.get_fallback_classification(item["issue"])
                item["classification"] = cat
                item["severity"] = sev
        
        return discrepancies

class RecommendationAgent:
    """
    Agent 3: Recommendation Agent
    Responsibilities:
    - Generate root cause hypotheses
    - Generate remediation recommendations
    - Produce executive summary
    """
    def generate_fallback_recommendations(self, discrepancies: List[Dict[str, Any]]) -> Dict[str, Any]:
        results = []
        for item in discrepancies:
            tag = item["asset"]
            issue = item["issue"]
            cat = item.get("classification", "Drift")
            
            if issue == "missing_asset":
                rec = f"Verify physical status of {tag}. Check hypervisor/cloud portal to ensure it was not decommissioned without updating the CMDB. If active, re-install CMDB agent."
            elif issue == "unauthorized_asset":
                rec = f"Scan asset {tag} for vulnerabilities immediately. Identify user/process that provisioned it. Add to CMDB if authorized, otherwise isolate/terminate."
            elif issue == "hostname_mismatch":
                rec = f"Correct host naming in actual server system to match intended standard or submit a change request to update the CMDB."
            elif issue == "owner_mismatch":
                rec = f"Coordinate with the listed owners to identify correct custody. Update the asset ownership record in CMDB database."
            elif issue == "environment_drift":
                rec = f"Investigate environment settings. Ensure production/staging networks are segmented and asset {tag} is running in the correct environment."
            else:
                rec = f"Check CPU/RAM/Storage configuration. Re-align VM capacity limits or update standard CMDB allocation record."
            
            results.append({
                "asset": tag,
                "recommendation": rec
            })
            
        summary = f"Infrastructure Reconciliation complete. Total issues detected: {len(discrepancies)}. "
        if len(discrepancies) > 0:
            summary += "Drifts and unauthorized provisions pose compliance risks. Critical actions: verify missing database nodes and isolate unauthorized instances."
        else:
            summary += "All systems are perfectly synchronized."
            
        return {
            "recommendations": results,
            "executive_summary": summary
        }

    def generate_recommendations(self, discrepancies: List[Dict[str, Any]]) -> Dict[str, Any]:
        model = get_gemini_model()
        if not model:
            return self.generate_fallback_recommendations(discrepancies)
            
        prompt = """
        You are the Recommendation Agent of an Inventory Reconciliation tool.
        Your task is to analyze classified discrepancies between intended and live inventories, and generate:
        1. Actionable remediation recommendations for each discrepancy.
        2. A concise Executive Summary of the overall reconciliation state.

        Input discrepancies (JSON format):
        """ + json.dumps(discrepancies, indent=2) + """

        Respond with a JSON object containing:
        1. "recommendations": A list of objects, each containing:
           - "asset": string, matching the asset tag of the discrepancy
           - "recommendation": string, detailed root cause hypothesis and remediation steps
        2. "executive_summary": A professional markdown formatted summary (around 2-3 paragraphs) explaining the overall findings, critical risks, and high-level suggestions for leadership.

        Output ONLY the raw valid JSON. No markdown wrappers.
        """
        
        try:
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            res_json = json.loads(response.text)
            
            # Map recommendations back to discrepancies
            rec_map = {r["asset"]: r["recommendation"] for r in res_json.get("recommendations", []) if "asset" in r}
            for item in discrepancies:
                item["recommendation"] = rec_map.get(item["asset"], "Investigate discrepancy.")
                
            return {
                "recommendations": res_json.get("recommendations", []),
                "executive_summary": res_json.get("executive_summary", "Detailed analysis completed.")
            }
        except Exception as e:
            logger.error(f"Gemini recommendations failed: {e}. Using fallbacks.")
            fallback = self.generate_fallback_recommendations(discrepancies)
            rec_map = {r["asset"]: r["recommendation"] for r in fallback["recommendations"]}
            for item in discrepancies:
                item["recommendation"] = rec_map.get(item["asset"], "Investigate discrepancy.")
            return fallback

class ChatAssistant:
    """
    Agent 4: AI Chat Assistant
    Responsibilities:
    - Respond to questions using current reconciliation results
    """
    def answer_query(self, query: str, results_summary: List[Dict[str, Any]], chat_history: List[Dict[str, str]]) -> str:
        model = get_gemini_model()
        
        # Format context
        context_data = []
        for r in results_summary:
            context_data.append({
                "asset": r.get("asset_tag"),
                "issue_type": r.get("issue_type"),
                "classification": r.get("classification"),
                "severity": r.get("severity"),
                "recommendation": r.get("recommendation"),
                "details": r.get("details")
            })
            
        if not model:
            # Simple fallback response
            query_lower = query.lower()
            if "critical" in query_lower:
                crits = [c["asset"] for c in context_data if c["severity"] == "Critical"]
                if crits:
                    return f"The critical assets requiring immediate attention are: {', '.join(crits)}. They represent missing intended configurations or severe drifts."
                return "No critical issues detected in the latest reconciliation."
            elif "missing" in query_lower:
                missing = [c["asset"] for c in context_data if "missing" in c["issue_type"]]
                if missing:
                    return f"The following assets are present in CMDB intended records but missing in live infrastructure: {', '.join(missing)}."
                return "No assets are missing from live infrastructure."
            return "This is a local fallback assistant reply. I am currently offline. I can see there are total of " + str(len(context_data)) + " discrepancies."

        # Prepare messages
        messages = [
            {"role": "user", "parts": ["""
            You are the AI Chat Assistant for the Inventory Reconciliation Agent.
            You help users query their inventory drift, reconciliation findings, and remediation steps.
            
            Here is the current reconciliation dataset (Drifts & Issues):
            """ + json.dumps(context_data, indent=2) + """
            
            Answer the user's questions based on this dataset. Keep your answers clear, professional, and actionable.
            Use markdown tables or bullet points where appropriate to display groups of assets.
            """]}
        ]
        
        # Append history
        for msg in chat_history:
            role_type = "user" if msg["role"] == "user" else "model"
            messages.append({"role": role_type, "parts": [msg["message"]]})
            
        # Add current query
        messages.append({"role": "user", "parts": [query]})
        
        try:
            # Using chats API or direct prompt construction
            # We will construct a single prompt to make sure it's 100% reliable with standard content generation
            combined_prompt = f"System Context:\nYou are an Inventory Reconciliation Assistant. Here is the reconciliation data:\n{json.dumps(context_data, indent=2)}\n\n"
            combined_prompt += "Conversation History:\n"
            for msg in chat_history:
                combined_prompt += f"{msg['role'].capitalize()}: {msg['message']}\n"
            combined_prompt += f"\nUser: {query}\nAssistant:"
            
            response = model.generate_content(combined_prompt)
            return response.text
        except Exception as e:
            logger.error(f"Gemini chat failed: {e}")
            return "I apologize, but I encountered an error while communicating with the AI service. Please verify your API keys or try again."
