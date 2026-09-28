import os

from dotenv import load_dotenv
from langchain_groq import ChatGroq


load_dotenv()


def get_llm() -> ChatGroq:
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
    )