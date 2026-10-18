"""CLI: python -m veo_pipeline <roteiro|genjutsu|veo|pos|validar>."""
from __future__ import annotations

import argparse
import json
import logging
import sys

from . import auto_veo, genjutsu, pos_producao, roteiro
from .config import Config, load_dotenv, setup_logging
from .fila import load_fila, save_fila
from .persona import load_persona
from .schema import ValidationError, load_json, validate

log = logging.getLogger("veo_pipeline")


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="veo_pipeline", description=__doc__)
    sub = p.add_subparsers(dest="cmd", required=True)

    r = sub.add_parser("roteiro", help="gera fila de roteiros")
    r.add_argument("--persona", required=True)
    r.add_argument("--nicho", required=True)
    r.add_argument("--qtd", type=int, default=10)
    r.add_argument("--out", default="fila.json")
    r.add_argument("--append", action="store_true", help="mescla com a fila existente (dedup por id)")

    g = sub.add_parser("genjutsu", help="gera fila genjutsu (vídeo→vídeo)")
    g.add_argument("--persona", default="data/personas/luna.json")
    g.add_argument("--modo", required=True, choices=genjutsu.MODOS)
    g.add_argument("--video-fonte", required=True)
    g.add_argument("--imagem-ancora", default="")
    g.add_argument("--qtd", type=int, default=3)
    g.add_argument("--out", default="fila_genjutsu.json")
    g.add_argument("--append", action="store_true")

    v = sub.add_parser("veo", help="gera vídeos via API (opcional)")
    v.add_argument("--fila", required=True)
    v.add_argument("--out-dir", default="saida/")
    v.add_argument("--dry-run", action="store_true")

    pp = sub.add_parser("pos", help="pós-produção de uma pasta de MP4s")
    pp.add_argument("--pasta", required=True)
    pp.add_argument("--fila", required=True)
    pp.add_argument("--data", default=None, help="AAAA-MM-DD (default: hoje)")

    val = sub.add_parser("validar", help="valida persona/fila contra o schema")
    val.add_argument("tipo", choices=["persona", "fila"])
    val.add_argument("arquivo")
    return p


def main(argv: list[str] | None = None) -> int:
    load_dotenv()
    cfg = Config.from_env()
    setup_logging(cfg.log_level)
    args = build_parser().parse_args(argv)
    try:
        if args.cmd == "roteiro":
            persona = load_persona(args.persona)
            fila = roteiro.gerar(persona, args.nicho, args.qtd, cfg.gemini_api_key, cfg.text_model)
            save_fila(args.out, fila, append=args.append)
            print(f"{len(fila['itens'])} itens -> {args.out}")
        elif args.cmd == "genjutsu":
            persona = load_persona(args.persona)
            fila = genjutsu.gerar(persona, args.modo, args.video_fonte, args.imagem_ancora, args.qtd)
            save_fila(args.out, fila, append=args.append)
            print(f"{len(fila['itens'])} itens -> {args.out}")
        elif args.cmd == "veo":
            res = auto_veo.executar(load_fila(args.fila), args.out_dir, cfg, dry_run=args.dry_run)
            print(json.dumps(res, ensure_ascii=False, indent=2))
            return 1 if res["falhas"] else 0
        elif args.cmd == "pos":
            res = pos_producao.processar(args.pasta, load_fila(args.fila), args.data)
            print(json.dumps(res, ensure_ascii=False, indent=2))
        elif args.cmd == "validar":
            validate(args.tipo, load_json(args.arquivo))
            print("ok")
    except (ValidationError, auto_veo.VeoError, FileNotFoundError, ValueError) as exc:
        print(f"erro: {exc}", file=sys.stderr)
        return 2
    return 0
