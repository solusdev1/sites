"""Rota API opcional: gera os itens da fila com Veo 3.1 via google-genai."""
from __future__ import annotations

import logging
import mimetypes
import time
from pathlib import Path
from typing import Any, Callable

from .config import Config
from .custo import estimar
from .schema import dump_json, load_json

log = logging.getLogger(__name__)


class VeoError(RuntimeError):
    pass


def make_client(api_key: str) -> Any:
    from google import genai  # import lazy/opcional

    return genai.Client(api_key=api_key)


def _image_arg(path: str) -> dict | None:
    if not path or not Path(path).is_file():
        return None
    mime = mimetypes.guess_type(path)[0] or "image/png"
    return {"image_bytes": Path(path).read_bytes(), "mime_type": mime}


def aguardar(client: Any, op: Any, cfg: Config, sleep: Callable[[float], None] = time.sleep,
             clock: Callable[[], float] = time.monotonic) -> Any:
    """Polling com backoff exponencial (x1.5, teto 60s) e timeout total."""
    inicio = clock()
    espera = cfg.poll_interval
    while not op.done:
        if clock() - inicio > cfg.poll_timeout:
            raise VeoError(f"timeout após {cfg.poll_timeout:.0f}s aguardando a operação")
        sleep(espera)
        espera = min(espera * 1.5, 60.0)
        op = client.operations.get(op)
    return op


def gerar_item(client: Any, item: dict, destino: Path, cfg: Config, sleep=time.sleep, clock=time.monotonic) -> Path:
    config: dict[str, Any] = {
        "aspect_ratio": "9:16",
        "resolution": cfg.veo_resolution,
        "number_of_videos": 1,
        "duration_seconds": int(item["duracao_s"]),
        "negative_prompt": item["negative_prompt"],
    }
    kwargs: dict[str, Any] = {"model": cfg.veo_model, "prompt": item["prompt_final"], "config": config}
    img = _image_arg(item["anexos"].get("imagem_ancora", ""))
    if img:
        kwargs["image"] = img
    op = client.models.generate_videos(**kwargs)
    op = aguardar(client, op, cfg, sleep, clock)
    if getattr(op, "error", None):
        raise VeoError(f"operação falhou: {op.error}")
    videos = getattr(op.response, "generated_videos", None) or []
    if not videos:
        raise VeoError("resposta sem vídeos (possível bloqueio de conteúdo)")
    video = videos[0]
    client.files.download(file=video.video)
    destino.parent.mkdir(parents=True, exist_ok=True)
    video.video.save(str(destino))
    return destino


def executar(fila: dict, out_dir: str | Path, cfg: Config, *, dry_run: bool = False,
             client_factory: Callable[[str], Any] = make_client, sleep=time.sleep, clock=time.monotonic) -> dict:
    """Gera os pendentes. Retomável: pula itens cujo <id>.mp4 já existe (e registra em estado.json)."""
    out = Path(out_dir)
    estado_path = out / "estado.json"
    estado = load_json(estado_path) if estado_path.is_file() else {}
    resumo = {"gerados": [], "pulados": [], "falhas": [], "ignorados": []}
    alvo = []
    for it in fila["itens"]:
        mp4 = out / f"{it['id']}.mp4"
        if it["tipo"] != "veo":
            log.warning("item %s (%s) ignorado: vídeo→vídeo não é suportado pela rota API", it["id"], it["tipo"])
            resumo["ignorados"].append(it["id"])
        elif mp4.is_file():
            log.info("item %s já gerado, pulando", it["id"])
            resumo["pulados"].append(it["id"])
        else:
            alvo.append(it)
    resumo["custo"] = estimar(fila, cfg.price_per_second, {i["id"] for i in alvo})
    log.info("a gerar: %d itens, %.0fs, custo estimado US$ %.2f", len(alvo), resumo["custo"]["segundos"],
             resumo["custo"]["custo_usd"])
    if dry_run:
        resumo["dry_run"] = True
        resumo["pendentes"] = [i["id"] for i in alvo]
        return resumo
    if not cfg.gemini_api_key:
        raise VeoError("GEMINI_API_KEY ausente (defina no ambiente ou no .env)")
    client = client_factory(cfg.gemini_api_key)
    for it in alvo:
        destino = out / f"{it['id']}.mp4"
        try:
            gerar_item(client, it, destino, cfg, sleep, clock)
            estado[it["id"]] = {"status": "gerado", "arquivo": destino.name}
            resumo["gerados"].append(it["id"])
            log.info("item %s gerado", it["id"])
        except Exception as exc:
            estado[it["id"]] = {"status": "falha", "erro": str(exc)[:200]}
            resumo["falhas"].append(it["id"])
            log.error("item %s falhou: %s", it["id"], type(exc).__name__)
        dump_json(estado_path, estado)  # persiste a cada item => retomada segura
    return resumo
