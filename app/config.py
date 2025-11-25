# Production Configuration
# This file contains production-specific settings

import os
from typing import Optional

class ProductionConfig:
    """Production configuration for Smart Family Calendar"""
    
    # Database - Use Connection Pooler
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres.vikyhkrozbbptxcrtgcx:PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
    )
    
    # API URLs
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # AI
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # CORS - Update with your frontend domain
    ALLOWED_ORIGINS: list = [
        "https://your-frontend.vercel.app",
        "https://your-custom-domain.com"
    ]
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    @classmethod
    def validate(cls) -> bool:
        """Validate that all required environment variables are set"""
        required = ["SECRET_KEY", "SUPABASE_URL", "SUPABASE_KEY", "GEMINI_API_KEY"]
        missing = [var for var in required if not os.getenv(var)]
        
        if missing:
            print(f"❌ Missing required environment variables: {', '.join(missing)}")
            return False
        
        print("✅ All required environment variables are set")
        return True

# Development Configuration
class DevelopmentConfig(ProductionConfig):
    """Development configuration - inherits from Production"""
    
    # Allow all origins in development
    ALLOWED_ORIGINS: list = ["*"]
    
    # More verbose logging
    LOG_LEVEL: str = "DEBUG"
    
    # Database - Direct connection (requires IP whitelist)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:PASSWORD@db.vikyhkrozbbptxcrtgcx.supabase.co:5432/postgres"
    )

# Select configuration based on environment
ENV = os.getenv("ENVIRONMENT", "development")
config = ProductionConfig() if ENV == "production" else DevelopmentConfig()
