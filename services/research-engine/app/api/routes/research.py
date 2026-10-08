from fastapi import APIRouter
from app.schemas.research import (
    ResearchDiscussionRequest,
    ResearchDiscussionResponse,
    ResearchExploration,
    ResearchPlan,
    ResearchRequest,
)
from app.services.research_service import explore_research, discuss_research, create_research_plan

router = APIRouter()


@router.post("/explore", response_model=ResearchExploration)
def explore(request: ResearchRequest):
    return explore_research(request)


@router.post("/discuss", response_model=ResearchDiscussionResponse)
def discuss(request: ResearchDiscussionRequest):
    return discuss_research(request)


@router.post("/plan", response_model=ResearchPlan)
def generate_research_plan(request: ResearchRequest):
    return create_research_plan(request)
