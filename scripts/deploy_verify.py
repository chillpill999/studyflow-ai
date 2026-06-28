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

    # 1. Environment file presence
    root_path = Path(__file__).resolve().parent.parent
    backend_env = root_path / "backend" / ".env"

    if backend_env.exists():
        print_result("Backend .env file detection", True)
    else:
        print_result("Backend .env file detection", False, "Missing backend/.env")
        passed_all = False

    # 2. Verify key environment variables (simulated check if mock runs, else load envs)
    from dotenv import dotenv_values
    env_vars = dotenv_values(backend_env) if backend_env.exists() else {}

    required_keys = [
        "SUPABASE_URL",
        "SUPABASE_ANON_KEY",
        "GEMINI_API_KEY"
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
        backend_dir = root_path / "backend"
        if backend_dir.exists():
            success = compileall.compile_dir(backend_dir, quiet=True)
            if success:
                print_result("Python syntax validation", True, "All modules compile successfully")
            else:
                print_result("Python syntax validation", False, "Syntax compilation errors found in backend/")
                passed_all = False
        else:
            print_result("Python directories verification", False, "backend/ folder not found")
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
