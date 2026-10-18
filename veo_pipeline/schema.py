"""Validação por JSON Schema (contrato compartilhado com o plugin)."""
from __future__ import annotations

import json
from pathlib import Path

from jsonschema import Draft202012Validator

SCHEMAS_DIR = Path(__file__).resolve().parent.parent / "schemas"


class ValidationError(ValueError):
    pass


def _validator(name: str) -> Draft202012Validator:
    schema = json.loads((SCHEMAS_DIR / f"{name}.schema.json").read_text(encoding="utf-8"))
    return Draft202012Validator(schema)


def validate(name: str, data: dict) -> None:
    errors = sorted(_validator(name).iter_errors(data), key=lambda e: list(e.absolute_path))
    if errors:
        msg = "; ".join(f"{'/'.join(map(str, e.absolute_path)) or '<raiz>'}: {e.message}" for e in errors[:5])
        raise ValidationError(f"{name} inválido: {msg}")


def load_json(path: str | Path) -> dict:
    return json.loads(Path(path).read_text(encoding="utf-8"))


def dump_json(path: str | Path, data: dict) -> None:
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
