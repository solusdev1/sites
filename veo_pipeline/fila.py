"""Construção, dedup e gravação da fila (contrato fila.json)."""
from __future__ import annotations

import logging
import re
from datetime import datetime, timezone
from pathlib import Path

from .persona import get_look, item_id, montar_prompt
from .schema import dump_json, load_json, validate

log = logging.getLogger(__name__)
HASHTAGS_BASE = ["#IA", "#conteudogeradoporia"]
DISCLOSURE = "Conteúdo gerado por IA"
ANTI_DUPLICACAO = "duplicate objects, extra suitcase, cloned items"


def explicitar_quantidades(cena: str) -> str:
    """Mantém a contagem de objetos durante ações de pegar/puxar/abrir."""
    objetos = "mala|bolsa|carta|celular|caixa|garrafa|copo|chave|foto"
    cena = re.sub(rf"\b(?:uma|um)\s+({objetos})\b", lambda m: f"exatamente UMA {m.group(1)}", cena,
                  flags=re.IGNORECASE)
    return cena


def build_item(persona: dict, *, tipo: str, modo: str | None, look_id: str | None, cena: str, hook: str,
               fala: str, camera: str, duracao_s: int = 8, legenda: str = "", hashtags: list[str] | None = None,
               extra_prompt: str = "", imagem_ancora: str = "", video_fonte: str = "",
               negative_extra: str = "", prompt_final: str = "", flow: dict | None = None,
               frame_inicial: str = "", sequencia_id: str = "", ordem: int | None = None) -> dict:
    look = get_look(persona, look_id)
    cena = explicitar_quantidades(cena)
    neg = persona["negative_prompt"]
    if negative_extra:
        neg = f"{neg}, {negative_extra}"
    neg = f"{neg}, {ANTI_DUPLICACAO}"
    tags = list(dict.fromkeys((hashtags or []) + HASHTAGS_BASE))
    item = {
        "id": item_id(persona["id"], tipo, modo, look["id"], cena, hook, fala, camera, duracao_s, video_fonte,
                      *([sequencia_id, ordem] if sequencia_id else [])),
        "tipo": tipo,
        "modo": modo,
        "look_id": look["id"],
        "cena": cena,
        "hook": hook,
        "fala": fala,
        "camera": camera,
        "duracao_s": duracao_s,
        "prompt_final": explicitar_quantidades(prompt_final) if prompt_final else montar_prompt(persona, look, cena, camera, fala, extra_prompt),
        "negative_prompt": neg,
        "anexos": {"imagem_ancora": imagem_ancora, "video_fonte": video_fonte},
        "legenda": legenda or hook,
        "hashtags": tags,
        "status": "pendente",
    }
    if flow:  # campos de sequência só entram quando usados (filas antigas continuam iguais)
        item.update(flow=flow, frame_inicial=frame_inicial, sequencia_id=sequencia_id, ordem=ordem or 0)
    return item


def dedup(itens: list[dict]) -> list[dict]:
    vistos: set[str] = set()
    out = []
    for it in itens:
        if it["id"] in vistos:
            log.info("item duplicado ignorado: %s", it["id"])
            continue
        vistos.add(it["id"])
        out.append(it)
    return out


def make_fila(persona: dict, itens: list[dict]) -> dict:
    return {
        "version": 1,
        "persona_id": persona["id"],
        "gerado_em": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "itens": dedup(itens),
    }


def save_fila(path: str | Path, fila: dict, append: bool = False) -> dict:
    """Valida e grava; com append mescla com a fila existente (dedup por id)."""
    if append and Path(path).is_file():
        antiga = load_json(path)
        fila["itens"] = dedup(antiga.get("itens", []) + fila["itens"])
    validate("fila", fila)
    dump_json(path, fila)
    log.info("fila gravada em %s (%d itens)", path, len(fila["itens"]))
    return fila


def load_fila(path: str | Path) -> dict:
    f = load_json(path)
    validate("fila", f)
    return f
