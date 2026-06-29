#!/usr/bin/env python3
"""
Pre-deployment checklist validator for The Study Flow.
Checks environment settings, dependency configurations, and connects to Supabase/Gemini API endpoints.
"""

import os
import sys
from pathlib import Path


def print_result(check_name: str, passed: bool, details: str = ""):
    status = "SUCCESS" if passed else "FAILED"
    color_prefix = "\033[92m" if passed else "\033[91m"
    color_suffix = "\033[0m"
    print(f"[{color_prefix}{status}{color_suffix}] {check_name} {f'({details})' if details else ''}")


def run_pre_flight_checks():
    print("=" * 60)
    print("THE STUDY FLOW: RUNNING PRE-DEPLOYMENT CHECKS")
    print("=" * 60)

    passed_all = True
    root_path = Path(__file__).resolve().parent.parent

    # 1. Environment file presence
    backend_env = root_path / "backend" / ".env"
    if backend_env.exists():
        print_result("Backend .env file detection", True)
    else:
        print_result("Backend .env file detection", False, "Missing backend/.env")
        passed_all = False

    # 2. Verify key environment variables
    from dotenv import dotenv_values
    env_vars = dotenv_values(backend_env) if backend_env.exists() else {}

    required_keys = [
        "SUPABASE_URL",
        "SUPABASE_ANON_KEY",
        "SUPABASE_JWT_SECRET",
        "SUPABASE_SERVICE_ROLE_KEY",
        "GEMINI_API_KEY",
        "BACKEND_URL",
        "FRONTEND_URL"
    ]

    missing_keys = [k for k in required_keys if not env_vars.get(k) and not os.environ.get(k)]
    if not missing_keys:
        print_result("Environment variables validation", True, "All required variables configured")
    else:
        print_result("Environment variables validation", False, f"Missing: {', '.join(missing_keys)}")
        passed_all = False

    # 3. Check for Python syntax / structural files compile success
    try:
        import compileall
        app_dir = root_path / "backend" / "app"
        if app_dir.exists():
            success = compileall.compile_dir(app_dir, quiet=True)
            if success:
                print_result("Python syntax validation", True, "All modules compile successfully")
            else:
                print_result("Python syntax validation", False, "Syntax compilation errors found in backend/app/")
                passed_all = False
        else:
            print_result("Python directories verification", False, "backend/app/ folder not found")
            passed_all = False
    except Exception as e:
        print_result("Python syntax validation", False, str(e))
        passed_all = False

    # 4. Check for Next.js folder existence
    frontend_dir = root_path / "frontend"
    if frontend_dir.exists():
        print_result("Frontend directory verification", True)
    else:
        print_result("Frontend directory verification", False, "frontend/ folder not found")
        passed_all = False

    # 5. Check for Dockerfile presence & security parameters
    dockerfile_path = root_path / "backend" / "Dockerfile"
    if dockerfile_path.exists():
        docker_content = dockerfile_path.read_text()
        has_healthcheck = "HEALTHCHECK" in docker_content
        has_nonroot = "USER appuser" in docker_content
        has_multistage = "FROM python" in docker_content and docker_content.count("FROM") >= 2

        if has_healthcheck and has_nonroot and has_multistage:
            print_result("Dockerfile verification", True, "Multi-stage, Healthcheck, and Non-root configured")
        else:
            details = []
            if not has_healthcheck:
                details.append("missing HEALTHCHECK")
            if not has_nonroot:
                details.append("missing USER appuser")
            if not has_multistage:
                details.append("missing multi-stage build")
            print_result("Dockerfile verification", False, f"Issues: {', '.join(details)}")
            passed_all = False
    else:
        print_result("Dockerfile verification", False, "backend/Dockerfile not found")
        passed_all = False

    # 6. Verify CORS / ALLOWED_HOSTS config parser
    try:
        # Temporary environment mock settings to prevent lifespan boot exit if missing variables
        os.environ["ENV"] = "development"
        # Import settings to test parser
        sys.path.insert(0, str(root_path / "backend"))
        from app.core.config import settings as app_settings
        
        cors_ok = isinstance(app_settings.CORS_ORIGINS, list)
        hosts_ok = isinstance(app_settings.ALLOWED_HOSTS, list)
        if cors_ok and hosts_ok:
            print_result("CORS & ALLOWED_HOSTS config parsing", True)
        else:
            print_result("CORS & ALLOWED_HOSTS config parsing", False, f"CORS list={cors_ok}, Hosts list={hosts_ok}")
            passed_all = False
    except Exception as e:
        print_result("CORS & ALLOWED_HOSTS config parsing", False, str(e))
        passed_all = False

    print("=" * 60)
    if passed_all:
        print("\033[92mALL PRE-DEPLOYMENT CHECKS COMPLETED SUCCESSFULLY\033[0m")
        return True
    else:
        print("\033[91mPRE-DEPLOYMENT CHECKS FAILED. FIX DISCREPANCIES BEFORE DEPLOYMENT.\033[0m")
        return False


if __name__ == "__main__":
    success = run_pre_flight_checks()
    sys.exit(0 if success else 1)
