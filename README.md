# ScholarGraph

<p align="center">
  <img src="apps/web/public/h.png" alt="ScholarGraph Logo" width="110" />
</p>

<p align="center">
  <strong>Research discovery. Structured planning. Clear direction.</strong>
</p>

<p align="center">
  An AI-powered, multi-agent workspace that helps researchers explore literature, discover resources, plan research, and move ideas toward implementation.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/LangGraph-1C3C3C?style=flat" alt="LangGraph" />
  <img src="https://img.shields.io/badge/Groq-GPT--OSS%20120B-orange?style=flat" alt="Groq GPT-OSS 120B" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=flat" alt="MIT License" />
</p>

---

## Overview

Research often involves switching between papers, datasets, books, planning tools, and implementation environments. ScholarGraph brings these activities together in a unified workspace.

Built around specialized AI agents, it helps users investigate research questions, find relevant resources, organize their next steps, and analyze existing project implementations.

## Features

- **Literature Discovery** — Explore recent and foundational research papers relevant to a research question.
- **Dataset Discovery** — Search for datasets that may support research and experimentation.
- **Book Discovery** — Find books and learning resources related to a research domain.
- **Research Planner** — Turn research questions into structured milestones with estimated effort and actionable next steps.
- **Research Projects** — Connect GitHub repositories, examine existing implementations, and identify potential development directions.
- **Conversation History** — Revisit previous research sessions and continue from where you left off.
- **Multi-Agent Research** — Coordinate specialized agents across research discovery, resource search, planning, and project analysis.

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | Python, FastAPI |
| Agent Orchestration | LangChain, LangGraph |
| Language Model | GPT-OSS 120B via Groq |

## Getting Started

### Prerequisites

- Node.js and npm
- Python
- A Groq API key

### 1. Clone the repository

```bash
git clone https://github.com/SnehaSaha3/scholargraph.git
cd scholargraph
```

### 2. Set up the frontend

```bash
cd apps/web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Set up the backend

Open a separate terminal and navigate to the directory containing the FastAPI application.

Activate your Python virtual environment and install the dependencies using the project's dependency file. For example:

```bash
pip install -r requirements.txt
```

Configure the required environment variables and start the backend using the entry point defined in your project.

*Adjust the dependency file path and startup command to match your actual backend configuration.*

## Environment Variables

Configure the environment variables required by your local setup and deployment.

| Variable | Purpose |
|---|---|
| `GROQ_API_KEY` | Authenticates requests to the Groq API |
| Backend API URL | Connects the frontend to the backend |
| GitHub token, if required | Enables authenticated repository access |

Use the exact variable names expected by your application. Keep credentials in environment files or your deployment platform's secret manager, and never commit secrets to version control.

## Project Structure

```text
scholargraph/
├── apps/
│   └── web/
│       └── src/
│           └── app/       # Next.js application routes
├── backend/
│   └── app/
│       └── agents/        # Research agent implementations
├── LICENSE
└── README.md
```

*The structure above is representative. Update directory names to reflect the actual repository.*

## Current Status

ScholarGraph is under active development. Its core workflows focus on research resource discovery, structured planning, conversation continuity, and GitHub-based project analysis.

Results and recommendations depend on available source data, model output, and external service availability.

## Roadmap

- Improve the relevance of paper and dataset discovery.
- Refine research planning and milestone generation.
- Strengthen agent reliability and error handling.
- Improve repository analysis and implementation recommendations.
- Continue refining the research workspace experience.

## Contributing

Bug reports, suggestions, and contributions are welcome. For significant changes, open an issue to discuss the proposed improvement before submitting a pull request.

## License

Distributed under the [MIT License](LICENSE).

---

<p align="center">
  <strong>ScholarGraph</strong><br />
  From research questions to meaningful next steps.
</p>
