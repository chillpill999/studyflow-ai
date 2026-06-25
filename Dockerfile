FROM python:3.11-slim

# Install system dependencies for PyMuPDF (fitz)
RUN apt-get update && apt-get install -y \
    libmupdf-dev \
    mupdf \
    gcc \
    g++ \
    libfreetype6-dev \
    libharfbuzz-dev \
    && rm -rf /var/lib/apt/lists/*

# Hugging Face Spaces requires a non-root user
RUN useradd -m -u 1000 user

WORKDIR /app

# Copy the requirements file from the backend folder
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend folder into the container
COPY backend/ .

# Ensure the non-root user has ownership
RUN chown -R user:user /app

# Switch to the non-root user
USER user

# Hugging Face requires the app to listen on port 7860
EXPOSE 7860

# Start the FastAPI backend
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
