"""Fila 'genjutsu' (vídeo→vídeo): motion transfer, swap de produto e restyle.

No Google Flow (testado em 2026-10-18): Vídeo → Elementos com Omni 1.1 Flash, usando como elementos o vídeo
fonte e a imagem da personagem. O vídeo fonte precisa ir SEM áudio e com até 10s; com áudio o Flow recusa
("Não é possível editar a fala neste vídeo") e reembolsa.
"""
from __future__ import annotations

import logging
import shutil
import subprocess
from pathlib import Path

from .fila import build_item, make_fila
from .persona import get_look

log = logging.getLogger(__name__)

MODOS = ("motion", "swap_produto", "restyle")
NEG_EXTRA = "choreography drift, camera change, different timing, extra limbs"
DURACAO_MAX_S = 10
FLOW_GENJUTSU = {"modo": "video", "proporcao": "9:16", "submodo": "elementos", "modelo": "Omni 1.1 Flash",
                 "resolucao": "720p"}
SEM_FALA = "Sem fala, ninguém fala; apenas música e som ambiente"

_INSTR = {
    "motion": "Transfira o movimento do vídeo fonte para a personagem: mantenha coreografia, câmera e timing originais, apenas troque quem executa",
    "swap_produto": "Mantenha cena, movimento e câmera do vídeo fonte e troque apenas o objeto na mão da personagem pelo produto indicado, em destaque e nítido",
    "restyle": "Mantenha movimento e câmera do vídeo fonte e aplique novo visual/roupa/estilo, preservando o rosto da personagem",
}

# Instrução para o Flow, que recebe o vídeo fonte e a imagem da personagem como elementos.
_FLOW = {
    "motion": ("Recrie este vídeo mantendo exatamente a coreografia, os movimentos, a câmera, o timing e o cenário. "
               "Substitua a pessoa principal em primeiro plano pela mulher da imagem de referência"),
    "swap_produto": ("Recrie este vídeo mantendo cena, movimentos e câmera. A pessoa principal passa a ser a mulher da "
                     "imagem de referência, e o objeto na mão dela vira o produto, em destaque e nítido"),
    "restyle": ("Recrie este vídeo mantendo movimentos e câmera. A pessoa principal passa a ser a mulher da imagem "
                "de referência, com novo visual"),
}

_VARIACOES = {
    "motion": ["versão antes/depois: original e depois a Luna", "Luna reagindo à própria ilusão", "versão estilo anime da mesma coreografia"],
    "swap_produto": ["produto em destaque na primeira metade", "produto mostrado em close no final", "reação positiva ao produto"],
    "restyle": ["troca de roupa para outro look", "estilo anime", "cenário diferente"],
}


def montar_prompt_flow(persona: dict, look: dict, modo: str, variacao: str) -> str:
    partes = [_FLOW[modo], f"{persona['bloco_fixo'].rstrip('. ')}", f"Look: {look['descricao']}",
              f"Variação: {variacao}", "As outras pessoas e o fundo continuam iguais", SEM_FALA]
    return ". ".join(p.rstrip(". ") for p in partes) + "."


def preparar_fonte(video: str | Path, out: str | Path | None = None, duracao_s: int = DURACAO_MAX_S,
                   run=subprocess.run) -> Path:
    """Cópia sem áudio e com no máximo `duracao_s` segundos, pronta para o Flow (<nome>_mudo.mp4)."""
    src = Path(video)
    if not src.is_file():
        raise FileNotFoundError(f"vídeo fonte não encontrado: {src}")
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise FileNotFoundError("ffmpeg não encontrado no PATH (necessário para --preparar-fonte)")
    dst = Path(out) if out else src.with_name(f"{src.stem}_mudo.mp4")
    run([ffmpeg, "-v", "error", "-y", "-i", str(src), "-t", str(duracao_s), "-an", "-c:v", "libx264", "-crf", "18",
         "-preset", "medium", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(dst)], check=True)
    log.info("fonte preparada (sem áudio, até %ss): %s", duracao_s, dst)
    return dst


def gerar(persona: dict, modo: str, video_fonte: str, imagem_ancora: str, qtd: int) -> dict:
    if modo not in MODOS:
        raise ValueError(f"modo inválido: {modo} (use {', '.join(MODOS)})")
    itens = []
    var = _VARIACOES[modo]
    for i in range(qtd):
        v = var[i % len(var)] + (f" #{i // len(var) + 1}" if i >= len(var) else "")
        look = get_look(persona, persona["looks"][i % len(persona["looks"])]["id"])
        cena = f"{_INSTR[modo]}. Fonte: {video_fonte}. Variação: {v}"
        itens.append(build_item(
            persona, tipo="genjutsu", modo=modo, look_id=look["id"], cena=cena,
            hook=f"Genjutsu {modo}: {v}", fala="", camera="idêntica ao vídeo fonte", duracao_s=DURACAO_MAX_S,
            legenda=f"Minha personagem de IA refez isso ({modo.replace('_', ' ')})",
            hashtags=["#genjutsu", "#personagemIA"], imagem_ancora=imagem_ancora, video_fonte=video_fonte,
            negative_extra=NEG_EXTRA, prompt_final=montar_prompt_flow(persona, look, modo, v), flow=FLOW_GENJUTSU,
            ordem=i,
        ))
    return make_fila(persona, itens)
