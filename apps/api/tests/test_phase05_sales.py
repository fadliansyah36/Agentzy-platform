from app.domain.sales import LEAD_TRANSITIONS, ORDER_TRANSITIONS, normalize_provider_status, transition_allowed


def test_lead_lifecycle_is_ordered_and_terminal():
    assert transition_allowed("lead_created","assigned")
    assert transition_allowed("assigned","contacted")
    assert transition_allowed("contacted","qualified")
    assert transition_allowed("qualified","coverage_checked")
    assert transition_allowed("coverage_checked","offer_presented")
    assert transition_allowed("offer_presented","order_submitted")
    assert not transition_allowed("lead_created","order_submitted")
    assert not transition_allowed("closed","assigned")
    assert not LEAD_TRANSITIONS["closed"]


def test_order_lifecycle_blocks_client_provider_decisions():
    assert transition_allowed("draft","submitted",order=True)
    assert not transition_allowed("draft","provider_approved",order=True)
    assert transition_allowed("provider_approved","installation_scheduled",order=True)
    assert transition_allowed("installation_in_progress","activated",order=True)
    assert not transition_allowed("activated","cancelled",order=True)
    assert not ORDER_TRANSITIONS["activated"]


def test_provider_status_mapping_is_allowlisted():
    mapping={"accepted":"provider_pending","approved":"provider_approved","live":"activated"}
    assert normalize_provider_status("APPROVED",mapping)=="provider_approved"
    assert normalize_provider_status("unknown-state",mapping) is None
    assert normalize_provider_status("accepted",{"accepted":"invented"}) is None
