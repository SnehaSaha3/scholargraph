from langgraph.graph import END, START, StateGraph

from app.graph.state import ResearchState


def build_research_graph():
    from app.agents.analysis import analysis_agent
    from app.agents.books import book_agent
    from app.agents.datasets import dataset_agent
    from app.agents.literature import literature_agent
    from app.agents.research_intent import research_intent_agent

    graph = StateGraph(ResearchState)

    graph.add_node(
        "research_intent",
        research_intent_agent,
    )

    graph.add_node(
        "literature",
        literature_agent,
    )

    graph.add_node(
        "datasets",
        dataset_agent,
    )

    graph.add_node(
        "books",
        book_agent,
    )

    graph.add_node(
        "analysis",
        analysis_agent,
    )

    graph.add_edge(
        START,
        "research_intent",
    )

    graph.add_edge(
        "research_intent",
        "literature",
    )

    graph.add_edge(
        "literature",
        "datasets",
    )

    graph.add_edge(
        "datasets",
        "books",
    )

    graph.add_edge(
        "books",
        "analysis",
    )

    graph.add_edge(
        "analysis",
        END,
    )

    return graph.compile()
