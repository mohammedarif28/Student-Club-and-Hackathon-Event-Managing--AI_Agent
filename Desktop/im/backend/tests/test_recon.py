import pytest
from app.agents.agents import ReconciliationAgent

def test_reconciliation_logic():
    """
    Test that the ReconciliationAgent programmatically detects all discrepancies correctly.
    """
    intended_assets = [
        {"asset_tag": "SVR001", "hostname": "web-prod-01", "owner": "engineering", "environment": "production", "cpu": 4, "ram": 16, "storage": 100},
        {"asset_tag": "SVR002", "hostname": "db-prod-02", "owner": "security", "environment": "production", "cpu": 8, "ram": 32, "storage": 500},
        {"asset_tag": "SVR003", "hostname": "cache-prod-03", "owner": "engineering", "environment": "production", "cpu": 2, "ram": 8, "storage": 50},
        {"asset_tag": "SVR005", "hostname": "app-dev-01", "owner": "marketing", "environment": "development", "cpu": 1, "ram": 4, "storage": 20}
    ]
    
    live_assets = [
        {"asset_tag": "SVR001", "hostname": "web-prod-01", "owner": "engineering", "environment": "production", "cpu": 4, "ram": 16, "storage": 100},
        {"asset_tag": "SVR002", "hostname": "db-prod-02", "owner": "finance", "environment": "production", "cpu": 8, "ram": 32, "storage": 500},
        {"asset_tag": "SVR006", "hostname": "unauthorized-dev-test", "owner": "unknown", "environment": "development", "cpu": 4, "ram": 16, "storage": 200}
    ]
    
    agent = ReconciliationAgent()
    discrepancies = agent.reconcile(intended_assets, live_assets)
    
    # 1. Assert missing assets (in intended but not in live)
    missing = [d for d in discrepancies if d["issue"] == "missing_asset"]
    assert len(missing) == 2 # SVR003 and SVR005
    assert {m["asset"] for m in missing} == {"SVR003", "SVR005"}
    
    # 2. Assert unexpected assets (in live but not in intended)
    unauth = [d for d in discrepancies if d["issue"] == "unauthorized_asset"]
    assert len(unauth) == 1
    assert unauth[0]["asset"] == "SVR006"
    
    # 3. Assert owner mismatch detected
    owner_diff = [d for d in discrepancies if d["issue"] == "owner_mismatch"]
    assert len(owner_diff) == 1
    assert owner_diff[0]["asset"] == "SVR002"
    details = owner_diff[0]["details"]["mismatches"]
    assert details["owner"]["intended"] == "security"
    assert details["owner"]["live"] == "finance"
