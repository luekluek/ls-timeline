# Empty conftest.py — ensures pytest exits 0 when no tests are collected yet.
# Remove once actual test files are added in Stories 2.2+.

def pytest_sessionfinish(session, exitstatus):
    """Override exit code 5 (no tests collected) to 0 for empty test suites."""
    if exitstatus == 5:
        session.exitstatus = 0
