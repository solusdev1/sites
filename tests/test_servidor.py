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
