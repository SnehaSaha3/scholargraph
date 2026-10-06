import re
from urllib.parse import urlparse

import httpx


GITHUB_API = "https://api.github.com"

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


def parse_github_url(url: str) -> tuple[str, str]:
    parsed = urlparse(url)

    if parsed.netloc.lower() not in {
        "github.com",
        "www.github.com",
    }:
        raise ValueError("Only GitHub repository URLs are supported.")

    parts = [
        part
        for part in parsed.path.strip("/").split("/")
        if part
    ]

    if len(parts) < 2:
        raise ValueError("Invalid GitHub repository URL.")

    owner = parts[0]
    repo = parts[1].removesuffix(".git")

    if not re.match(r"^[A-Za-z0-9_.-]+$", owner):
        raise ValueError("Invalid GitHub owner.")

    if not re.match(r"^[A-Za-z0-9_.-]+$", repo):
        raise ValueError("Invalid GitHub repository.")

    return owner, repo


def github_headers() -> dict[str, str]:
    return {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "ScholarGraph",
    }


def get_repository(owner: str, repo: str) -> dict:
    response = httpx.get(
        f"{GITHUB_API}/repos/{owner}/{repo}",
        headers=github_headers(),
        timeout=20,
    )

    response.raise_for_status()

    data = response.json()

    return {
        "name": data.get("name"),
        "full_name": data.get("full_name"),
        "description": data.get("description"),
        "html_url": data.get("html_url"),
        "default_branch": data.get("default_branch"),
        "language": data.get("language"),
        "stars": data.get("stargazers_count", 0),
        "forks": data.get("forks_count", 0),
        "open_issues": data.get("open_issues_count", 0),
        "updated_at": data.get("updated_at"),
        "private": data.get("private", False),
    }


def should_ignore(path: str) -> bool:
    parts = path.split("/")

    if any(part in IGNORED_PATHS for part in parts):
        return True

    lower = path.lower()

    return any(
        lower.endswith(extension)
        for extension in IGNORED_EXTENSIONS
    )


def get_tree(
    owner: str,
    repo: str,
    branch: str,
) -> list[dict]:
    response = httpx.get(
        f"{GITHUB_API}/repos/{owner}/{repo}/git/trees/{branch}",
        params={"recursive": "1"},
        headers=github_headers(),
        timeout=30,
    )

    response.raise_for_status()

    tree = response.json().get("tree", [])

    return [
        {
            "path": item.get("path"),
            "type": item.get("type"),
            "size": item.get("size", 0),
        }
        for item in tree
        if item.get("path")
        and not should_ignore(item["path"])
    ]


def detect_repository_signals(tree: list[dict]) -> dict:
    paths = {
        item["path"]
        for item in tree
        if item["path"]
    }

    lower_paths = {
        path.lower()
        for path in paths
    }

    return {
        "has_readme": any(
            path.startswith("readme")
            for path in lower_paths
        ),
        "has_tests": any(
            "test" in path
            for path in lower_paths
        ),
        "has_requirements": any(
            path in {
                "requirements.txt",
                "pyproject.toml",
                "poetry.lock",
            }
            for path in lower_paths
        ),
        "has_package_json": "package.json" in lower_paths,
        "has_docker": any(
            "dockerfile" in path
            for path in lower_paths
        ),
        "has_ci": any(
            ".github/workflows/" in path
            for path in lower_paths
        ),
        "has_config": any(
            path.endswith((
                ".yaml",
                ".yml",
                ".toml",
                ".json",
            ))
            for path in lower_paths
        ),
        "possible_env_files": [
            path
            for path in paths
            if path.lower() in {
                ".env",
                ".env.local",
                ".env.production",
            }
        ],
    }


def select_relevant_files(
    tree: list[dict],
    limit: int = 8,
) -> list[str]:
    priority_names = {
        "readme.md": 100,
        "requirements.txt": 95,
        "pyproject.toml": 95,
        "package.json": 95,
        "train.py": 90,
        "training.py": 90,
        "model.py": 85,
        "models.py": 85,
        "evaluate.py": 85,
        "evaluation.py": 85,
        "dataset.py": 80,
        "datasets.py": 80,
        "config.yaml": 75,
        "config.yml": 75,
    }

    candidates = []

    for item in tree:
        path = item["path"]

        if item["type"] != "blob":
            continue

        filename = path.split("/")[-1].lower()

        score = priority_names.get(filename, 0)

        if filename.endswith((
            ".py",
            ".ts",
            ".tsx",
            ".js",
            ".jsx",
        )):
            score += 20

        if any(
            keyword in filename
            for keyword in (
                "train",
                "model",
                "dataset",
                "eval",
                "test",
                "experiment",
                "config",
            )
        ):
            score += 25

        if score:
            candidates.append((score, path))

    candidates.sort(
        key=lambda item: (-item[0], item[1])
    )

    return [
        path
        for _, path in candidates[:limit]
    ]


def inspect_repository(url: str) -> dict:
    owner, repo = parse_github_url(url)

    repository = get_repository(owner, repo)

    tree = get_tree(
        owner,
        repo,
        repository["default_branch"],
    )

    signals = detect_repository_signals(tree)

    relevant_files = select_relevant_files(tree)

    return {
        "repository": repository,
        "signals": signals,
        "tree_summary": {
            "total_files": len(tree),
            "relevant_files": relevant_files,
        },
    }