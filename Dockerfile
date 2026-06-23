FROM python:3.10

# Hugging Face Spaces requires a non-root user
RUN useradd -m -u 1000 user

WORKDIR /app

# Copy the requirements file from the backend folder
COPY backend/requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend folder into the container
COPY backend/ .

# Ensure the non-root user has ownership so SQLite can write to the database
RUN chown -R user:user /app

# Switch to the non-root user
USER user

# Hugging Face requires the app to listen on port 7860
EXPOSE 7860

# Start the FastAPI backend
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
