from fastapi import APIRouter

from app.api.v1.routes.access_policies import router as access_policies_router
from app.api.v1.routes.bootstrap import router as bootstrap_router
from app.api.v1.routes.identity import router as identity_router
from app.api.v1.routes.management import router as management_router
from app.api.v1.routes.tenant_structure import router as tenant_structure_router
from app.api.v1.routes.tenants import router as tenants_router

router = APIRouter()
router.include_router(identity_router, tags=["Identity"])
router.include_router(tenants_router, prefix="/tenants", tags=["Tenants"])
router.include_router(tenant_structure_router, prefix="/tenants", tags=["Tenant Structure"])
router.include_router(bootstrap_router, prefix="/bootstrap")
router.include_router(management_router)
router.include_router(access_policies_router)
