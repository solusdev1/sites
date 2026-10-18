"""Pós-produção: renomeia MP4s, gera legenda+hashtags com disclosure de IA e checklist de quarentena."""
from __future__ import annotations

import csv
import logging
from datetime import date
from pathlib import Path

from .fila import DISCLOSURE

log = logging.getLogger(__name__)


def montar_legenda(item: dict) -> str:
    tags = list(item.get("hashtags", []))
    if "#IA" not in tags:
        tags.append("#IA")
    return f"{item['legenda']}\n\n{DISCLOSURE}.\n\n{' '.join(tags)}\n"


def _casar(mp4s: list[Path], itens: list[dict]) -> list[tuple[Path, dict]]:
    """Casa por id no nome do arquivo; os restantes, por ordem de modificação com a fila restante."""
    por_id = {i["id"]: i for i in itens}
    pares, sobra = [], []
    usados: set[str] = set()
    for p in mp4s:
        achado = next((i for i in por_id if i in p.stem and i not in usados), None)
        if achado:
            usados.add(achado)
            pares.append((p, por_id[achado]))
        else:
            sobra.append(p)
    restantes = [i for i in itens if i["id"] not in usados]
    for p, it in zip(sorted(sobra, key=lambda x: x.stat().st_mtime), restantes):
        pares.append((p, it))
    for p in sobra[len(restantes):]:
        log.warning("%s sem item correspondente na fila; ignorado", p.name)
    return pares


def processar(pasta: str | Path, fila: dict, data: str | None = None) -> dict:
    pasta = Path(pasta)
    data = data or date.today().isoformat()
    # fila_estado.json do plugin: itens descartados na quarentena nunca recebem arquivo
    itens = [i for i in fila["itens"] if i.get("status") != "descartado" and i["tipo"] != "imagem"]
    mp4s = sorted(p for p in pasta.glob("*.mp4") if not p.stem.startswith(data))
    pares = _casar(mp4s, itens)
    linhas, renomeados = [], []
    for p, it in pares:
        novo = pasta / f"{data}_{it['id']}.mp4"
        if novo.exists() and novo != p:
            log.warning("%s já existe; %s não renomeado", novo.name, p.name)
            continue
        p.rename(novo)
        novo.with_suffix(".txt").write_text(montar_legenda(it), encoding="utf-8")
        renomeados.append(novo.name)
        linhas.append([novo.name, it["id"], "", ""])
        log.info("%s -> %s", p.name, novo.name)
    csv_path = pasta / "quarentena.csv"
    novo_csv = not csv_path.exists()
    with csv_path.open("a", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        if novo_csv:
            w.writerow(["arquivo", "id", "rosto_ok (sim/nao)", "observacao"])
        w.writerows(linhas)
    return {"renomeados": renomeados, "quarentena_csv": str(csv_path)}
