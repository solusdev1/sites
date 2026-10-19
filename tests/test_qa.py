import json
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
