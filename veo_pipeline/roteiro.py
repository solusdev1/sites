"""Gerador de roteiros: templates offline por arquétipo + Gemini opcional."""
from __future__ import annotations

import json
import logging
from typing import Callable

from .fila import build_item, dedup, make_fila
from .persona import normalizar_arquetipo

log = logging.getLogger(__name__)

FORMATOS = ("serie_cliffhanger", "pov_serializado", "memorias", "resposta_comentario")

# (hook, cena, camera) por formato; {n}=episódio/volume, {gancho}/{acao}/{nicho} vêm do conteúdo
_BASE = {
    "serie_cliffhanger": (
        "Ep. {n}: {gancho}",
        "Episódio {n} da série sobre {nicho}: {acao}. Termina com um gancho que deixa a pergunta no ar",
        "plano médio de celular na mão, leve movimento, termina em close no rosto",
    ),
    "pov_serializado": (
        "POV: {gancho}",
        "POV serializado em {nicho} (parte {n}), mesmo cenário recorrente: {acao}",
        "câmera subjetiva no estilo POV, plano fechado e depois abre",
    ),
    "memorias": (
        "Olhando fotos antigas: {gancho}",
        "A personagem olha fotos antigas no celular e reage sobre {nicho} (memória {n}): {acao}",
        "close no rosto com insert do celular, luz quente",
    ),
    "resposta_comentario": (
        "Respondendo @seguidor: {gancho}",
        "A personagem responde um comentário de seguidor sobre {nicho} (resposta {n}): {acao}",
        "selfie vertical olhando para a câmera, enquadramento de busto",
    ),
}

# (gancho, ação visual, fala)
_CONTEUDO = {
    "relatable_cidade_grande": [
        ("mudei pra cidade grande com R$500", "chega na kitnet com uma mala e abre a porta pela primeira vez", "Gente, eu mudei com quinhentos reais e olha o que eu achei aqui dentro"),
        ("o vizinho de cima não para", "ouve barulho no teto e reage com bom humor enquanto prepara o café", "Eu juro que ia reclamar, mas aí ele fez isso e eu perdi a raiva"),
        ("achadinho que mudou minha rotina", "mostra um achadinho barato da casa e testa na hora", "Vou te mostrar o achadinho de dez reais que salvou minha manhã"),
    ],
    "fit": [
        ("treino de 20 minutos sem equipamento", "faz uma sequência de treino na sala", "Vinte minutos, zero equipamento, e eu garanto que você vai sentir"),
        ("o erro que todo mundo comete na academia", "aponta o erro numa máquina e corrige a postura", "Para de fazer isso agora, olha como é o certo"),
        ("meu café da manhã pós-treino", "prepara um café da manhã proteico na cozinha", "Esse é o meu pós-treino de cinco minutos, anota aí"),
    ],
    "luxo_viagem": [
        ("o hotel que valeu cada centavo", "entra no quarto de hotel com vista e abre a cortina", "Eu não esperava essa vista quando abri a porta do quarto"),
        ("meu look de aeroporto", "caminha pelo saguão do aeroporto mostrando o look", "Look de aeroporto confortável e chique, olha os detalhes"),
        ("viajando sozinha pela primeira vez", "pega a mala e olha o mapa na cidade nova", "Primeira viagem sozinha, e já aconteceu uma coisa inesperada"),
    ],
    "foodie": [
        ("o melhor pastel de feira", "prova um pastel na barraca da feira e reage", "Gente, a massa estalou desse jeito, eu preciso contar o segredo"),
        ("restaurante escondido que ninguém conhece", "descobre um restaurante simples e prova o prato do dia", "Entrei por acaso e saí com o prato que vou lembrar do ano"),
        ("receita de 3 ingredientes", "cozinha uma receita rápida em plano fechado", "Três ingredientes, dez minutos, e fica melhor que delivery"),
    ],
    "review_tech": [
        ("gadget de 50 reais que surpreendeu", "abre a caixa do gadget e testa na mesa", "Comprei por impulso e preciso admitir que me surpreendeu"),
        ("fone barato contra fone caro", "compara dois fones lado a lado", "Fiz o teste cego e o resultado me pegou de surpresa"),
        ("setup de mesa gastando pouco", "monta o setup de mesa em time-lapse", "Setup inteiro por menos de duzentos reais, vou mostrar tudo"),
    ],
    "serial_lore": [
        ("a carta que apareceu na minha porta", "encontra uma carta misteriosa e lê em voz baixa", "Alguém deixou isso na minha porta e o remetente é impossível"),
        ("a foto que não devia existir", "olha uma foto antiga e percebe um detalhe estranho", "Olha o fundo dessa foto, eu nunca estive nesse lugar"),
        ("o segredo do prédio", "caminha pelo corredor do prédio à noite com a lanterna", "Eu descobri o que tem no último andar e ninguém acredita"),
    ],
}

_TAGS = {
    "relatable_cidade_grande": ["#vidaemSP", "#rotina", "#achadinhos"],
    "fit": ["#fitness", "#treino"],
    "luxo_viagem": ["#viagem", "#luxo"],
    "foodie": ["#comidaderua", "#foodie"],
    "review_tech": ["#tech", "#review"],
    "serial_lore": ["#serie", "#misterio"],
}


def gerar_offline(persona: dict, nicho: str, qtd: int) -> list[dict]:
    arq = normalizar_arquetipo(persona["arquetipo"])
    conteudo = _CONTEUDO[arq]
    itens: list[dict] = []
    ciclo = len(FORMATOS) * len(conteudo)
    for i in range(qtd):
        formato = FORMATOS[i % len(FORMATOS)]
        gancho, acao, fala = conteudo[(i // len(FORMATOS)) % len(conteudo)]
        n = i // ciclo + 1  # nova "rodada" => episódio/volume seguinte (ids continuam únicos)
        hook_t, cena_t, camera = _BASE[formato]
        look = persona["looks"][i % len(persona["looks"])]["id"]
        hook = hook_t.format(n=n, gancho=gancho)
        itens.append(build_item(
            persona, tipo="veo", modo=None, look_id=look,
            cena=cena_t.format(nicho=nicho, n=n, acao=acao), hook=hook, fala=fala, camera=camera,
            legenda=hook, hashtags=_TAGS.get(arq, []) + [f"#{formato}"],
        ))
    return dedup(itens)


def _prompt_llm(persona: dict, nicho: str, qtd: int) -> str:
    return (
        f"Gere {qtd} roteiros curtos (8s) em português do Brasil para a persona {persona['nome']} "
        f"(arquétipo {persona['arquetipo']}) sobre o nicho '{nicho}'. Use formatos variados: "
        f"{', '.join(FORMATOS)}. Hook nos 2 primeiros segundos e ação visual concreta. "
        "Responda APENAS um JSON: lista de objetos com chaves hook, cena, fala, camera, legenda, hashtags (lista)."
    )


def itens_de_llm(persona: dict, dados: list[dict]) -> list[dict]:
    itens = []
    for k, d in enumerate(dados):
        look = persona["looks"][k % len(persona["looks"])]["id"]
        itens.append(build_item(
            persona, tipo="veo", modo=None, look_id=look, cena=d["cena"], hook=d["hook"], fala=d["fala"],
            camera=d.get("camera") or "plano médio de celular", legenda=d.get("legenda", ""),
            hashtags=[h if h.startswith("#") else f"#{h}" for h in d.get("hashtags", [])],
        ))
    return itens


def gerar_gemini(persona: dict, nicho: str, qtd: int, api_key: str, model: str) -> list[dict]:
    from google import genai  # import lazy/opcional

    client = genai.Client(api_key=api_key)
    resp = client.models.generate_content(
        model=model, contents=_prompt_llm(persona, nicho, qtd),
        config={"response_mime_type": "application/json"},
    )
    return itens_de_llm(persona, json.loads(resp.text))


def gerar(persona: dict, nicho: str, qtd: int, api_key: str = "", model: str = "gemini-2.5-flash",
          llm: Callable[..., list[dict]] | None = None) -> dict:
    """Usa Gemini se houver chave; qualquer erro cai para os templates offline."""
    itens: list[dict] = []
    if api_key:
        try:
            itens = (llm or gerar_gemini)(persona, nicho, qtd, api_key, model)
        except Exception as exc:  # nunca logar a key
            log.warning("Gemini falhou (%s); usando templates offline", type(exc).__name__)
            itens = []
    if not itens:
        itens = gerar_offline(persona, nicho, qtd)
    return make_fila(persona, dedup(itens)[:qtd])
