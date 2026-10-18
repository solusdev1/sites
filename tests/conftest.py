import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from veo_pipeline.persona import load_persona  # noqa: E402


@pytest.fixture
def persona():
    return load_persona(ROOT / "data" / "personas" / "luna.json")


@pytest.fixture
def persona_path():
    return str(ROOT / "data" / "personas" / "luna.json")
