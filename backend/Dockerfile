FROM python:3.12-slim

WORKDIR /app

# Install system dependencies (if any) and Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt uvicorn[standard] python-dotenv

# Copy the rest of the application code
COPY . .

# Expose the port (Fly will map $PORT automatically)
ENV PORT=8080

# Run the FastAPI app with uvicorn
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-7860}
