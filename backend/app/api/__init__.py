from fastapi import APIRouter
from backend.app.api.routes_incidents import router as incidents_router
from backend.app.api.routes_actions import router as actions_router
from backend.app.api.routes_runbooks import router as runbooks_router
from backend.app.api.routes_postmortems import router as postmortems_router
from backend.app.api.routes_memory import router as memory_router
from backend.app.api.routes_simulation import router as simulation_router
from backend.app.api.routes_analytics import router as analytics_router
from backend.app.api.routes_settings import router as settings_router

api_router = APIRouter()
api_router.include_router(incidents_router)
api_router.include_router(actions_router)
api_router.include_router(runbooks_router)
api_router.include_router(postmortems_router)
api_router.include_router(memory_router)
api_router.include_router(simulation_router)
api_router.include_router(analytics_router)
api_router.include_router(settings_router)
