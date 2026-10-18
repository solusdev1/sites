import csv
import json
from pathlib import Path
from types import SimpleNamespace

import pytest

from veo_pipeline import auto_veo, genjutsu, pos_producao, roteiro
from veo_pipeline.cli import main
from veo_pipeline.config import Config, load_dotenv
from veo_pipeline.custo import estimar
from veo_pipeline.fila import load_fila, save_fila
from veo_pipeline.persona import ARQUETIPOS, load_persona, montar_prompt
from veo_pipeline.schema import ValidationError, validate


# ---------- persona / schema ----------
def test_persona_valida_e_prompt(persona):
    p = montar_prompt(persona, persona["looks"][0], "cena X", "camera Y", "oi gente")
    assert p.startswith(persona["bloco_fixo"][:20])
    for trecho in (persona["looks"][0]["descricao"], "cena X", "camera Y", "oi gente", persona["estilo"]):
        assert trecho in p


def test_persona_invalida(tmp_path, persona):
    ruim = dict(persona, looks=persona["looks"] * 2)  # 6 looks > max 3
    f = tmp_path / "p.json"
    f.write_text(json.dumps(ruim))
    with pytest.raises(ValidationError):
        load_persona(f)


@pytest.mark.parametrize("arq", ARQUETIPOS)
def test_todos_arquetipos_geram(persona, arq):
    persona["arquetipo"] = arq
    fila = roteiro.gerar(persona, "nicho x", 6)
    validate("fila", fila)
    assert len(fila["itens"]) == 6


def test_alias_relatable(tmp_path, persona):
    persona["arquetipo"] = "relatable"
    f = tmp_path / "p.json"
    f.write_text(json.dumps(persona))
    assert load_persona(f)["arquetipo"] == "relatable_cidade_grande"


# ---------- roteiro ----------
def test_roteiro_offline_ids_estaveis_e_unicos(persona):
    a = roteiro.gerar(persona, "vida em SP", 30)
    b = roteiro.gerar(persona, "vida em SP", 30)
    ids = [i["id"] for i in a["itens"]]
    assert len(ids) == len(set(ids)) == 30
    assert ids == [i["id"] for i in b["itens"]]
    assert all("#IA" in i["hashtags"] for i in a["itens"])
    assert all(i["status"] == "pendente" and i["duracao_s"] == 8 for i in a["itens"])


def test_roteiro_formatos_cobertos(persona):
    hooks = " ".join(i["hook"] for i in roteiro.gerar(persona, "x", 8)["itens"])
    assert "Ep. 1" in hooks and "POV:" in hooks and "fotos antigas" in hooks and "Respondendo" in hooks


def test_roteiro_gemini_usado_e_fallback(persona):
    dados = [{"hook": "h", "cena": "c", "fala": "f", "camera": "k", "legenda": "l", "hashtags": ["a"]}]
    ok = roteiro.gerar(persona, "x", 3, api_key="K", llm=lambda p, n, q, k, m: roteiro.itens_de_llm(p, dados))
    assert ok["itens"][0]["hook"] == "h" and "#a" in ok["itens"][0]["hashtags"]

    def boom(*a):
        raise RuntimeError("rede")

    fb = roteiro.gerar(persona, "x", 3, api_key="K", llm=boom)
    assert len(fb["itens"]) == 3 and fb["itens"][0]["hook"] != "h"


def test_dedup_append(tmp_path, persona):
    out = tmp_path / "fila.json"
    save_fila(out, roteiro.gerar(persona, "x", 4))
    save_fila(out, roteiro.gerar(persona, "x", 6), append=True)
    assert len(load_fila(out)["itens"]) == 6


# ---------- genjutsu ----------
@pytest.mark.parametrize("modo", genjutsu.MODOS)
def test_genjutsu(persona, modo):
    fila = genjutsu.gerar(persona, modo, "clip.mp4", "ancora.png", 4)
    validate("fila", fila)
    it = fila["itens"][0]
    assert it["tipo"] == "genjutsu" and it["modo"] == modo
    assert it["anexos"] == {"imagem_ancora": "ancora.png", "video_fonte": "clip.mp4"}
    assert "morphing" in it["negative_prompt"] and "choreography drift" in it["negative_prompt"]
    assert len({i["id"] for i in fila["itens"]}) == 4


def test_genjutsu_modo_invalido(persona):
    with pytest.raises(ValueError):
        genjutsu.gerar(persona, "xx", "a", "b", 1)


# ---------- custo ----------
def test_custo(persona):
    fila = roteiro.gerar(persona, "x", 5)
    assert estimar(fila, 0.5)["custo_usd"] == 20.0  # 5 x 8s x 0.5


# ---------- auto_veo (mock, sem rede) ----------
class FakeVideo:
    def save(self, path):
        Path(path).write_bytes(b"mp4")


class FakeOp:
    def __init__(self, done_after, error=None):
        self.n, self.done_after, self.error = 0, done_after, error
        self.response = SimpleNamespace(generated_videos=[SimpleNamespace(video=FakeVideo())])

    @property
    def done(self):
        return self.n >= self.done_after


class FakeClient:
    def __init__(self, done_after=2, falha_em=None):
        self.chamadas, self.done_after, self.falha_em = [], done_after, falha_em
        self.models = SimpleNamespace(generate_videos=self._gen)
        self.operations = SimpleNamespace(get=self._get)
        self.files = SimpleNamespace(download=lambda file: None)

    def _gen(self, **kw):
        self.chamadas.append(kw)
        if self.falha_em is not None and len(self.chamadas) == self.falha_em:
            return FakeOp(0, error="bloqueado")
        return FakeOp(self.done_after)

    def _get(self, op):
        op.n += 1
        return op


def cfg_teste():
    return Config(gemini_api_key="SECRET-KEY", poll_interval=0.0, poll_timeout=5.0)


def test_dry_run_nao_chama_nada(persona, tmp_path):
    fila = roteiro.gerar(persona, "x", 3)

    def proibido(k):
        pytest.fail("não deve criar client")

    res = auto_veo.executar(fila, tmp_path, cfg_teste(), dry_run=True, client_factory=proibido)
    assert res["dry_run"] and len(res["pendentes"]) == 3
    assert res["custo"]["segundos"] == 24 and res["custo"]["custo_usd"] == round(24 * 0.15, 4)


def test_gera_retoma_e_nao_vaza_key(persona, tmp_path, caplog):
    fila = roteiro.gerar(persona, "x", 3)
    c1 = FakeClient(falha_em=2)
    r1 = auto_veo.executar(fila, tmp_path, cfg_teste(), client_factory=lambda k: c1, sleep=lambda s: None)
    assert len(r1["gerados"]) == 2 and len(r1["falhas"]) == 1
    kw = c1.chamadas[0]
    assert kw["config"]["duration_seconds"] == 8 and kw["config"]["number_of_videos"] == 1
    assert kw["config"]["resolution"] == "720p"
    assert kw["model"] == "veo-3.1-fast-generate-preview"
    # retomada: so o que falhou e regerado
    c2 = FakeClient()
    r2 = auto_veo.executar(fila, tmp_path, cfg_teste(), client_factory=lambda k: c2, sleep=lambda s: None)
    assert len(r2["pulados"]) == 2 and len(r2["gerados"]) == 1 and len(c2.chamadas) == 1
    assert "SECRET-KEY" not in caplog.text and "SECRET-KEY" not in json.dumps(r1)
    assert len(list(tmp_path.glob("*.mp4"))) == 3


def test_timeout(persona, tmp_path):
    fila = roteiro.gerar(persona, "x", 1)
    t = iter(range(0, 10000, 100))
    res = auto_veo.executar(fila, tmp_path, cfg_teste(), client_factory=lambda k: FakeClient(done_after=999),
                            sleep=lambda s: None, clock=lambda: next(t))
    assert len(res["falhas"]) == 1


def test_sem_key(persona, tmp_path):
    with pytest.raises(auto_veo.VeoError):
        auto_veo.executar(roteiro.gerar(persona, "x", 1), tmp_path, Config(gemini_api_key=""))


def test_genjutsu_ignorado_na_api(persona, tmp_path):
    fila = genjutsu.gerar(persona, "motion", "c.mp4", "", 2)
    res = auto_veo.executar(fila, tmp_path, cfg_teste(), dry_run=True)
    assert len(res["ignorados"]) == 2 and res["custo"]["segundos"] == 0


def test_imagem_ancora_enviada(persona, tmp_path):
    img = tmp_path / "a.png"
    img.write_bytes(b"png")
    fila = roteiro.gerar(persona, "x", 1)
    fila["itens"][0]["anexos"]["imagem_ancora"] = str(img)
    c = FakeClient()
    auto_veo.executar(fila, tmp_path / "o", cfg_teste(), client_factory=lambda k: c, sleep=lambda s: None)
    assert c.chamadas[0]["image"]["image_bytes"] == b"png"


# ---------- pos-producao ----------
def test_pos_producao(persona, tmp_path):
    fila = roteiro.gerar(persona, "x", 3)
    ids = [i["id"] for i in fila["itens"]]
    (tmp_path / f"flow_{ids[0]}.mp4").write_bytes(b"1")  # casa por id
    (tmp_path / "Download (1).mp4").write_bytes(b"2")  # casa por ordem
    res = pos_producao.processar(tmp_path, fila, "2026-10-18")
    assert f"2026-10-18_{ids[0]}.mp4" in res["renomeados"] and len(res["renomeados"]) == 2
    txt = (tmp_path / f"2026-10-18_{ids[0]}.txt").read_text(encoding="utf-8")
    assert "#IA" in txt and "gerado por IA" in txt
    rows = list(csv.reader(open(res["quarentena_csv"], encoding="utf-8")))
    assert rows[0][0] == "arquivo" and len(rows) == 3
    assert pos_producao.processar(tmp_path, fila, "2026-10-18")["renomeados"] == []  # idempotente


# ---------- config / CLI ----------
def test_dotenv_e_config(tmp_path, monkeypatch):
    monkeypatch.delenv("VEO_MODEL", raising=False)
    monkeypatch.delenv("VEO_PRICE_PER_SECOND", raising=False)
    (tmp_path / ".env").write_text("VEO_MODEL=meu-modelo\nVEO_PRICE_PER_SECOND=0.4\n# c\n")
    load_dotenv(tmp_path / ".env")
    c = Config.from_env()
    assert c.veo_model == "meu-modelo" and c.price_per_second == 0.4
    monkeypatch.delenv("VEO_MODEL")
    monkeypatch.delenv("VEO_PRICE_PER_SECOND")


def test_cli_ponta_a_ponta(persona_path, tmp_path, monkeypatch, capsys):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.chdir(tmp_path)
    out = str(tmp_path / "fila.json")
    assert main(["roteiro", "--persona", persona_path, "--nicho", "vida em SP", "--qtd", "10", "--out", out]) == 0
    assert main(["validar", "fila", out]) == 0
    gj = str(tmp_path / "g.json")
    assert main(["genjutsu", "--persona", persona_path, "--modo", "motion", "--video-fonte", "v.mp4",
                 "--imagem-ancora", "a.png", "--qtd", "2", "--out", gj]) == 0
    assert main(["veo", "--fila", out, "--out-dir", str(tmp_path / "s"), "--dry-run"]) == 0
    assert '"custo_usd"' in capsys.readouterr().out
    assert main(["validar", "persona", str(tmp_path / "nao_existe.json")]) == 2


def test_exemplo_valido():
    ex = Path(__file__).resolve().parent.parent / "data" / "exemplos" / "fila.exemplo.json"
    validate("fila", json.loads(ex.read_text(encoding="utf-8")))


# ---------- integracao com o plugin (veo_flow_plugin) ----------
PLUGIN = Path(__file__).resolve().parent.parent / "veo_flow_plugin"


def test_plugin_aceita_filas_do_python(persona, tmp_path):
    import shutil
    import subprocess
    if not shutil.which("node") or not (PLUGIN / "src" / "queue.js").is_file():
        pytest.skip("node/plugin indisponivel")
    arquivos = []
    for nome, fila in (("a.json", roteiro.gerar(persona, "vida em SP", 12)),
                       ("b.json", genjutsu.gerar(persona, "swap_produto", "v.mp4", "a.png", 3))):
        save_fila(tmp_path / nome, fila)
        arquivos.append(str(tmp_path / nome))
    js = ("import {parseQueue,parsePersona} from %s;import fs from 'fs';"
          "for (const f of process.argv.slice(1)) parseQueue(fs.readFileSync(f,'utf8'));"
          "parsePersona(fs.readFileSync(%s,'utf8'));console.log('ok')"
          % (json.dumps((PLUGIN / "src" / "queue.js").as_uri()),
             json.dumps(str(Path(__file__).resolve().parent.parent / "data" / "personas" / "luna.json"))))
    r = subprocess.run(["node", "--input-type=module", "-e", js, *arquivos], capture_output=True, text=True)
    assert r.returncode == 0 and "ok" in r.stdout, r.stderr


def test_estado_do_plugin_alimenta_pos_e_veo(persona, tmp_path):
    fila = roteiro.gerar(persona, "x", 3)
    fila["persona"] = persona  # fila_estado.json exportado pelo plugin carrega persona
    fila["itens"][0]["status"] = "gerado"
    fila["itens"][1]["status"] = "descartado"
    validate("fila", fila)
    res = auto_veo.executar(fila, tmp_path, cfg_teste(), dry_run=True)
    assert res["pendentes"] == [fila["itens"][2]["id"]]
    (tmp_path / "x.mp4").write_bytes(b"1")
    (tmp_path / "y.mp4").write_bytes(b"2")
    out = pos_producao.processar(tmp_path, fila, "2026-10-18")
    assert all(fila["itens"][1]["id"] not in n for n in out["renomeados"])
