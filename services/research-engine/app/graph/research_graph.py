from langgraph.graph import END, START, StateGraph

from app.graph.state import ResearchState


def build_research_graph():
    from app.agents.router import router_agent
    from app.agents.domain import domain_agent
    from app.agents.literature import literature_agent
    from app.agents.datasets import dataset_agent
    from app.agents.planner import planner_agent

    graph = StateGraph(ResearchState)

    graph.add_node("router", router_agent)
    graph.add_node("domain", domain_agent)
    graph.add_node("literature", literature_agent)
    graph.add_node("datasets", dataset_agent)
    graph.add_node("planner", planner_agent)

    graph.add_edge(START, "router")
    graph.add_edge("router", "domain")
    graph.add_edge("domain", "literature")
    graph.add_edge("literature", "datasets")
    graph.add_edge("datasets", "planner")
    graph.add_edge("planner", END)

    return graph.compile()