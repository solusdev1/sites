"""Servidor de QA local, acessível somente pelo loopback."""
from __future__ import annotations

import base64
import json
import logging
import os
import re
import socket
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlsplit

from . import qa
from .fila import load_fila

log = logging.getLogger(__name__)
_ID = re.compile(r"[A-Za-z0-9_-]+\Z")
_VERSIONED = re.compile(r".+\.v\d+\Z")  # <item>.vN.mp4: versões anteriores guardadas por /versionar


class PortaOcupada(RuntimeError):
    """Outra instância (ou outro programa) já escuta na porta."""


class Pendente(Exception):
    """O MP4 novo ainda não chegou (mais antigo que `depois`)."""


class FramePreto(ValueError):
    def __init__(self, path: Path, mean: float):
        super().__init__(f"último frame quase todo preto (luminância média {mean:.1f}): {path}")
        self.path = path


def safe_id(value: str) -> str:
    if not isinstance(value, str) or not _ID.fullmatch(value):
        raise ValueError("persona ou item_id inválido")
    return value


class QAService:
    def __init__(self, folder: str | Path, fila: str | Path | None = None):
        self.folder = Path(folder).expanduser().resolve()
        self.fila = Path(fila).expanduser().resolve() if fila else None
        self._seen: dict[Path, tuple[int, int, bool]] = {}
        self._frames: dict[Path, tuple[int, int]] = {}
        self._lock = threading.RLock()

    def find_fila(self, persona: str, item_id: str, explicit: str | Path | None = None) -> Path:
        candidates = ([Path(explicit).expanduser().resolve()] if explicit else
                      [self.fila] if self.fila else
                      [*self.folder.glob("*.json"), *self.folder.glob(persona + "/*.json"),
                       *Path.cwd().glob("fila*.json")])
        for path in candidates:
            try:
                fila = load_fila(path)
                if fila.get("persona_id") == persona and any(i["id"] == item_id for i in fila["itens"]):
                    return path
            except (OSError, ValueError, KeyError, TypeError):
                continue
        raise FileNotFoundError(f"fila da persona {persona} com item {item_id} não encontrada; use --fila")

    def extract(self, persona: str, item_id: str, fila: str | Path | None = None) -> dict:
        persona, item_id = safe_id(persona), safe_id(item_id)
        video = self.folder / persona / f"{item_id}.mp4"
        if not video.is_file():
            raise FileNotFoundError(video)
        queue = self.find_fila(persona, item_id, fila)
        out = video.parent / "qa" / item_id
        result = qa.extract(video, item_id, queue, out)
        log.info("pronto para análise: %s", out)
        return {"item_id": item_id, "checklist": str(out / "checklist.json"), "frames": len(result["frames"])}

    def last_frame(self, persona: str, item_id: str, depois_ms: float = 0) -> dict:
        """Último frame do MP4 baixado, extraído com ffmpeg para <item>_last.png (refeito a cada MP4 novo)."""
        persona, item_id = safe_id(persona), safe_id(item_id)
        video = self.folder / persona / f"{item_id}.mp4"
        if not video.is_file():
            raise Pendente(f"{video.name} ainda não existe")
        stat = video.stat()
        if stat.st_mtime_ns / 1e6 < depois_ms:
            raise Pendente(f"{video.name} ainda é o vídeo antigo")
        target = video.parent / f"{item_id}_last.png"
        signature = (stat.st_size, stat.st_mtime_ns)
        with self._lock:
            if self._frames.get(video) != signature or not target.is_file():
                tmp = video.parent / f"{item_id}_last.tmp.png"
                qa.extract_last_frame(video, tmp)
                os.replace(tmp, target)
                self._frames[video] = signature
        mean, std = qa.frame_stats(target)
        if mean < qa.BLACK_MEAN and std < qa.BLACK_STD:
            raise FramePreto(target, mean)
        data = base64.b64encode(target.read_bytes()).decode("ascii")
        return {"item_id": item_id, "path": str(target), "preto": False,
                "mp4_mtime_ms": stat.st_mtime_ns // 1_000_000, "data": "data:image/png;base64," + data}

    def versionar(self, persona: str, item_id: str) -> dict:
        """Guarda o MP4 atual (e veredito/último frame dele) como <item>.vN.* antes do download do novo."""
        persona, item_id = safe_id(persona), safe_id(item_id)
        folder = self.folder / persona
        video = folder / f"{item_id}.mp4"
        if not video.is_file():
            return {"anterior": None}
        n = 1
        while (folder / f"{item_id}.v{n}.mp4").exists():
            n += 1
        with self._lock:
            target = folder / f"{item_id}.v{n}.mp4"
            os.replace(video, target)
            for suffix, versioned in ((".verdict.json", f".v{n}.verdict.json"), ("_last.png", f".v{n}_last.png")):
                old = folder / f"{item_id}{suffix}"
                if old.is_file():
                    os.replace(old, folder / f"{item_id}{versioned}")
            self._frames.pop(video, None)
        log.info("versão anterior guardada: %s", target)
        return {"anterior": str(target)}

    def scan_once(self) -> None:
        """Extrai MP4s que permaneceram com tamanho e mtime estáveis por dois ciclos."""
        with self._lock:
            present = set()
            for video in self.folder.glob("*/*.mp4"):
                if _VERSIONED.fullmatch(video.stem):
                    continue
                try:
                    persona, item_id = safe_id(video.parent.name), safe_id(video.stem)
                    stat = video.stat()
                    signature = (stat.st_size, stat.st_mtime_ns)
                    present.add(video)
                    previous = self._seen.get(video)
                    if previous and previous[:2] == signature and previous[2]:
                        continue
                    if previous is None or previous[:2] != signature:
                        # First sighting: the next scan confirms the file is stable.
                        self._seen[video] = (*signature, False)
                    elif previous[2] is False:
                        try:
                            self.last_frame(persona, item_id)
                        except FramePreto as exc:
                            log.warning("%s", exc)
                        except (OSError, ValueError, ImportError, Pendente) as exc:
                            log.warning("último frame pendente para %s: %s", video, exc)
                        try:
                            self.extract(persona, item_id)
                            self._seen[video] = (*signature, True)
                        except (OSError, ValueError, ImportError) as exc:
                            log.warning("extração pendente para %s: %s", video, exc)
                except (OSError, ValueError) as exc:
                    log.warning("MP4 ignorado %s: %s", video, exc)
            for old in self._seen.keys() - present:
                del self._seen[old]

    def verdicts(self, persona: str) -> list[dict]:
        persona = safe_id(persona)
        entries = []
        for path in (self.folder / persona).glob("*.verdict.json"):
            try:
                item_id = safe_id(path.name.removesuffix(".verdict.json"))
                entries.append({"item_id": item_id, "mtime": str(path.stat().st_mtime_ns)})
            except (OSError, ValueError):
                continue
        return sorted(entries, key=lambda entry: entry["item_id"])

    def verdict(self, persona: str, item_id: str) -> dict:
        path = self.folder / safe_id(persona) / f"{safe_id(item_id)}.verdict.json"
        verdict = qa.validate_verdict(path)
        if verdict["item_id"] != item_id:
            raise ValueError("item_id do veredito não corresponde ao arquivo")
        return verdict


class ExclusiveHTTPServer(ThreadingHTTPServer):
    """Sem SO_REUSEADDR: no Windows ele deixava uma segunda instância escutar na mesma porta sem erro."""
    allow_reuse_address = False
    allow_reuse_port = False

    def server_bind(self):
        if sys.platform == "win32":
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
        super().server_bind()


def make_server(folder: str | Path, port: int = 8765, fila: str | Path | None = None) -> ThreadingHTTPServer:
    service = QAService(folder, fila)

    class Handler(BaseHTTPRequestHandler):
        def _send(self, status: int, payload: dict | list) -> None:
            body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            origin = self.headers.get("Origin", "")
            if origin.startswith("chrome-extension://") and re.fullmatch(r"chrome-extension://[a-p]{32}", origin):
                self.send_header("Access-Control-Allow-Origin", origin)
                self.send_header("Vary", "Origin")
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            url = urlsplit(self.path)
            try:
                if url.path == "/saude":
                    result = {"ok": True}
                elif url.path == "/vereditos":
                    result = service.verdicts(parse_qs(url.query).get("persona", [""])[0])
                elif url.path.startswith("/ultimo-frame/"):
                    parts = url.path.split("/")
                    if len(parts) != 4:
                        raise ValueError("rota inválida")
                    depois = float(parse_qs(url.query).get("depois", ["0"])[0] or 0)
                    result = service.last_frame(unquote(parts[2]), unquote(parts[3]), depois)
                elif url.path.startswith("/veredito/"):
                    parts = url.path.split("/")
                    if len(parts) != 4:
                        raise ValueError("rota inválida")
                    result = service.verdict(unquote(parts[2]), unquote(parts[3]))
                else:
                    self._send(404, {"erro": "rota não encontrada"})
                    return
                self._send(200, result)
            except (FileNotFoundError, Pendente) as exc:
                self._send(404, {"erro": str(exc)})
            except FramePreto as exc:
                self._send(422, {"erro": str(exc), "preto": True, "path": str(exc.path)})
            except (ValueError, KeyError) as exc:
                self._send(400, {"erro": str(exc)})

        def do_POST(self):
            route = urlsplit(self.path).path
            if route not in ("/extrair", "/versionar"):
                self._send(404, {"erro": "rota não encontrada"})
                return
            try:
                origin = self.headers.get("Origin")
                if origin and not re.fullmatch(r"chrome-extension://[a-p]{32}", origin):
                    self._send(403, {"erro": "origem não permitida"})
                    return
                length = int(self.headers.get("Content-Length", "0"))
                if length <= 0 or length > 8192:
                    raise ValueError("corpo inválido ou muito grande")
                data = json.loads(self.rfile.read(length))
                result = (service.versionar(data["persona"], data["item_id"]) if route == "/versionar" else
                          service.extract(data["persona"], data["item_id"], data.get("fila")))
                self._send(200, result)
            except FileNotFoundError as exc:
                self._send(404, {"erro": str(exc)})
            except (ValueError, KeyError, TypeError, ImportError) as exc:
                self._send(400, {"erro": str(exc)})

        def do_OPTIONS(self):
            self.send_response(204)
            origin = self.headers.get("Origin", "")
            if re.fullmatch(r"chrome-extension://[a-p]{32}", origin):
                self.send_header("Access-Control-Allow-Origin", origin)
                self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
                self.send_header("Access-Control-Allow-Headers", "Content-Type")
                self.send_header("Vary", "Origin")
            self.end_headers()

    try:
        server = ExclusiveHTTPServer(("127.0.0.1", port), Handler)
    except OSError as exc:
        raise PortaOcupada(f"a porta {port} já está em uso (outro servidor de QA aberto?): {exc}") from exc
    server.qa_service = service
    return server


def serve(folder: str | Path, port: int = 8765, fila: str | Path | None = None) -> None:
    server = make_server(folder, port, fila)
    stop = threading.Event()

    def watch():
        while not stop.is_set():
            server.qa_service.scan_once()
            stop.wait(2)

    worker = threading.Thread(target=watch, daemon=True)
    worker.start()
    log.info("QA local em http://127.0.0.1:%s; pasta %s", server.server_port, server.qa_service.folder)
    try:
        server.serve_forever()
    finally:
        stop.set()
        server.server_close()
        worker.join(timeout=3)
