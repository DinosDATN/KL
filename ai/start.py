#!/usr/bin/env python3
"""
ChatAI System Server Startup Script

This script starts the FastAPI server with proper configuration for development and testing.
Make sure to set up your environment variables in .env file before running.
"""

import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def main():
    """Start the FastAPI server with appropriate configuration."""
    
    # Server configuration
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("DEBUG", "True").lower() == "true"
    
    print("=" * 60)
    print("🤖 ChatAI System API Server")
    print("=" * 60)
    print(f"🌐 Server: http://{host}:{port}")
    print(f"📚 Swagger UI: http://{host}:{port}/docs")
    print(f"📖 ReDoc: http://{host}:{port}/redoc")
    print(f"🔍 Debug Mode: {debug}")
    print("=" * 60)
    
    # Check if OpenAI API key is configured
    if not os.getenv("OPENAI_API_KEY"):
        print("⚠️  WARNING: OPENAI_API_KEY is not set!")
        print("   Please set your OpenAI API key in the .env file")
        print("   Copy .env.example to .env and update the values")
        print("=" * 60)
    
    # Check database configuration
    db_config_vars = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"]
    missing_db_vars = [var for var in db_config_vars if not os.getenv(var)]
    
    if missing_db_vars:
        print(f"⚠️  WARNING: Missing database configuration: {', '.join(missing_db_vars)}")
        print("   Please configure database settings in the .env file")
        print("=" * 60)
    
    print("🚀 Starting server...")
    print("   Press Ctrl+C to stop")
    print("=" * 60)
    
    try:
        uvicorn.run(
            "service:app",
            host=host,
            port=port,
            reload=debug,
            log_level="info" if debug else "warning"
        )
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {e}")

if __name__ == "__main__":
    main()