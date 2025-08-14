#!/usr/bin/env python3
"""
MySQL Database Setup Script for Beacon Admin Panel
This script helps you create the MySQL database and user for the Beacon application.
"""

import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

def create_database():
    """Create MySQL database and user for Beacon application"""
    
    # Load environment variables
    load_dotenv()
    
    # Get database configuration from environment variables
    db_name = os.getenv('MYSQL_DB', 'beacon_db')
    db_user = os.getenv('MYSQL_USER', 'root')
    db_password = os.getenv('MYSQL_PASSWORD', '')
    db_host = os.getenv('MYSQL_HOST', 'localhost')
    db_port = os.getenv('MYSQL_PORT', '3306')
    
    print("🚀 Beacon MySQL Database Setup")
    print("=" * 40)
    print(f"Database Name: {db_name}")
    print(f"Database User: {db_user}")
    print(f"Database Host: {db_host}")
    print(f"Database Port: {db_port}")
    print("=" * 40)
    
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
            
    except Error as e:
        print(f"❌ Error: {e}")
        print("\n🔧 Troubleshooting:")
        print("1. Make sure MySQL server is running")
        print("2. Check your MySQL credentials in .env file")
        print("3. Ensure MySQL user has CREATE privileges")
        print("4. Try connecting manually: mysql -u root -p")
        
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()
            print("\n🔌 Database connection closed.")

def test_connection():
    """Test connection to the Beacon database"""
    
    load_dotenv()
    
    db_name = os.getenv('MYSQL_DB', 'beacon_db')
    db_user = os.getenv('MYSQL_USER', 'root')
    db_password = os.getenv('MYSQL_PASSWORD', '')
    db_host = os.getenv('MYSQL_HOST', 'localhost')
    db_port = os.getenv('MYSQL_PORT', '3306')
    
    try:
        connection = mysql.connector.connect(
            host=db_host,
            port=int(db_port),
            user=db_user,
            password=db_password,
            database=db_name
        )
        
        if connection.is_connected():
            print(f"✅ Successfully connected to MySQL database '{db_name}'!")
            
            cursor = connection.cursor()
            cursor.execute("SELECT VERSION()")
            version = cursor.fetchone()
            print(f"📊 MySQL Version: {version[0]}")
            
            # Show tables if they exist
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            
            if tables:
                print(f"\n📋 Tables in '{db_name}':")
                for table in tables:
                    print(f"  - {table[0]}")
            else:
                print(f"\n📋 No tables found in '{db_name}' (this is normal for new databases)")
                
    except Error as e:
        print(f"❌ Connection failed: {e}")
        
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    print("Choose an option:")
    print("1. Setup MySQL database")
    print("2. Test database connection")
    
    choice = input("\nEnter your choice (1 or 2): ").strip()
    
    if choice == "1":
        create_database()
    elif choice == "2":
        test_connection()
    else:
        print("Invalid choice. Please run the script again.")
