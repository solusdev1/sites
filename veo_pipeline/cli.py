"""CLI: python -m veo_pipeline <roteiro|sequencia|genjutsu|veo|pos|qa|montar|validar>."""
from __future__ import annotations

import argparse
import json
import logging
import sys

from . import auto_veo, genjutsu, pos_producao, qa, roteiro
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

    s = sub.add_parser("sequencia", help="imagem da personagem -> 1º frame -> vídeos encadeados (Flow)")
    s.add_argument("--persona", required=True)
    s.add_argument("--nicho", required=True)
    s.add_argument("--beats", type=int, default=3, help="quantidade de vídeos de 8s encadeados")
    s.add_argument("--look", default=None, help="id do look (default: primeiro)")
    s.add_argument("--indice", type=int, default=0, help="qual roteiro do arquétipo usar")
    s.add_argument("--out", default="fila_sequencia.json")

    g = sub.add_parser("genjutsu", help="gera fila genjutsu (vídeo→vídeo)")
    g.add_argument("--persona", default="data/personas/luna.json")
    g.add_argument("--modo", required=True, choices=genjutsu.MODOS)
    g.add_argument("--video-fonte", required=True)
    g.add_argument("--imagem-ancora", default="")
    g.add_argument("--qtd", type=int, default=3)
    g.add_argument("--preparar-fonte", action="store_true",
                   help="cria <video>_mudo.mp4 (sem áudio, até 10s) com ffmpeg e usa na fila (exigido pelo Flow)")
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

    q = sub.add_parser("qa", help="extrai evidências, valida ou analisa vídeo")
    qsub = q.add_subparsers(dest="qa_cmd", required=True)
    qe = qsub.add_parser("extrair")
    qe.add_argument("--video", required=True)
    qe.add_argument("--item-id", required=True)
    qe.add_argument("--fila", required=True)
    qe.add_argument("--out-dir", required=True)
    qe.add_argument("--fps", type=float, default=2.0)
    qv = qsub.add_parser("validar")
    qv.add_argument("--verdict", required=True)
    qa_api = qsub.add_parser("analisar", help="analisa os frames usando API de visão opcional")
    qa_api.add_argument("--api", action="store_true", required=True)
    qa_api.add_argument("--checklist", required=True)

    montar = sub.add_parser("montar", help="concatena somente vídeos aprovados em ordem")
    montar.add_argument("--fila", required=True)
    montar.add_argument("--dir", required=True)
    montar.add_argument("--out", required=True)

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
        elif args.cmd == "sequencia":
            persona = load_persona(args.persona)
            fila = roteiro.gerar_sequencia(persona, args.nicho, args.beats, args.look, args.indice)
            save_fila(args.out, fila)
            print(f"{len(fila['itens'])} itens (2 imagens + {args.beats} vídeos) -> {args.out}")
        elif args.cmd == "genjutsu":
            persona = load_persona(args.persona)
            fonte = str(genjutsu.preparar_fonte(args.video_fonte)) if args.preparar_fonte else args.video_fonte
            fila = genjutsu.gerar(persona, args.modo, fonte, args.imagem_ancora, args.qtd)
            save_fila(args.out, fila, append=args.append)
            print(f"{len(fila['itens'])} itens -> {args.out}")
        elif args.cmd == "veo":
            res = auto_veo.executar(load_fila(args.fila), args.out_dir, cfg, dry_run=args.dry_run)
            print(json.dumps(res, ensure_ascii=False, indent=2))
            return 1 if res["falhas"] else 0
        elif args.cmd == "pos":
            res = pos_producao.processar(args.pasta, load_fila(args.fila), args.data)
            print(json.dumps(res, ensure_ascii=False, indent=2))
        elif args.cmd == "qa":
            if args.qa_cmd == "extrair":
                res = qa.extract(args.video, args.item_id, args.fila, args.out_dir, args.fps)
                print(f"{len(res['frames'])} frames -> {args.out_dir}")
            elif args.qa_cmd == "validar":
                qa.validate_verdict(args.verdict)
                print("ok")
            else:
                print(qa.analyze_api(args.checklist))
        elif args.cmd == "montar":
            print(json.dumps(qa.assemble(args.fila, args.dir, args.out), ensure_ascii=False))
        elif args.cmd == "validar":
            validate(args.tipo, load_json(args.arquivo))
            print("ok")
    except (ValidationError, auto_veo.VeoError, FileNotFoundError, ValueError, ImportError) as exc:
        print(f"erro: {exc}", file=sys.stderr)
        return 2
    return 0
