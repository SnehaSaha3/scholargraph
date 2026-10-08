import json

from pydantic import BaseModel, ValidationError

from app.models.llm import get_llm


class Stage(BaseModel):
    title: str
    status: str
    technology: str | None = None
    recommendation: str | None = None
    why: str | None = None


class NextImplementation(BaseModel):
    title: str
    why_now: str
    recommended_tools: list[str]
    alternatives: list[str]
    prerequisites: list[str]
    implementation_steps: list[str]
    what_comes_after: str


class ImplementationAdvisorResult(BaseModel):
    summary: str
    current_stage: str
    roadmap: list[Stage]
    next_implementation: NextImplementation


def analyze_research_implementation(
    evidence: dict,
) -> dict:
    llm = get_llm()

    compact = {
        "repository": evidence["repository"],
        "signals": evidence["signals"],
        "files": evidence["files"],
    }

    prompt = f"""
You are ScholarGraph's Implementation Advisor.

Your ONLY job is to answer:

"What should this researcher BUILD NEXT to investigate their research goal?"

You are NOT a generic code reviewer.

Do NOT:
- review code quality
- find bugs
- perform security analysis
- suggest refactoring
- grade architecture
- act like GitHub Copilot
- generate generic software-development advice
- invent features that are not supported by repository evidence

ScholarGraph's product purpose is:

Research → Implementation Guidance

The repository is inspected only to understand:
1. what has already been implemented;
2. what research-related capabilities already exist;
3. what is missing for the research goal;
4. what should be implemented next.

--------------------------------------------------
RESEARCH GOAL
--------------------------------------------------

{evidence["question"]}

--------------------------------------------------
REPOSITORY EVIDENCE
--------------------------------------------------

{json.dumps(compact, ensure_ascii=False)}

--------------------------------------------------
IMPORTANT REASONING RULES
--------------------------------------------------

1. Separate IMPLEMENTED from PLANNED and RECOMMENDED.

Only mark something as "implemented" when repository evidence supports it.

2. Do not assume that a generic feature satisfies a specific research goal.

Example:

If the research goal is:
"Develop medicinal crop suitability and region-specific
recommendation for Assam"

then a generic AI chatbot or generic crop recommendation
feature is NOT automatically considered sufficient.

3. The research goal has priority over generic product features.

Ask:

"What implementation is missing specifically because of this
research goal?"

4. Prefer research-specific implementation stages.

For example:

Research goal:
medicinal crop recommendation

Better:
- Assam agro-climatic zone representation
- medicinal crop suitability model
- region-specific recommendation
- evaluation against agricultural conditions

Worse:
- build chatbot
- add dashboard
- add generic AI assistant

5. Do not invent implemented features.

6. Recommendations must be clearly recommendations.

7. Prefer the technologies already present in the repository
when appropriate.

8. ScholarGraph's LLM architecture is fixed:

- Groq
- model: openai/gpt-oss-120b

Do NOT recommend:
- OpenAI GPT models
- GPT-4
- GPT-5
- Anthropic Claude
- Gemini
- Llama 3.3

If an LLM is actually appropriate, recommend:

"Groq + openai/gpt-oss-120b"

Do not recommend an LLM merely because one is available.
For prediction, classification, recommendation, or scientific
modeling, prefer a dedicated ML/statistical approach when the
research goal requires one.

9. Do not assume LangChain is necessary.

Only recommend LangChain/LangGraph when orchestration or
multi-step reasoning genuinely requires it.

10. Do not claim that an API or model is the best choice unless
the repository evidence or research goal supports it.

11. Keep implementation concrete.

The next implementation should be something the researcher can
actually start building.

12. Maximum:
- 6 roadmap stages
- 5 implementation steps
- 4 recommended tools
- 3 alternatives

13. If the research goal is too vague to identify a research-
specific implementation, say so in the recommendation rather
than inventing a research direction.

--------------------------------------------------
OUTPUT
--------------------------------------------------

Return ONLY valid JSON.

Use exactly this structure:

{{
  "summary": "2 concise sentences describing what the project currently implements and how that relates to the research goal.",

  "current_stage": "The current research/implementation stage.",

  "roadmap": [
    {{
      "title": "implementation stage",
      "status": "implemented|next|planned",
      "technology": "technology or null",
      "recommendation": "specific recommended model/tool or null",
      "why": "why this stage matters for the research goal or null"
    }}
  ],

  "next_implementation": {{
    "title": "one concrete research-specific implementation to build next",

    "why_now": "why this is the correct next implementation for the research goal",

    "recommended_tools": [
      "specific technology/model/tool"
    ],

    "alternatives": [
      "reasonable alternative"
    ],

    "prerequisites": [
      "specific prerequisite"
    ],

    "implementation_steps": [
      "concrete implementation step"
    ],

    "what_comes_after": "the next research implementation after this stage"
  }}
}}

Remember:

The answer is NOT:
"What software feature should the developer add?"

The answer is:

"What research-related capability should the researcher
implement next, given what the repository already contains?"

No Markdown fences.
"""

    response = llm.invoke(prompt)

    content = response.content

    if isinstance(content, list):
        content = "".join(
            part.get("text", "")
            for part in content
            if isinstance(part, dict)
        )

    content = (
        str(content)
        .strip()
        .replace("```json", "")
        .replace("```", "")
        .strip()
    )

    try:
        result = ImplementationAdvisorResult.model_validate(
            json.loads(content)
        )
    except (json.JSONDecodeError, ValidationError) as error:
        print(
            "[implementation_advisor] Invalid model output:"
        )
        print(content)

        raise RuntimeError(
            "Implementation advisor returned invalid JSON."
        ) from error

    return {
        "repository": evidence["repository"],
        "relevant_files": evidence["relevant_files"],
        "advisor": result.model_dump(),
    }