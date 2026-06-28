"""
Unit tests for configuration module.
"""
import os
from unittest.mock import patch

import pytest


class TestConfig:
    """Tests for app.core.config.Settings."""

    @patch.dict(
        os.environ,
        {
            "SUPABASE_URL": "https://test.supabase.co",
            "SUPABASE_ANON_KEY": "test-anon-key",
            "SUPABASE_JWT_SECRET": "test-jwt-secret",
            "GEMINI_API_KEY": "test-gemini-key",
            "ENV": "test",
        },
    )
    def test_settings_loads_from_env(self):
        """Test that settings load from environment variables."""
        # Need to reload module after env change
        import importlib
        from app.core import config

        importlib.reload(config)
        settings = config.settings

        assert settings.SUPABASE_URL == "https://test.supabase.co"
        assert settings.SUPABASE_ANON_KEY == "test-anon-key"
        assert settings.SUPABASE_JWT_SECRET == "test-jwt-secret"
        assert settings.GEMINI_API_KEY == "test-gemini-key"
        assert settings.ENV == "test"

    def test_settings_defaults(self):
        """Test default settings values."""
        from app.core.config import Settings

        # Create fresh settings instance
        s = Settings(
            SUPABASE_URL="https://test.supabase.co",
            SUPABASE_ANON_KEY="test",
            SUPABASE_JWT_SECRET="test",
            GEMINI_API_KEY="test",
        )

        assert s.PROJECT_NAME == "The Study Flow"
        assert s.API_V1_STR == "/api/v1"
        assert s.PRIMARY_MODEL == "gemini-2.5-pro"
        assert s.SECONDARY_MODEL == "gemini-2.5-flash"
        assert s.TESTING is False
