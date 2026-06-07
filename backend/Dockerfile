FROM python:3.12-slim

WORKDIR /app

# Install dependencies first (separate layer for better caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose the API port
EXPOSE 8000

# Run the app; bind to 0.0.0.0 so the container port is reachable
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
