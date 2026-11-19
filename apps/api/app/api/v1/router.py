from fastapi import APIRouter

from app.api.v1.routes.access_policies import router as access_policies_router
from app.api.v1.routes.bootstrap import router as bootstrap_router
from app.api.v1.routes.contracts import router as contracts_router
from app.api.v1.routes.identity import router as identity_router
from app.api.v1.routes.integrations import router as integrations_router
from app.api.v1.routes.management import router as management_router
from app.api.v1.routes.partnership import router as partnership_router
from app.api.v1.routes.partnership_attachments import router as partnership_attachments_router
from app.api.v1.routes.partnership_notifications import router as partnership_notifications_router
from app.api.v1.routes.security_lifecycle import router as security_lifecycle_router
from app.api.v1.routes.tenant_structure import router as tenant_structure_router
from app.api.v1.routes.tenants import router as tenants_router

router = APIRouter()
router.include_router(identity_router, tags=["Identity"])
router.include_router(tenants_router, prefix="/tenants", tags=["Tenants"])
router.include_router(tenant_structure_router, prefix="/tenants", tags=["Tenant Structure"])
router.include_router(bootstrap_router, prefix="/bootstrap")
router.include_router(management_router)
router.include_router(partnership_router)
router.include_router(partnership_attachments_router)
router.include_router(partnership_notifications_router)
router.include_router(integrations_router)
router.include_router(contracts_router)
router.include_router(access_policies_router)
router.include_router(security_lifecycle_router)
