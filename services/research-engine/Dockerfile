FROM python:3.13-slim

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

WORKDIR /srv

COPY pyproject.toml alembic.ini ./
COPY src ./src
COPY migrations ./migrations

RUN pip install --no-cache-dir .

CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]