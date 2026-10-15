import io
import json
import re
import zipfile
from urllib.parse import urlparse

import httpx

from app.models.llm import get_llm


IGNORED_PATHS = {
    ".git",
    "node_modules",
    "venv",
    ".venv",
    "__pycache__",
    ".next",
    "dist",
    "build",
    "coverage",
    ".pytest_cache",
}

IGNORED_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".mp4",
    ".mov",
    ".zip",
    ".tar",
    ".gz",
    ".bin",
    ".pt",
    ".pth",
    ".onnx",
}

MAX_FILE_BYTES = 500_000

TEST_TOKENS = {"test", "tests", "spec", "specs", "conftest"}

AI_ML_KEYWORDS = (
    "model",
    "train",
    "inference",
    "predict",
    "dataset",
    "agent",
    "ml",
    "ai",
    "embedding",
    "llm",
    "langchain",
    "langgraph",
)

BLOCKCHAIN_KEYWORDS = (
    "hardhat",
    "contract",
    "solidity",
    "blockchain",
    "web3",
    "ethers",
    "foundry",
)

SIGNAL_FRONTEND_KEYWORDS = (
    "frontend",
    "client",
    "src/components",
    "src/pages",
    "src/app",
)

SIGNAL_BACKEND_KEYWORDS = (
    "backend",
    "server",
    "api",
    "routes",
    "controllers",
    "services",
)

SOURCE_EXTENSIONS = (".py", ".ts", ".tsx", ".js", ".jsx")


def path_tokens(path: str) -> set[str]:
    return set(re.split(r"[^a-z0-9]+", path.lower()))


def has_keyword(lower_path: str, tokens: set[str], keyword: str) -> bool:
    if len(keyword) <= 3:
        return keyword in tokens

    return keyword in lower_path


def matches_any(
    lower_path: str,
    tokens: set[str],
    keywords: tuple[str, ...],
) -> bool:
    return any(
        has_keyword(lower_path, tokens, keyword)
        for keyword in keywords
    )


def parse_github_url(github_url: str) -> tuple[str, str]:
    parsed = urlparse(github_url)

    if parsed.netloc.lower() != "github.com":
        raise ValueError(
            "Only github.com repository URLs are supported."
        )

    parts = [
        part
        for part in parsed.path.strip("/").split("/")
        if part
    ]

    if len(parts) < 2:
        raise ValueError("Invalid GitHub repository URL.")

    owner = parts[0]
    repo = parts[1]

    if repo.endswith(".git"):
        repo = repo[:-4]

    return owner, repo


def should_ignore(path: str) -> bool:
    parts = path.split("/")

    if any(part in IGNORED_PATHS for part in parts):
        return True

    lower_path = path.lower()

    return any(
        lower_path.endswith(extension)
        for extension in IGNORED_EXTENSIONS
    )


def download_repository_archive(
    owner: str,
    repo: str,
    branch: str,
) -> dict[str, str]:
    archive_url = (
        f"https://github.com/{owner}/{repo}"
        f"/archive/refs/heads/{branch}.zip"
    )

    try:
        response = httpx.get(
            archive_url,
            timeout=60,
            follow_redirects=True,
        )
    except httpx.HTTPError as error:
        raise RuntimeError(
            f"Unable to download GitHub repository archive: {owner}/{repo}"
        ) from error

    if response.status_code != 200:
        raise RuntimeError(
            f"Unable to download GitHub repository archive "
            f"{owner}/{repo} ({branch}): "
            f"HTTP {response.status_code}"
        )

    try:
        archive = zipfile.ZipFile(io.BytesIO(response.content))
    except zipfile.BadZipFile as error:
        raise RuntimeError(
            "GitHub returned an invalid repository archive."
        ) from error

    files: dict[str, str] = {}

    for member in archive.infolist():
        if member.is_dir() or member.file_size > MAX_FILE_BYTES:
            continue

        parts = member.filename.split("/", 1)

        if len(parts) != 2 or not parts[1]:
            continue

        relative_path = parts[1]

        if should_ignore(relative_path):
            continue

        try:
            content = archive.read(member)
        except Exception:
            continue

        if b"\x00" in content[:4096]:
            continue

        files[relative_path] = content.decode("utf-8", errors="ignore")

    return files


def find_default_branch(owner: str, repo: str) -> str:
    for branch in ("main", "master"):
        archive_url = (
            f"https://github.com/{owner}/{repo}"
            f"/archive/refs/heads/{branch}.zip"
        )

        try:
            response = httpx.head(
                archive_url,
                timeout=15,
                follow_redirects=True,
            )

            if response.status_code == 200:
                return branch

        except httpx.HTTPError:
            continue

    raise RuntimeError(
        "Unable to determine the repository default branch. "
        "The repository may be private or use a non-standard branch name."
    )


def repository_metadata(owner: str, repo: str, branch: str) -> dict:
    return {
        "name": repo,
        "full_name": f"{owner}/{repo}",
        "description": None,
        "html_url": f"https://github.com/{owner}/{repo}",
        "default_branch": branch,
        "language": None,
        "stars": 0,
        "forks": 0,
        "open_issues": 0,
        "updated_at": None,
        "private": False,
    }


def get_repository(owner: str, repo: str) -> dict:
    return repository_metadata(
        owner,
        repo,
        find_default_branch(owner, repo),
    )


def get_tree(repository_files: dict[str, str]) -> list[str]:
    return [
        path
        for path in repository_files.keys()
        if not should_ignore(path)
    ]


def detect_repository_signals(paths: list[str]) -> dict:
    entries = [(path.lower(), path_tokens(path)) for path in paths]
    lowers = [lower for lower, _ in entries]

    def any_match(keywords: tuple[str, ...]) -> bool:
        return any(
            matches_any(lower, tokens, keywords)
            for lower, tokens in entries
        )

    return {
        "has_readme": any(
            lower == "readme.md" or lower.endswith("/readme.md")
            for lower in lowers
        ),
        "has_tests": any(tokens & TEST_TOKENS for _, tokens in entries),
        "has_requirements": any(
            lower.endswith(("requirements.txt", "pyproject.toml"))
            for lower in lowers
        ),
        "has_package_json": any(
            lower.endswith("package.json") for lower in lowers
        ),
        "has_docker": any(
            "dockerfile" in lower or "docker-compose" in lower
            for lower in lowers
        ),
        "has_ci": any(
            ".github/workflows/" in lower for lower in lowers
        ),
        "has_config": any("config" in lower for lower in lowers),
        "has_blockchain": any_match(BLOCKCHAIN_KEYWORDS),
        "has_ai_ml": any_match(AI_ML_KEYWORDS),
        "has_frontend": any_match(SIGNAL_FRONTEND_KEYWORDS),
        "has_backend": any_match(SIGNAL_BACKEND_KEYWORDS),
        "possible_env_files": [
            path
            for path in paths
            if path.endswith(".env") or ".env." in path
        ],
    }


def select_relevant_files(
    paths: list[str],
    max_files: int = 14,
) -> list[str]:
    entries = [
        (path, path.lower(), path_tokens(path))
        for path in paths
    ]

    by_lower = {lower: path for path, lower, _ in entries}

    selected: list[str] = []
    selected_set: set[str] = set()

    def add(path: str) -> None:
        if path in selected_set or len(selected) >= max_files:
            return

        selected.append(path)
        selected_set.add(path)

    def find_matches(
        keywords: tuple[str, ...],
        extensions: tuple[str, ...] = (),
    ) -> list[str]:
        return [
            path
            for path, lower, tokens in entries
            if matches_any(lower, tokens, keywords)
            and (not extensions or lower.endswith(extensions))
        ]

    def add_first(candidates: list[str], count: int) -> None:
        for path in candidates:
            if count <= 0 or len(selected) >= max_files:
                return

            if path in selected_set:
                continue

            add(path)
            count -= 1

    for filename in (
        "readme.md",
        "package.json",
        "requirements.txt",
        "pyproject.toml",
        "dockerfile",
    ):
        path = by_lower.get(filename)

        if path:
            add(path)

    add_first(
        find_matches(
            AI_ML_KEYWORDS + ("recommend", "fraud", "advisor"),
            SOURCE_EXTENSIONS,
        ),
        3,
    )

    add_first(
        find_matches(
            BLOCKCHAIN_KEYWORDS + ("contracts",),
            (".sol", ".ts", ".js", ".json"),
        ),
        2,
    )

    add_first(
        find_matches(
            ("backend", "server", "api", "route", "routes", "controller", "controllers", "service", "services"),
            SOURCE_EXTENSIONS,
        ),
        2,
    )

    add_first(
        find_matches(
            ("frontend", "client", "components", "pages", "src/app", "src/pages"),
            (".tsx", ".ts", ".jsx", ".js"),
        ),
        2,
    )

    add_first(
        find_matches(
            ("shipment", "shipping", "logistics", "delivery", "route", "order", "transport"),
            SOURCE_EXTENSIONS,
        ),
        2,
    )

    add_first(
        find_matches(
            ("experiment", "evaluation", "evaluate", "metric", "test", "tests", "benchmark"),
            SOURCE_EXTENSIONS,
        ),
        2,
    )

    add_first(
        [
            path
            for path, lower, _ in entries
            if lower.endswith(
                (".py", ".ts", ".tsx", ".js", ".jsx", ".java", ".go", ".rs", ".cpp", ".c")
            )
        ],
        max_files - len(selected),
    )

    return selected[:max_files]


def compact_file(
    path: str,
    content: str,
    max_chars: int = 2500,
) -> dict:
    if len(content) > max_chars:
        content = content[:max_chars] + "\n\n[FILE CONTENT TRUNCATED]"

    return {
        "path": path,
        "content": content,
    }


def build_repository_context(
    github_url: str,
) -> tuple[dict, list[str], dict[str, str]]:
    owner, repo = parse_github_url(github_url)

    branch = find_default_branch(owner, repo)

    repository_files = download_repository_archive(
        owner,
        repo,
        branch,
    )

    paths = get_tree(repository_files)

    return (
        repository_metadata(owner, repo, branch),
        paths,
        repository_files,
    )


def inspect_repository(github_url: str) -> dict:
    repository, paths, _ = build_repository_context(github_url)

    signals = detect_repository_signals(paths)

    relevant_files = select_relevant_files(paths, max_files=10)

    return {
        "repository": repository,
        "signals": signals,
        "tree_summary": {
            "total_files": len(paths),
            "relevant_files": relevant_files,
        },
    }


def build_review_evidence(
    github_url: str,
    question: str,
) -> dict:
    repository, paths, repository_files = build_repository_context(
        github_url
    )

    signals = detect_repository_signals(paths)

    relevant_files = select_relevant_files(paths, max_files=14)

    files = []

    for path in relevant_files:
        content = repository_files.get(path)

        if not content:
            continue

        files.append(
            compact_file(
                path,
                content,
                max_chars=1800,
            )
        )

    return {
        "question": question,
        "repository": repository,
        "signals": signals,
        "relevant_files": relevant_files,
        "files": files,
    }


def research_review(
    github_url: str,
    question: str,
) -> dict:
    evidence = build_review_evidence(github_url, question)

    llm = get_llm()

    prompt = f"""
You are ScholarGraph's research-aware
repository reviewer.

Research question:
{evidence["question"]}

Repository:
{evidence["repository"]["full_name"]}

Repository description:
{evidence["repository"]["description"]}

Repository signals:
{evidence["signals"]}

Relevant files:
{evidence["relevant_files"]}

Source evidence:
{evidence["files"]}

Review the implementation against the
research question.

Return ONLY valid JSON.
"""

    response = llm.invoke(prompt)

    content = response.content

    if isinstance(content, list):
        content = "".join(
            part.get("text", "")
            for part in content
            if isinstance(part, dict)
        )

    content = str(content).strip()

    if content.startswith("```"):
        content = (
            content
            .replace("```json", "")
            .replace("```", "")
            .strip()
        )

    try:
        result = json.loads(content)
    except json.JSONDecodeError as error:
        print("[github_review] Invalid model output:")
        print(content)

        raise RuntimeError(
            "GitHub research review returned invalid JSON."
        ) from error

    usage = getattr(response, "usage_metadata", None)

    if usage:
        print("[github_review] token usage:", usage)

    return {
        "repository": evidence["repository"],
        "relevant_files": evidence["relevant_files"],
        "review": result,
    }