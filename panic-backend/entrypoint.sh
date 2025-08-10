#!/usr/bin/env bash
set -e

# Wait for MySQL
echo "Waiting for MySQL at ${MYSQL_HOST}:${MYSQL_PORT}..."
until nc -z ${MYSQL_HOST} ${MYSQL_PORT}; do
  echo "MySQL not ready - sleeping 1s..."
  sleep 1
done
echo "MySQL is up - continuing."

# Run migrations & collectstatic (optional)
python manage.py migrate --noinput

# Start development server (you can replace with gunicorn for prod)
python manage.py runserver 0.0.0.0:8000
