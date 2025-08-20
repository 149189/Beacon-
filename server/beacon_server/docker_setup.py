#!/usr/bin/env python3
"""
Docker Database Setup Script for Beacon Admin Panel
This script helps you create the MySQL database and user for the Beacon application in Docker.
"""

import mysql.connector
from mysql.connector import Error
import os
import time
from dotenv import load_dotenv

def wait_for_mysql(max_retries=30, delay=2):
    """Wait for MySQL to be ready"""
    print("🔄 Waiting for MySQL to be ready...")
    
    for attempt in range(max_retries):
        try:
            connection = mysql.connector.connect(
                host=os.getenv('DB_HOST', 'db'),
                port=int(os.getenv('DB_PORT', '3306')),
                user=os.getenv('DB_USER', 'root'),
                password=os.getenv('DB_PASSWORD', 'Kaustubh@149')
            )
            
            if connection.is_connected():
                print("✅ MySQL is ready!")
                connection.close()
                return True
                
        except Error as e:
            print(f"⏳ Attempt {attempt + 1}/{max_retries}: MySQL not ready yet ({e})")
            if attempt < max_retries - 1:
                time.sleep(delay)
    
    print("❌ MySQL failed to become ready after maximum retries")
    return False

def create_database():
    """Create MySQL database and user for Beacon application"""
    
    # Load environment variables from docker.env
    load_dotenv('docker.env')
    
    # Get database configuration from environment variables
    db_name = os.getenv('MYSQL_DB', 'beacon_db')
    db_user = os.getenv('DB_USER', 'root')
    db_password = os.getenv('DB_PASSWORD', 'Kaustubh@149')
    db_host = os.getenv('DB_HOST', 'db')
    db_port = os.getenv('DB_PORT', '3306')
    
    print("🚀 Beacon MySQL Database Setup (Docker)")
    print("=" * 50)
    print(f"Database Name: {db_name}")
    print(f"Database User: {db_user}")
    print(f"Database Host: {db_host}")
    print(f"Database Port: {db_port}")
    print("=" * 50)
    
    # Wait for MySQL to be ready
    if not wait_for_mysql():
        return False
    
    try:
        # Connect to MySQL server (without specifying database)
        connection = mysql.connector.connect(
            host=db_host,
            port=int(db_port),
            user=db_user,
            password=db_password
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            
            # Create database if it doesn't exist
            print(f"\n📦 Creating database '{db_name}'...")
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            print(f"✅ Database '{db_name}' created successfully!")
            
            # Show existing databases
            cursor.execute("SHOW DATABASES")
            databases = cursor.fetchall()
            print("\n📋 Available databases:")
            for db in databases:
                print(f"  - {db[0]}")
            
            # Test connection to the new database
            print(f"\n🔗 Testing connection to '{db_name}'...")
            cursor.execute(f"USE `{db_name}`")
            print(f"✅ Successfully connected to '{db_name}'!")
            
            # Show database information
            cursor.execute("SELECT VERSION()")
            version = cursor.fetchone()
            print(f"📊 MySQL Version: {version[0]}")
            
            print("\n🎉 MySQL database setup completed successfully!")
            print("\nNext steps:")
            print("1. Run: python manage.py makemigrations")
            print("2. Run: python manage.py migrate")
            print("3. Run: python manage.py setup_demo_data")
            print("4. Run: python manage.py runserver")
            
            return True
            
    except Error as e:
        print(f"❌ Error: {e}")
        print("\n🔧 Troubleshooting:")
        print("1. Make sure MySQL container is running")
        print("2. Check your MySQL credentials in docker.env file")
        print("3. Ensure MySQL user has CREATE privileges")
        print("4. Check Docker container logs: docker-compose logs db")
        
        return False
        
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()
            print("\n🔌 Database connection closed.")

if __name__ == "__main__":
    success = create_database()
    if not success:
        exit(1)
