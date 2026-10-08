import io
import json
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
        raise ValueError(
            "Invalid GitHub repository URL."
        )

    owner = parts[0]
    repo = parts[1]

    if repo.endswith(".git"):
        repo = repo[:-4]

    return owner, repo


def should_ignore(path: str) -> bool:
    parts = path.split("/")

    if any(
        part in IGNORED_PATHS
        for part in parts
    ):
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
    """
    Download the public GitHub repository archive once and return
    text files as {repository_relative_path: content}.

    This avoids GitHub's REST API completely.
    """

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
        archive = zipfile.ZipFile(
            io.BytesIO(response.content)
        )
    except zipfile.BadZipFile as error:
        raise RuntimeError(
            "GitHub returned an invalid repository archive."
        ) from error

    files: dict[str, str] = {}

    for member in archive.infolist():
        if member.is_dir():
            continue

        name = member.filename

        # GitHub archive paths look like:
        # repository-master/src/app.ts
        parts = name.split("/", 1)

        if len(parts) != 2:
            continue

        relative_path = parts[1]

        if not relative_path:
            continue

        if should_ignore(relative_path):
            continue

        try:
            content = archive.read(member)
        except Exception:
            continue

        # Ignore obviously binary files.
        if b"\x00" in content[:4096]:
            continue

        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError:
            try:
                text = content.decode("utf-8", errors="ignore")
            except Exception:
                continue

        files[relative_path] = text

    return files


def find_default_branch(
    owner: str,
    repo: str,
) -> str:
    """
    Determine the default branch without using the GitHub REST API.

    We try the two common public branch names.
    """

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


def get_repository(
    owner: str,
    repo: str,
) -> dict:
    """
    Build repository metadata without calling api.github.com.
    """

    branch = find_default_branch(owner, repo)

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


def get_tree(
    repository_files: dict[str, str],
) -> list[str]:
    """
    Return repository file paths from the downloaded archive.
    """

    return [
        path
        for path in repository_files.keys()
        if not should_ignore(path)
    ]


def detect_repository_signals(
    paths: list[str],
) -> dict:
    lower_paths = {
        path.lower()
        for path in paths
    }

    return {
        "has_readme": any(
            path == "readme.md"
            or path.endswith("/readme.md")
            for path in lower_paths
        ),
        "has_tests": any(
            "test" in path
            for path in lower_paths
        ),
        "has_requirements": any(
            path.endswith("requirements.txt")
            or path.endswith("pyproject.toml")
            for path in lower_paths
        ),
        "has_package_json": any(
            path.endswith("package.json")
            for path in lower_paths
        ),
        "has_docker": any(
            "dockerfile" in path
            or "docker-compose" in path
            for path in lower_paths
        ),
        "has_ci": any(
            ".github/workflows/" in path
            for path in lower_paths
        ),
        "has_config": any(
            "config" in path
            for path in lower_paths
        ),
        "has_blockchain": any(
            any(
                keyword in path
                for keyword in (
                    "hardhat",
                    "contract",
                    "solidity",
                    "blockchain",
                    "web3",
                    "ethers",
                    "foundry",
                )
            )
            for path in lower_paths
        ),
        "has_ai_ml": any(
            any(
                keyword in path
                for keyword in (
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
            )
            for path in lower_paths
        ),
        "has_frontend": any(
            any(
                keyword in path
                for keyword in (
                    "frontend",
                    "client",
                    "src/components",
                    "src/pages",
                    "src/app",
                )
            )
            for path in lower_paths
        ),
        "has_backend": any(
            any(
                keyword in path
                for keyword in (
                    "backend",
                    "server",
                    "api",
                    "routes",
                    "controllers",
                    "services",
                )
            )
            for path in lower_paths
        ),
        "possible_env_files": [
            path
            for path in paths
            if path.endswith(".env")
            or ".env." in path
        ],
    }


def select_relevant_files(
    paths: list[str],
    max_files: int = 14,
) -> list[str]:
    """
    Select a balanced set of repository evidence.
    """

    lower_to_original = {
        path.lower(): path
        for path in paths
    }

    selected: list[str] = []
    selected_set: set[str] = set()

    def add(path: str) -> None:
        if path in selected_set:
            return

        selected.append(path)
        selected_set.add(path)

    def find_matches(
        keywords: tuple[str, ...],
        extensions: tuple[str, ...] = (),
    ) -> list[str]:
        matches = []

        for path in paths:
            lower = path.lower()

            keyword_match = any(
                keyword in lower
                for keyword in keywords
            )

            extension_match = (
                not extensions
                or lower.endswith(extensions)
            )

            if keyword_match and extension_match:
                matches.append(path)

        return matches

    def add_first(
        candidates: list[str],
        count: int,
    ) -> None:
        for path in candidates:
            if len(selected) >= max_files:
                return

            if path in selected_set:
                continue

            add(path)

            count -= 1

            if count <= 0:
                return

    # 1. Documentation / root configuration

    for filename in (
        "readme.md",
        "package.json",
        "requirements.txt",
        "pyproject.toml",
        "dockerfile",
    ):
        path = lower_to_original.get(filename)

        if path:
            add(path)

    # 2. AI / ML / research

    add_first(
        find_matches(
            (
                "model",
                "train",
                "inference",
                "predict",
                "dataset",
                "agent",
                "ml",
                "ai",
                "llm",
                "langchain",
                "langgraph",
                "recommend",
                "fraud",
                "advisor",
            ),
            (
                ".py",
                ".ts",
                ".tsx",
                ".js",
                ".jsx",
            ),
        ),
        3,
    )

    # 3. Blockchain

    add_first(
        find_matches(
            (
                "hardhat",
                "contract",
                "contracts",
                "solidity",
                "blockchain",
                "web3",
                "ethers",
                "foundry",
            ),
            (
                ".sol",
                ".ts",
                ".js",
                ".json",
            ),
        ),
        2,
    )

    # 4. Backend / API / services

    add_first(
        find_matches(
            (
                "backend",
                "server",
                "api",
                "route",
                "routes",
                "controller",
                "controllers",
                "service",
                "services",
            ),
            (
                ".py",
                ".ts",
                ".tsx",
                ".js",
                ".jsx",
            ),
        ),
        2,
    )

    # 5. Frontend

    add_first(
        find_matches(
            (
                "frontend",
                "client",
                "components",
                "pages",
                "src/app",
                "src/pages",
            ),
            (
                ".tsx",
                ".ts",
                ".jsx",
                ".js",
            ),
        ),
        2,
    )

    # 6. Shipment / logistics / orders

    add_first(
        find_matches(
            (
                "shipment",
                "shipping",
                "logistics",
                "delivery",
                "route",
                "order",
                "transport",
            ),
            (
                ".py",
                ".ts",
                ".tsx",
                ".js",
                ".jsx",
            ),
        ),
        2,
    )

    # 7. Experimentation / evaluation

    add_first(
        find_matches(
            (
                "experiment",
                "evaluation",
                "evaluate",
                "metric",
                "test",
                "tests",
                "benchmark",
            ),
            (
                ".py",
                ".ts",
                ".tsx",
                ".js",
                ".jsx",
            ),
        ),
        2,
    )

    # 8. General source fallback

    add_first(
        [
            path
            for path in paths
            if path.lower().endswith(
                (
                    ".py",
                    ".ts",
                    ".tsx",
                    ".js",
                    ".jsx",
                    ".java",
                    ".go",
                    ".rs",
                    ".cpp",
                    ".c",
                )
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
    """
    Keep repository evidence small enough for the implementation
    advisor's LLM context.

    The advisor needs implementation signals, not complete source files.
    """

    if len(content) > max_chars:
        content = (
            content[:max_chars]
            + "\n\n[FILE CONTENT TRUNCATED]"
        )

    return {
        "path": path,
        "content": content,
    }


def build_repository_context(
    github_url: str,
) -> tuple[dict, list[str], dict[str, str]]:
    """
    Download the repository once and derive all inspection data
    locally from the archive.
    """

    owner, repo = parse_github_url(github_url)

    branch = find_default_branch(
        owner,
        repo,
    )

    repository_files = download_repository_archive(
        owner,
        repo,
        branch,
    )

    paths = get_tree(
        repository_files
    )

    repository = {
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

    return (
        repository,
        paths,
        repository_files,
    )


def inspect_repository(
    github_url: str,
) -> dict:
    repository, paths, _ = build_repository_context(
        github_url
    )

    signals = detect_repository_signals(
        paths
    )

    relevant_files = select_relevant_files(
        paths,
        max_files=10,
    )

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
    """
    Build compact repository evidence for the
    research implementation advisor.

    GitHub REST API is intentionally not used here.
    """

    repository, paths, repository_files = (
        build_repository_context(
            github_url
        )
    )

    signals = detect_repository_signals(
        paths
    )

    relevant_files = select_relevant_files(
        paths,
        max_files=14,
    )

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


# Kept only for compatibility with any older imports.
# The current Projects endpoint should use
# build_review_evidence() + research_implementation.py.

def research_review(
    github_url: str,
    question: str,
) -> dict:
    evidence = build_review_evidence(
        github_url,
        question,
    )

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
        print(
            "[github_review] Invalid model output:"
        )
        print(content)

        raise RuntimeError(
            "GitHub research review returned invalid JSON."
        ) from error

    usage = getattr(
        response,
        "usage_metadata",
        None,
    )

    if usage:
        print(
            "[github_review] token usage:",
            usage,
        )

    return {
        "repository": evidence["repository"],
        "relevant_files": evidence[
            "relevant_files"
        ],
        "review": result,
    }