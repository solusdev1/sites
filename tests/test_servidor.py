import json
import threading
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from veo_pipeline import servidor


def request(base, path, data=None, origin=None):
    headers = {}
    if origin:
        headers["Origin"] = origin
    if data is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(data).encode()
    with urlopen(Request(base + path, data=data, headers=headers), timeout=3) as response:
        return response, json.load(response)


def test_endpoints_e_cors(tmp_path, monkeypatch):
    persona = tmp_path / "maya"
    persona.mkdir()
    item = "abc123"
    video = persona / f"{item}.mp4"
    video.write_bytes(b"mp4")
    verdict = {"item_id": item, "verdict": "aprovado", "motivos": [],
               "frame_continuacao": None, "corte_sugerido": None, "prompt_correcao": None}
    (persona / f"{item}.verdict.json").write_text(json.dumps(verdict), encoding="utf-8")
    fila = tmp_path / "fila.json"
    fila.write_text(json.dumps({"persona_id": "maya", "itens": [{"id": item}]}), encoding="utf-8")
    monkeypatch.setattr(servidor, "load_fila", lambda _: {"persona_id": "maya", "itens": [{"id": item}]})
    calls = []

    def fake_extract(source, item_id, queue, out):
        calls.append((source, item_id, queue, out))
        out.mkdir(parents=True, exist_ok=True)
        (out / "checklist.json").write_text("{}")
        return {"frames": [1, 2]}

    monkeypatch.setattr(servidor.qa, "extract", fake_extract)
    server = servidor.make_server(tmp_path, 0, fila)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base = f"http://127.0.0.1:{server.server_port}"
    try:
        assert server.server_address[0] == "127.0.0.1"
        response, health = request(base, "/saude", origin="https://evil.example")
        assert health == {"ok": True}
        assert response.headers.get("Access-Control-Allow-Origin") is None
        extension = "chrome-extension://" + "a" * 32
        response, _ = request(base, "/saude", origin=extension)
        assert response.headers["Access-Control-Allow-Origin"] == extension
        _, entries = request(base, "/vereditos?persona=maya")
        assert entries == [{"item_id": item, "mtime": str((persona / f"{item}.verdict.json").stat().st_mtime_ns)}]
        assert request(base, f"/veredito/maya/{item}")[1] == verdict
        assert request(base, "/extrair", {"persona": "maya", "item_id": item})[1]["frames"] == 2
        assert calls[-1][3] == persona / "qa" / item
        try:
            request(base, "/extrair", {"persona": "maya", "item_id": item}, origin="https://evil.example")
            assert False, "origem externa aceita no POST"
        except HTTPError as error:
            assert error.code == 403
        try:
            request(base, "/veredito/maya/..%2Fsecret")
            assert False, "path traversal aceito"
        except HTTPError as error:
            assert error.code == 400
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=3)


def test_watcher_extrai_apos_mp4_estabilizar(tmp_path, monkeypatch):
    persona = tmp_path / "maya"
    persona.mkdir()
    video = persona / "abc.mp4"
    video.write_bytes(b"primeira parte")
    service = servidor.QAService(tmp_path)
    calls = []
    monkeypatch.setattr(service, "extract", lambda *args: calls.append(args))
    service.scan_once()
    assert calls == []
    video.write_bytes(b"arquivo completo")
    service.scan_once()
    assert calls == []
    service.scan_once()
    service.scan_once()
    assert calls == [("maya", "abc")]


def _color_video(path, color, seconds=1):
    import shutil
    import subprocess
    import pytest
    if not shutil.which("ffmpeg"):
        pytest.skip("ffmpeg ausente")
    subprocess.run(["ffmpeg", "-v", "error", "-f", "lavfi", "-i", f"color=c={color}:s=64x64:r=4:d={seconds}",
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-y", str(path)], check=True)


def _serve(tmp_path):
    server = servidor.make_server(tmp_path, 0)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server, thread, f"http://127.0.0.1:{server.server_port}"


def test_ultimo_frame_do_servidor_com_ffmpeg_e_frame_preto(tmp_path):
    persona = tmp_path / "maya"
    persona.mkdir()
    video = persona / "58155a350544.mp4"
    _color_video(video, "red")
    # Bug real: um _last.png todo preto, mais novo que o MP4, ficou na pasta; o servidor refaz a partir do MP4.
    from PIL import Image
    Image.new("RGBA", (1080, 1920), (0, 0, 0, 255)).save(persona / "58155a350544_last.png")
    server, thread, base = _serve(tmp_path)
    try:
        _, body = request(base, "/ultimo-frame/maya/58155a350544")
        assert body["path"] == str(persona / "58155a350544_last.png")
        assert body["data"].startswith("data:image/png;base64,")
        assert not servidor.qa.frame_is_black(persona / "58155a350544_last.png")
        mtime_ms = video.stat().st_mtime_ns // 1_000_000
        try:
            request(base, f"/ultimo-frame/maya/58155a350544?depois={mtime_ms + 60000}")
            assert False, "devolveu o frame do MP4 antigo"
        except HTTPError as error:
            assert error.code == 404
        _color_video(video, "black")
        try:
            request(base, "/ultimo-frame/maya/58155a350544")
            assert False, "frame preto entregue"
        except HTTPError as error:
            assert error.code == 422
            assert json.load(error)["preto"] is True
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=3)


def test_versionar_guarda_mp4_veredito_e_frame_anteriores(tmp_path):
    persona = tmp_path / "maya"
    persona.mkdir()
    for name in ("a.mp4", "a.verdict.json", "a_last.png"):
        (persona / name).write_bytes(b"velho")
    (persona / "a.v1.mp4").write_bytes(b"mais velho")
    server, thread, base = _serve(tmp_path)
    try:
        _, body = request(base, "/versionar", {"persona": "maya", "item_id": "a"}, origin="chrome-extension://" + "a" * 32)
        assert body == {"anterior": str(persona / "a.v2.mp4")}
        assert not (persona / "a.mp4").exists()
        assert (persona / "a.v2.verdict.json").read_bytes() == b"velho"
        assert (persona / "a.v2_last.png").read_bytes() == b"velho"
        assert request(base, "/versionar", {"persona": "maya", "item_id": "a"})[1] == {"anterior": None}
        # Versões guardadas não entram no watcher (nem viram aviso de nome inválido).
        server.qa_service.scan_once()
        assert all(not path.name.startswith("a.v") for path in server.qa_service._seen)
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=3)


def test_qa_extrair_marca_ultimo_frame_preto_e_veredito_recusa(tmp_path):
    from veo_pipeline import roteiro
    from veo_pipeline.fila import save_fila
    from veo_pipeline.persona import load_persona
    from pathlib import Path
    persona = load_persona(Path(__file__).resolve().parent.parent / "data" / "personas" / "maya.json")
    fila = roteiro.gerar_sequencia(persona, "viagem", 1)
    item_id = next(i["id"] for i in fila["itens"] if i["tipo"] == "veo")
    fila["persona"] = persona
    save_fila(tmp_path / "fila.json", fila)
    _color_video(tmp_path / "v.mp4", "black")
    checklist = servidor.qa.extract(tmp_path / "v.mp4", item_id, tmp_path / "fila.json", tmp_path / "qa")
    assert checklist["ultimo_frame_preto"] is True
    assert checklist["ultimo_frame"] is None
    assert "preto" in checklist["avisos"][0]
    verdict = {"item_id": item_id, "verdict": "aprovado", "motivos": [], "frame_continuacao": str(tmp_path / "qa" / "last.png"),
               "corte_sugerido": None, "prompt_correcao": None}
    (tmp_path / "v.verdict.json").write_text(json.dumps(verdict), encoding="utf-8")
    import pytest
    with pytest.raises(ValueError, match="preto"):
        servidor.qa.validate_verdict(tmp_path / "v.verdict.json")


def test_segunda_instancia_na_mesma_porta_falha(tmp_path, capsys):
    import pytest
    from veo_pipeline.cli import main
    first = servidor.make_server(tmp_path, 0)
    port = first.server_port
    try:
        with pytest.raises(servidor.PortaOcupada, match=str(port)):
            servidor.make_server(tmp_path, port)
        assert main(["servir", "--pasta", str(tmp_path), "--porta", str(port)]) != 0
        assert "já está em uso" in capsys.readouterr().err
    finally:
        first.server_close()
