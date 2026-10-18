"""Carregar/validar persona e montar prompt_final."""
from __future__ import annotations

import hashlib
from pathlib import Path

from .schema import load_json, validate

ARQUETIPOS = ("relatable_cidade_grande", "fit", "luxo_viagem", "foodie", "review_tech", "serial_lore")
ALIAS = {"relatable": "relatable_cidade_grande"}


def normalizar_arquetipo(a: str) -> str:
    return ALIAS.get(a, a)


def load_persona(path: str | Path) -> dict:
    p = load_json(path)
    validate("persona", p)
    p["arquetipo"] = normalizar_arquetipo(p["arquetipo"])
    return p


def get_look(persona: dict, look_id: str | None = None) -> dict:
    looks = persona["looks"]
    if look_id is None:
        return looks[0]
    for lk in looks:
        if lk["id"] == look_id:
            return lk
    raise KeyError(f"look '{look_id}' não existe na persona {persona['id']}")


def montar_prompt(persona: dict, look: dict, cena: str, camera: str, fala: str, extra: str = "") -> str:
    """bloco_fixo + look + cena + camera + fala + estilo (+ instrução extra)."""
    partes = [
        persona["bloco_fixo"].rstrip(". "),
        f"Look: {look['descricao']}",
        f"Cena: {cena}",
        f"Câmera: {camera}",
    ]
    if fala:
        partes.append(f'Fala (português do Brasil): "{fala}"')
    if extra:
        partes.append(extra)
    partes.append(f"Estilo: {persona['estilo']}")
    return ". ".join(p.rstrip(". ") for p in partes) + "."


def montar_prompt_imagem(persona: dict, look: dict, cena: str = "") -> str:
    """Imagem estática (sem fala, sem movimento): ficha de referência ou, com cena, o 1º frame dela."""
    if cena:
        abertura = "Fotografia realista, primeiro frame de um vídeo vertical, mesma pessoa da imagem de referência"
        fundo = f"Cena: {cena}. Pose natural no início da ação, luz natural, estilo foto de celular"
    else:
        abertura = ("Retrato fotográfico de referência de personagem, corpo inteiro, de pé, de frente para a câmera, "
                    "olhando para a lente, expressão neutra com leve sorriso")
        fundo = "Fundo neutro cinza claro de estúdio, luz natural suave e uniforme, foto realista estilo celular, nitidez no rosto"
    partes = [abertura, persona["bloco_fixo"].rstrip(". "), f"Look: {look['descricao']}", fundo,
              "Sem texto, sem legenda, sem marca d'água, sem outras pessoas"]
    return ". ".join(p.rstrip(". ") for p in partes) + "."


def item_id(*parts: object) -> str:
    """Hash estável do conteúdo (mesmo conteúdo => mesmo id)."""
    raw = "\x1f".join("" if p is None else str(p) for p in parts)
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()[:12]
