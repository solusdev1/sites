"""Custo estimado por fila: segundos × preço configurável."""
from __future__ import annotations


def total_segundos(fila: dict, ids: set[str] | None = None) -> float:
    return sum(i["duracao_s"] for i in fila["itens"] if ids is None or i["id"] in ids)


def estimar(fila: dict, price_per_second: float, ids: set[str] | None = None) -> dict:
    s = total_segundos(fila, ids)
    return {"segundos": s, "preco_por_segundo": price_per_second, "custo_usd": round(s * price_per_second, 4)}
