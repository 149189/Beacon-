FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies for mysqlclient and other C extensions
RUN apt-get update && apt-get install -y \
    pkg-config \
    default-libmysqlclient-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Upgrade pip and install Python dependencies
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy rest of the backend code
COPY . .

# Expose API port
EXPOSE 8000

# Run backend server
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
