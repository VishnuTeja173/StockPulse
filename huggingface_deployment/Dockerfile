FROM python:3.12-slim

WORKDIR /app

# Install system dependencies (if any) and Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt uvicorn[standard] python-dotenv

# Copy the rest of the application code
COPY . .

# Expose the port (Hugging Face uses 7860)
ENV PORT=7860

# Run the FastAPI app with uvicorn
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-7860}
