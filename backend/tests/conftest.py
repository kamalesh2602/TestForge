import pytest
from main import app


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    """Resets SlowAPI rate limit counters between unit tests to prevent cross-test throttling."""
    app.state.limiter.reset()
    yield
    app.state.limiter.reset()

