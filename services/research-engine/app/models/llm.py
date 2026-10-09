import os
from typing import Any

from dotenv import load_dotenv
from langchain_groq import ChatGroq


load_dotenv()


def get_llm() -> ChatGroq:
    """
    Return the primary Groq LLM.
    """

    api_key = os.getenv("GROQ_API_KEY")
    model = os.getenv("GROQ_MODEL")

    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not configured.")

    if not model:
        raise RuntimeError("GROQ_MODEL is not configured.")

    return ChatGroq(
        api_key=api_key,
        model=model,
        temperature=0,
        max_tokens=1400,
    )


def get_llm_with_key(api_key: str) -> ChatGroq:
    """
    Create a Groq LLM using a specific API key.
    """

    model = os.getenv("GROQ_MODEL")

    if not model:
        raise RuntimeError("GROQ_MODEL is not configured.")

    return ChatGroq(
        api_key=api_key,
        model=model,
        temperature=0,
        max_tokens=1400,
    )


def get_llm_candidates() -> list[ChatGroq]:
    """
    Return Groq clients in fallback order.

    Primary:
        GROQ_API_KEY

    Fallback:
        GROQ_API_KEY_2
    """

    primary_key = os.getenv("GROQ_API_KEY")
    secondary_key = os.getenv("GROQ_API_KEY_2")

    keys: list[str] = []

    if primary_key:
        keys.append(primary_key)

    if secondary_key and secondary_key != primary_key:
        keys.append(secondary_key)

    if not keys:
        raise RuntimeError(
            "No Groq API keys are configured. "
            "Set GROQ_API_KEY or GROQ_API_KEY_2."
        )

    return [
        get_llm_with_key(key)
        for key in keys
    ]


def extract_token_usage(response: Any) -> dict[str, int]:
    """
    Extract token usage from a LangChain response.

    Returns a consistent structure:

    {
        "input_tokens": ...,
        "output_tokens": ...,
        "total_tokens": ...
    }
    """

    usage_metadata = getattr(
        response,
        "usage_metadata",
        None,
    ) or {}

    response_metadata = getattr(
        response,
        "response_metadata",
        None,
    ) or {}

    provider_usage = response_metadata.get(
        "token_usage",
        {},
    ) or {}

    usage = (
        usage_metadata
        if usage_metadata
        else provider_usage
    )

    input_tokens = int(
        usage.get("input_tokens")
        or usage.get("prompt_tokens")
        or 0
    )

    output_tokens = int(
        usage.get("output_tokens")
        or usage.get("completion_tokens")
        or 0
    )

    total_tokens = int(
        usage.get("total_tokens")
        or (input_tokens + output_tokens)
    )

    return {
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "total_tokens": total_tokens,
    }


def invoke_with_fallback(
    messages: Any,
) -> tuple[Any, dict[str, int], int]:
    """
    Invoke Groq using the primary key.

    If the primary key fails, automatically try
    the secondary key.

    Returns:

        response
        token_usage
        key_used
    """

    llms = get_llm_candidates()

    last_error: Exception | None = None

    for key_index, llm in enumerate(
        llms,
        start=1,
    ):
        try:
            response = llm.invoke(messages)

            usage = extract_token_usage(response)

            return (
                response,
                usage,
                key_index,
            )

        except Exception as error:
            last_error = error

            # Try the next API key if available.
            if key_index < len(llms):
                continue

            raise RuntimeError(
                "All configured Groq API keys failed. "
                f"Last error: {error}"
            ) from error

    raise RuntimeError(
        "No Groq LLM candidates available."
    )