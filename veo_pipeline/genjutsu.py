"""Fila 'genjutsu' (vídeo→vídeo): motion transfer, swap de produto e restyle."""
from __future__ import annotations

from .fila import build_item, make_fila

MODOS = ("motion", "swap_produto", "restyle")
NEG_EXTRA = "choreography drift, camera change, different timing, extra limbs"

_INSTR = {
    "motion": "Transfira o movimento do vídeo fonte para a personagem: mantenha coreografia, câmera e timing originais, apenas troque quem executa",
    "swap_produto": "Mantenha cena, movimento e câmera do vídeo fonte e troque apenas o objeto na mão da personagem pelo produto indicado, em destaque e nítido",
    "restyle": "Mantenha movimento e câmera do vídeo fonte e aplique novo visual/roupa/estilo, preservando o rosto da personagem",
}

_VARIACOES = {
    "motion": ["versão antes/depois: original e depois a Luna", "Luna reagindo à própria ilusão", "versão estilo anime da mesma coreografia"],
    "swap_produto": ["produto em destaque na primeira metade", "produto mostrado em close no final", "reação positiva ao produto"],
    "restyle": ["troca de roupa para outro look", "estilo anime", "cenário diferente"],
}


def gerar(persona: dict, modo: str, video_fonte: str, imagem_ancora: str, qtd: int) -> dict:
    if modo not in MODOS:
        raise ValueError(f"modo inválido: {modo} (use {', '.join(MODOS)})")
    itens = []
    var = _VARIACOES[modo]
    for i in range(qtd):
        v = var[i % len(var)] + (f" #{i // len(var) + 1}" if i >= len(var) else "")
        look = persona["looks"][i % len(persona["looks"])]["id"]
        cena = f"{_INSTR[modo]}. Fonte: {video_fonte}. Variação: {v}"
        itens.append(build_item(
            persona, tipo="genjutsu", modo=modo, look_id=look, cena=cena,
            hook=f"Genjutsu {modo}: {v}", fala="", camera="idêntica ao vídeo fonte",
            legenda=f"Minha personagem de IA refez isso ({modo.replace('_', ' ')})",
            hashtags=["#genjutsu", "#personagemIA"], imagem_ancora=imagem_ancora, video_fonte=video_fonte,
            negative_extra=NEG_EXTRA,
        ))
    return make_fila(persona, itens)
