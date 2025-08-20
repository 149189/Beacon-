# Python + Django
FROM python:3.11-slim

WORKDIR /app

# Install system deps required for mysqlclient
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    default-libmysqlclient-dev \
    pkg-config \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt || \
    (pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt) || \
    (pip install --upgrade pip && pip install --no-cache-dir --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org -r requirements.txt)

# Copy project files
COPY . .

# Create a symlink to use docker.env as config.env
RUN ln -sf docker.env config.env

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
