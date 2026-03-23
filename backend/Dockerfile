FROM python:3.12-slim

# /app_root/backend/ — so 'backend' is importable as a package
WORKDIR /app_root

COPY requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY . ./backend/

ENV PYTHONPATH=/app_root

WORKDIR /app_root/backend

CMD ["sh", "-c", "alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port 8000"]
