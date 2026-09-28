from fastapi import APIRouter

from app.schemas.research import ResearchPlan, ResearchRequest
from app.services.research_service import create_research_plan


router = APIRouter()


@router.post("/plan", response_model=ResearchPlan)
def generate_research_plan(
    request: ResearchRequest,
):
    return create_research_plan(request)