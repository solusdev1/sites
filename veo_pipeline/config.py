"""Config via variáveis de ambiente / arquivo .env (sem dependências)."""
from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from pathlib import Path


def load_dotenv(path: str | Path = ".env") -> None:
    """Carrega KEY=VALUE do .env sem sobrescrever variáveis já definidas."""
    p = Path(path)
    if not p.is_file():
        return
    for line in p.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        v = v.strip().strip('"').strip("'")
        if v:
            os.environ.setdefault(k.strip(), v)


@dataclass
class Config:
    gemini_api_key: str = ""
    veo_model: str = "veo-3.1-fast-generate-preview"
    veo_resolution: str = "720p"
    price_per_second: float = 0.15  # USD/s, configurável; confira a tabela atual
    poll_interval: float = 10.0
    poll_timeout: float = 600.0
    text_model: str = "gemini-2.5-flash"
    log_level: str = "INFO"

    @classmethod
    def from_env(cls) -> "Config":
        e = os.environ
        d = cls()
        return cls(
            gemini_api_key=e.get("GEMINI_API_KEY", ""),
            veo_model=e.get("VEO_MODEL") or d.veo_model,
            veo_resolution=e.get("VEO_RESOLUTION") or d.veo_resolution,
            price_per_second=float(e.get("VEO_PRICE_PER_SECOND") or d.price_per_second),
            poll_interval=float(e.get("VEO_POLL_INTERVAL") or d.poll_interval),
            poll_timeout=float(e.get("VEO_POLL_TIMEOUT") or d.poll_timeout),
            text_model=e.get("GEMINI_TEXT_MODEL") or d.text_model,
            log_level=(e.get("LOG_LEVEL") or d.log_level).upper(),
        )


def setup_logging(level: str = "INFO") -> None:
    logging.basicConfig(
        level=getattr(logging, level, logging.INFO),
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
