"""Extração de evidências visuais, veredito e montagem em ordem da fila."""
from __future__ import annotations

import base64
import json
import os
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

from .fila import load_fila
from .schema import dump_json, load_json, validate


def ffmpeg_path() -> str:
    found = shutil.which("ffmpeg")
    if found:
        return found
    try:
        import imageio_ffmpeg  # import lazy, somente fallback
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError as exc:
        raise FileNotFoundError("ffmpeg não encontrado; instale ffmpeg ou imageio-ffmpeg") from exc


def _run(args: list[str]) -> None:
    result = subprocess.run(args, capture_output=True, text=True)
    if result.returncode:
        raise ValueError(f"ffmpeg falhou: {result.stderr[-1200:]}")


def video_duration(path: str | Path) -> float:
    probe = shutil.which("ffprobe")
    if probe:
        result = subprocess.run([probe, "-v", "error", "-show_entries", "format=duration",
                                 "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
                                capture_output=True, text=True)
        if result.returncode == 0:
            return float(result.stdout.strip())
    result = subprocess.run([ffmpeg_path(), "-i", str(path)], capture_output=True, text=True)
    match = re.search(r"Duration: (\d+):(\d+):(\d+(?:\.\d+)?)", result.stderr)
    if not match:
        raise ValueError(f"não foi possível ler duração de {path}")
    h, m, s = match.groups()
    return int(h) * 3600 + int(m) * 60 + float(s)


def extract_frame(video: str | Path, t: float, out: str | Path) -> Path:
    target = Path(out)
    target.parent.mkdir(parents=True, exist_ok=True)
    _run([ffmpeg_path(), "-v", "error", "-ss", f"{t:.3f}", "-i", str(video),
          "-frames:v", "1", "-y", str(target)])
    if not target.is_file():
        raise ValueError(f"frame ausente em {t:.3f}s")
    return target


def extract_last_frame(video: str | Path, out: str | Path) -> Path:
    target = Path(out)
    # -sseof -0.1 pode cair depois do último PTS em clipes de fps baixo.
    _run([ffmpeg_path(), "-v", "error", "-sseof", "-1", "-i", str(video),
          "-update", "1", "-y", str(target)])
    if not target.is_file():
        raise ValueError("último frame ausente")
    return target


# Frame "preto": luminância média e desvio baixos (no Flow real saiu um _last.png 1080x1920 todo preto quando o
# player ainda não tinha pintado o vídeo). Um frame assim nunca é entregue como continuação.
BLACK_MEAN, BLACK_STD = 8.0, 4.0


def frame_stats(path: str | Path) -> tuple[float, float]:
    from PIL import Image, ImageStat  # import lazy
    with Image.open(path) as image:
        if image.mode in ("RGBA", "LA", "P"):
            rgba = image.convert("RGBA")
            background = Image.new("RGBA", rgba.size, (0, 0, 0, 255))
            image = Image.alpha_composite(background, rgba)
        stat = ImageStat.Stat(image.convert("L"))
        return float(stat.mean[0]), float(stat.stddev[0])


def frame_is_black(path: str | Path) -> bool:
    mean, std = frame_stats(path)
    return mean < BLACK_MEAN and std < BLACK_STD


_OBJECTS = ("mala", "celular", "carta", "foto", "fone", "caixa", "copo", "bolsa", "chave", "garrafa")
_COUNTS = {"um": 1, "uma": 1, "dois": 2, "duas": 2, "três": 3, "quatro": 4}


def expected_objects(scene: str) -> list[dict]:
    found = []
    for noun in _OBJECTS:
        match = re.search(rf"\b(um|uma|dois|duas|três|quatro|\d+)\s+{noun}s?\b", scene, re.I)
        if match:
            word = match.group(1).lower()
            found.append({"objeto": noun, "quantidade": _COUNTS.get(word, int(word) if word.isdigit() else None)})
        elif re.search(rf"\b{noun}s?\b", scene, re.I):
            found.append({"objeto": noun, "quantidade": None})
    return found


def _persona(fila: dict, fila_path: Path) -> dict:
    if isinstance(fila.get("persona"), dict):
        return fila["persona"]
    pid = fila.get("persona_id", "")
    candidates = [fila_path.parent / "personas" / f"{pid}.json",
                  Path(__file__).resolve().parent.parent / "data" / "personas" / f"{pid}.json"]
    for candidate in candidates:
        if candidate.is_file():
            return load_json(candidate)
    return {"id": pid, "bloco_fixo": "", "looks": []}


def extract(video: str | Path, item_id: str, fila_path: str | Path, out_dir: str | Path,
            fps: float = 2.0) -> dict:
    video, fila_path, out_dir = Path(video), Path(fila_path), Path(out_dir)
    if not video.is_file():
        raise FileNotFoundError(video)
    if fps <= 0 or fps > 4:
        raise ValueError("fps deve estar entre 0 e 4")
    fila = load_fila(fila_path)
    index = next((i for i, it in enumerate(fila["itens"]) if it["id"] == item_id), None)
    if index is None:
        raise ValueError(f"item {item_id} não existe na fila")
    item = fila["itens"][index]
    if item["tipo"] == "imagem":
        raise ValueError("QA de vídeo exige item veo/genjutsu")
    duration = video_duration(video)
    if duration <= 0:
        raise ValueError("vídeo sem duração")
    out_dir.mkdir(parents=True, exist_ok=True)
    end = max(0, duration - min(0.1, duration / 2))
    times = sorted({round(n / fps, 3) for n in range(int(end * fps) + 1)} | {0.0, round(end, 3)})
    frames = []
    for n, t in enumerate(times):
        path = (extract_last_frame(video, out_dir / f"frame_{n:04d}.png")
                if n == len(times) - 1 else extract_frame(video, t, out_dir / f"frame_{n:04d}.png"))
        frames.append({"t": t, "path": str(path.resolve())})
    shutil.copyfile(frames[0]["path"], out_dir / "first.png")
    shutil.copyfile(frames[-1]["path"], out_dir / "last.png")
    from PIL import Image, ImageDraw  # import lazy: requerido apenas para a grade
    width, height, cols = 240, 170, 4
    rows = (len(frames) + cols - 1) // cols
    sheet = Image.new("RGB", (width * cols, height * rows), "#111111")
    draw = ImageDraw.Draw(sheet)
    for n, frame in enumerate(frames):
        with Image.open(frame["path"]) as source:
            thumb = source.convert("RGB")
            thumb.thumbnail((width - 8, height - 28))
            x, y = (n % cols) * width, (n // cols) * height
            sheet.paste(thumb, (x + (width - thumb.width) // 2, y))
            draw.text((x + 8, y + height - 24), f"{frame['t']:.2f}s", fill="white")
    sheet.save(out_dir / "contact_sheet.jpg", quality=90)
    persona = _persona(fila, fila_path)
    look = next((lk.get("descricao", "") for lk in persona.get("looks", [])
                 if lk.get("id") == item.get("look_id")), "")
    previous = next((it for it in reversed(fila["itens"][:index]) if it["tipo"] != "imagem"), None)
    previous_frame = None
    if previous:
        for candidate in (out_dir.parent / previous["id"] / f"{previous['id']}.verdict.json",
                          fila_path.parent / "qa" / previous["id"] / f"{previous['id']}.verdict.json"):
            if candidate.is_file():
                prior_verdict = validate_verdict(candidate)
                previous_frame = prior_verdict.get("frame_continuacao")
                break
    avisos = []
    last_black = frame_is_black(out_dir / "last.png")
    if last_black:
        avisos.append("último frame quase todo preto: não use last.png como frame_continuacao; "
                      "escolha o último quadro bom e extraia com ffmpeg")
    checklist = {
        "item_id": item_id, "video": str(video.resolve()), "duracao_s": duration,
        "cena": item["cena"], "prompt_final": item["prompt_final"],
        "objetos_esperados": expected_objects(item["cena"]),
        "persona": {"id": persona.get("id", fila.get("persona_id")),
                    "bloco_fixo": persona.get("bloco_fixo", ""), "look_id": item["look_id"],
                    "look": look},
        "continuidade": {"frame_inicial_esperado": item.get("frame_inicial", ""),
                         "item_anterior_id": previous["id"] if previous else None,
                         "frame_continuacao_anterior": previous_frame},
        "frames": frames, "primeiro_frame": str((out_dir / "first.png").resolve()),
        "ultimo_frame": None if last_black else str((out_dir / "last.png").resolve()),
        "ultimo_frame_preto": last_black, "avisos": avisos,
    }
    dump_json(out_dir / "checklist.json", checklist)
    return checklist


def validate_verdict(path: str | Path) -> dict:
    verdict = load_json(path)
    validate("verdict", verdict)
    frame = verdict.get("frame_continuacao")
    if frame and Path(frame).is_file() and frame_is_black(frame):
        raise ValueError(f"frame_continuacao quase todo preto: {frame}; escolha outro quadro")
    return verdict


def _api_call(checklist: dict, frame_paths: list[Path], provider: str, api_key: str) -> dict:
    instruction = ("Analise TODOS os frames e o checklist de vídeo. Responda somente JSON no formato "
                   "do schema verdict.schema.json: item_id, verdict, motivos, frame_continuacao, "
                   "corte_sugerido, prompt_correcao. Procure objetos duplicados, rosto, mãos, cenário, "
                   "continuidade, física e texto. Erro somente no fim: aprove com corte até antes do erro. "
                   "Erro no meio: rejeite com prompt de correção. Checklist: "
                   + json.dumps(checklist, ensure_ascii=False))
    if provider == "gemini":
        from google import genai  # import lazy
        from google.genai import types
        parts = [instruction] + [types.Part.from_bytes(data=p.read_bytes(), mime_type="image/png") for p in frame_paths]
        response = genai.Client(api_key=api_key).models.generate_content(
            model="gemini-2.5-flash", contents=parts,
            config={"response_mime_type": "application/json"})
        return json.loads(response.text)
    import anthropic  # import lazy
    blocks = [{"type": "text", "text": instruction}] + [
        {"type": "image", "source": {"type": "base64", "media_type": "image/png",
                                      "data": base64.b64encode(p.read_bytes()).decode("ascii")}} for p in frame_paths]
    response = anthropic.Anthropic(api_key=api_key).messages.create(
        model="claude-sonnet-4-5", max_tokens=1500, messages=[{"role": "user", "content": blocks}])
    return json.loads("".join(block.text for block in response.content if block.type == "text"))


def analyze_api(checklist_path: str | Path, caller=None) -> Path:
    checklist_path = Path(checklist_path)
    checklist = load_json(checklist_path)
    provider, key = (("gemini", os.getenv("GEMINI_API_KEY")) if os.getenv("GEMINI_API_KEY") else
                     ("anthropic", os.getenv("ANTHROPIC_API_KEY")))
    if not key:
        raise ValueError("modo --api exige GEMINI_API_KEY ou ANTHROPIC_API_KEY")
    frames = [Path(f["path"]) for f in checklist["frames"]]
    try:
        result = (caller or _api_call)(checklist, frames, provider, key)
    except Exception as exc:
        raise ValueError(f"API de visão falhou ({type(exc).__name__})") from None
    validate("verdict", result)
    if result["item_id"] != checklist["item_id"]:
        raise ValueError("API devolveu item_id diferente")
    out = checklist_path.parent / f"{result['item_id']}.verdict.json"
    dump_json(out, result)
    return out


def _find_clip(directory: Path, item_id: str) -> Path:
    exact = directory / f"{item_id}.mp4"
    matches = [exact] if exact.is_file() else list(directory.glob(f"*{item_id}*.mp4"))
    if len(matches) != 1:
        raise ValueError(f"item {item_id}: esperado exatamente um MP4 em {directory}; encontrados {len(matches)}")
    return matches[0]


def assemble(fila_path: str | Path, directory: str | Path, out: str | Path) -> dict:
    fila_path, directory, out = Path(fila_path), Path(directory), Path(out)
    fila = load_fila(fila_path)
    items = [it for it in fila["itens"] if it["tipo"] != "imagem"]
    if not items:
        raise ValueError("fila sem itens de vídeo")
    entries = []
    expected_duration = 0.0
    for item in items:
        item_id = item["id"]
        candidates = [directory / "qa" / item_id / f"{item_id}.verdict.json",
                      fila_path.parent / "qa" / item_id / f"{item_id}.verdict.json"]
        verdict_path = next((p for p in candidates if p.is_file()), None)
        if verdict_path is None:
            raise ValueError(f"item {item_id}: falta veredito aprovado no meio da sequência")
        verdict = validate_verdict(verdict_path)
        if verdict["item_id"] != item_id or verdict["verdict"] != "aprovado":
            raise ValueError(f"item {item_id}: falta veredito aprovado no meio da sequência")
        clip = _find_clip(directory, item_id)
        duration = video_duration(clip)
        cut = verdict["corte_sugerido"]
        start, end = (cut["inicio"], cut["fim"]) if cut else (0.0, duration)
        if not 0 <= start < end <= duration + 0.05:
            raise ValueError(f"item {item_id}: corte fora da duração do clipe")
        entries.append((clip, start, min(end, duration)))
        expected_duration += min(end, duration) - start
    out.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="veo-montar-") as tmp:
        normalized = []
        for n, (clip, start, end) in enumerate(entries):
            target = Path(tmp) / f"{n:04d}.mp4"
            _run([ffmpeg_path(), "-v", "error", "-ss", str(start), "-i", str(clip),
                  "-t", str(end - start), "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p",
                  "-y", str(target)])
            normalized.append(target)
        concat = Path(tmp) / "concat.txt"
        concat.write_text("".join(f"file '{str(p).replace(chr(92), '/')}'\n" for p in normalized), encoding="utf-8")
        _run([ffmpeg_path(), "-v", "error", "-f", "concat", "-safe", "0", "-i", str(concat),
              "-c", "copy", "-y", str(out)])
    actual = video_duration(out)
    if abs(actual - expected_duration) > 0.5:
        out.unlink(missing_ok=True)
        raise ValueError(f"montagem com duração divergente: {actual:.2f}s vs {expected_duration:.2f}s")
    return {"arquivo": str(out), "itens": len(entries), "duracao_s": actual}
