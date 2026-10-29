import json
import re
import shutil
import subprocess
from pathlib import Path

import pytest

from veo_pipeline import qa, roteiro
from veo_pipeline.cli import main
from veo_pipeline.fila import save_fila
from veo_pipeline.schema import ValidationError, validate


def _video(path, color, seconds=2):
    subprocess.run(["ffmpeg", "-v", "error", "-f", "lavfi", "-i",
                    f"color=c={color}:s=64x64:r=4:d={seconds}", "-c:v", "libx264",
                    "-pix_fmt", "yuv420p", "-y", str(path)], check=True)


def test_prompt_quantidade_mala(persona):
    fila = roteiro.gerar_sequencia(persona, "viagem", 2)
    assert "exatamente UMA mala" in fila["itens"][2]["prompt_final"]
    assert "duplicate objects" in fila["itens"][2]["negative_prompt"]


def test_verdict_schema_rejeita_campos_extras():
    v = {"item_id": "abc", "verdict": "aprovado", "motivos": [],
         "frame_continuacao": "x.png", "corte_sugerido": None, "prompt_correcao": None}
    validate("verdict", v)
    with pytest.raises(ValidationError):
        validate("verdict", dict(v, intruso=True))


def test_fixture_de_veredito_compartilhada_com_o_plugin():
    # A mesma fixture roda no npm test do veo_flow_plugin (parseVerdict/applyVerdict): o contrato não diverge.
    root = Path(__file__).resolve().parent
    v = json.loads((root / "fixtures" / "verdict.exemplo.json").read_text(encoding="utf-8"))
    validate("verdict", v)
    fila = json.loads((root.parent / "data" / "exemplos" / "fila.maya.json").read_text(encoding="utf-8"))
    assert v["item_id"] == fila["itens"][0]["id"]
    assert v["motivos"] and all(isinstance(m, dict) for m in v["motivos"])
    assert v["corte_sugerido"] is not None and v["prompt_correcao"]


def test_api_mock_sem_rede_e_sem_vazar_chave(tmp_path, monkeypatch):
    frame = tmp_path / "frame.png"
    frame.write_bytes(b"png")
    checklist = tmp_path / "checklist.json"
    checklist.write_text(json.dumps({"item_id": "abc", "frames": [{"t": 0, "path": str(frame)}]}))
    monkeypatch.setenv("GEMINI_API_KEY", "SECRET-DO-NOT-PRINT")
    calls = []

    def fake(data, frames, provider, key):
        calls.append((data["item_id"], frames, provider, key))
        return {"item_id": "abc", "verdict": "rejeitado", "motivos": [
            {"t": 0, "tipo": "objeto_duplicado", "descricao": "duas malas"}],
            "frame_continuacao": None, "corte_sugerido": None, "prompt_correcao": "exatamente UMA mala"}

    out = qa.analyze_api(checklist, caller=fake)
    assert qa.validate_verdict(out)["verdict"] == "rejeitado"
    assert calls[0][2:] == ("gemini", "SECRET-DO-NOT-PRINT")


@pytest.mark.skipif(not shutil.which("ffmpeg"), reason="ffmpeg ausente")
def test_extrair_montar_e_bloquear_lacuna(tmp_path, persona):
    fila = roteiro.gerar_sequencia(persona, "viagem", 2)
    ids = [i["id"] for i in fila["itens"] if i["tipo"] == "veo"]
    fila["persona"] = persona
    fila_path = tmp_path / "fila.json"
    save_fila(fila_path, fila)
    clips = tmp_path / "clips"
    clips.mkdir()
    for item_id, color in zip(ids, ("red", "blue")):
        _video(clips / f"{item_id}.mp4", color)
    out_dir = tmp_path / "qa" / ids[0]
    assert main(["qa", "extrair", "--video", str(clips / f"{ids[0]}.mp4"),
                 "--item-id", ids[0], "--fila", str(fila_path), "--out-dir", str(out_dir)]) == 0
    checklist = json.loads((out_dir / "checklist.json").read_text(encoding="utf-8"))
    assert checklist["item_id"] == ids[0] and checklist["persona"]["bloco_fixo"]
    assert (out_dir / "contact_sheet.jpg").is_file()
    assert (out_dir / "first.png").is_file() and (out_dir / "last.png").is_file()
    verdict_dir = clips / "qa"
    for item_id in ids:
        d = verdict_dir / item_id
        d.mkdir(parents=True)
        v = {"item_id": item_id, "verdict": "aprovado", "motivos": [],
             "frame_continuacao": str(out_dir / "last.png"),
             "corte_sugerido": {"inicio": 0, "fim": 1} if item_id == ids[0] else None,
             "prompt_correcao": None}
        (d / f"{item_id}.verdict.json").write_text(json.dumps(v), encoding="utf-8")
    final = tmp_path / "final.mp4"
    assert main(["montar", "--fila", str(fila_path), "--dir", str(clips), "--out", str(final)]) == 0
    assert final.is_file()
    assert 2.5 < qa.video_duration(final) < 3.5
    (verdict_dir / ids[1] / f"{ids[1]}.verdict.json").unlink()
    assert main(["montar", "--fila", str(fila_path), "--dir", str(clips), "--out", str(final)]) == 2


def _video_audio(path, color, seconds=2):
    subprocess.run(["ffmpeg", "-v", "error", "-f", "lavfi", "-i", f"color=c={color}:s=64x64:r=4:d={seconds}",
                    "-f", "lavfi", "-i", f"sine=frequency=440:sample_rate=44100:duration={seconds}",
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-y", str(path)], check=True)


def _mean_volume(path, start, seconds):
    result = subprocess.run(["ffmpeg", "-ss", str(start), "-t", str(seconds), "-i", str(path),
                             "-af", "volumedetect", "-f", "null", "-"], capture_output=True, text=True)
    match = re.search(r"mean_volume: (-?[\d.]+|-inf) dB", result.stderr)
    return float(match.group(1)) if match and match.group(1) != "-inf" else float("-inf")


@pytest.mark.skipif(not shutil.which("ffmpeg"), reason="ffmpeg ausente")
def test_montar_preserva_audio_e_ordena_por_cena(tmp_path, persona):
    from PIL import Image
    fila = roteiro.gerar_sequencia(persona, "viagem", 3)
    videos = [i for i in fila["itens"] if i["tipo"] == "veo"]
    ids = [i["id"] for i in sorted(videos, key=lambda i: i["ordem"])]
    # Fila embaralhada: a montagem tem de seguir `ordem`, não a posição no array.
    fila["itens"] = [i for i in fila["itens"] if i["tipo"] == "imagem"] + list(reversed(videos))
    fila_path = tmp_path / "fila.json"
    save_fila(fila_path, fila)
    clips = tmp_path / "clips"
    clips.mkdir()
    _video_audio(clips / f"{ids[0]}.mp4", "red")
    _video(clips / f"{ids[1]}.mp4", "blue")  # sem trilha de áudio
    _video_audio(clips / f"{ids[2]}.mp4", "lime")
    for item_id in ids:
        d = clips / "qa" / item_id
        d.mkdir(parents=True)
        v = {"item_id": item_id, "verdict": "aprovado", "motivos": [], "frame_continuacao": None,
             "corte_sugerido": None, "prompt_correcao": None}
        (d / f"{item_id}.verdict.json").write_text(json.dumps(v), encoding="utf-8")
    final = tmp_path / "final.mp4"
    result = qa.assemble(fila_path, clips, final)
    assert result["ordem"] == ids
    assert qa.has_audio(final)
    assert 5.5 < qa.video_duration(final) < 6.5
    for n, channel in enumerate((0, 2, 1)):  # vermelho, azul, verde
        with Image.open(qa.extract_frame(final, 2 * n + 1, tmp_path / f"f{n}.png")) as img:
            rgb = img.convert("RGB").getpixel((32, 32))
        assert rgb[channel] == max(rgb), (n, rgb)
    assert _mean_volume(final, 0.2, 1.5) > -40  # fala da cena 1 preservada
    assert _mean_volume(final, 2.2, 1.5) < -80  # cena 2 sem áudio vira silêncio
    assert _mean_volume(final, 4.2, 1.5) > -40

    fila["itens"][-1]["ordem"] = fila["itens"][-2]["ordem"]
    save_fila(fila_path, fila)
    with pytest.raises(ValueError, match="duplicada"):
        qa.assemble(fila_path, clips, final)
    fila["itens"][-1]["ordem"] = 99
    save_fila(fila_path, fila)
    with pytest.raises(ValueError, match="buraco"):
        qa.assemble(fila_path, clips, final)


def test_extrair_usa_anterior_por_frame_inicial(tmp_path, persona):
    fila = roteiro.gerar_sequencia(persona, "viagem", 2)
    videos = [i for i in fila["itens"] if i["tipo"] == "veo"]
    fila["itens"] = [i for i in fila["itens"] if i["tipo"] == "imagem"] + list(reversed(videos))
    fila["persona"] = persona
    fila_path = tmp_path / "fila.json"
    save_fila(fila_path, fila)
    clip = tmp_path / f"{videos[1]['id']}.mp4"
    if not shutil.which("ffmpeg"):
        pytest.skip("ffmpeg ausente")
    _video(clip, "red")
    checklist = qa.extract(clip, videos[1]["id"], fila_path, tmp_path / "qa" / videos[1]["id"])
    assert checklist["continuidade"]["item_anterior_id"] == videos[0]["id"]
