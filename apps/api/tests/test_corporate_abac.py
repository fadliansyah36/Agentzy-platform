from app.api.v1.routes.corporate_contracts import _permission_policy_target


def test_corporate_permission_policy_targets_are_explicit():
    assert _permission_policy_target("corporate.profiles.read") == ("corporate.profiles", "read")
    assert _permission_policy_target("corporate.profiles.manage") == ("corporate.profiles", "manage")
    assert _permission_policy_target("corporate.contracts.approve") == ("corporate.contracts", "approve")
    assert _permission_policy_target("corporate.contracts.documents") == ("corporate.contracts", "manage")
    assert _permission_policy_target("corporate.contracts.lifecycle") == ("corporate.contracts", "manage")
    assert _permission_policy_target("corporate.finance.invoice.manage") == ("corporate.finance", "manage")
    assert _permission_policy_target("corporate.entitlements.read") == ("corporate.workforce", "read")
    assert _permission_policy_target("corporate.providers.manage") == ("corporate.providers", "manage")
    assert _permission_policy_target("corporate.ai_workers.read") == ("corporate.ai", "read")
    assert _permission_policy_target("corporate.ai_workers.manage") == ("corporate.ai", "manage")


def test_unknown_corporate_permission_has_no_abac_target():
    assert _permission_policy_target("corporate.root.access") is None
