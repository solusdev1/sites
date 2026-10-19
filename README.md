# veo_pipeline — influencer de IA (Luna) para Veo 3.1

Reescrita do zero do pipeline descrito na conversa com o Kimi (`Veo3 API.docx`). Python 3.11+, sem rede nos testes.

```
pip install -e .[dev]          # jsonschema (+ pytest); google-genai é opcional: pip install -e .[genai]
python -m veo_pipeline roteiro  --persona data/personas/luna.json --nicho "vida em SP" --qtd 10 --out fila.json
python -m veo_pipeline sequencia --persona data/personas/luna.json --nicho "vida em SP" --beats 3 --out fila_sequencia.json
python -m veo_pipeline genjutsu --modo motion|swap_produto|restyle --video-fonte clip.mp4 --imagem-ancora luna.png --qtd 3 --out fila_genjutsu.json [--preparar-fonte]
python -m veo_pipeline veo      --fila fila.json --out-dir saida/ [--dry-run]
python -m veo_pipeline pos      --pasta Downloads/lote --fila fila.json [--data 2026-10-18]
python -m veo_pipeline qa extrair --video clips/ID.mp4 --item-id ID --fila fila.json --out-dir clips/qa/ID/
python -m veo_pipeline qa validar --verdict clips/qa/ID/ID.verdict.json
python -m veo_pipeline servir --fila fila.json [--porta 8765] [--pasta ~/Downloads/veo3]
python -m veo_pipeline montar --fila fila.json --dir clips --out final.mp4
python -m veo_pipeline validar  persona|fila arquivo.json
python -m pytest -q
```

Cada vídeo deve passar por QA visual antes de gerar o próximo. A skill [`veo-video-qa`](skills/veo-video-qa/SKILL.md) orienta a análise pelo próprio agente, sem chave paga; veja o [fluxo completo](docs/qa-fluxo.md). A extração requer ffmpeg no PATH (ou `pip install -e .[ffmpeg]`) e Pillow. A análise opcional por API usa `pip install -e .[vision]` e `qa analisar --api --checklist clips/qa/ID/checklist.json`.

### QA automática com o plugin

Execute `python -m veo_pipeline servir --fila fila.json` em um terminal enquanto usa a extensão. O servidor escuta apenas `127.0.0.1:8765` e observa `~/Downloads/veo3/<persona_id>/`. Quando o MP4 termina de ser salvo, extrai os frames em `qa/<ID>/` ao lado do vídeo e registra o caminho pronto para análise. O agente ainda precisa inspecionar as imagens e gravar `<ID>.verdict.json` na pasta da persona; a extensão o aplica automaticamente a um item `gerado` quando o popup está aberto. Se a fila estiver em outro local, passe seu caminho a `--fila`. Sem `--fila`, o servidor procura `fila*.json` na pasta atual e filas JSON na pasta de downloads. A porta da extensão é fixa em 8765; outra porta exige alterar a URL no código da extensão. O botão **Importar veredito** continua disponível quando o servidor estiver desligado.


Ou dê dois cliques em `servir.bat` na raiz do projeto (aceita os mesmos argumentos, como `--porta` e `--pasta`).
## Contrato com o plugin Chrome
`schemas/persona.schema.json` e `schemas/fila.schema.json`. O `prompt_final` (bloco_fixo + look + cena + câmera + fala + estilo)
vem pronto do Python; o plugin só injeta. Exemplos válidos: `data/exemplos/fila.exemplo.json`, `fila_genjutsu.exemplo.json`.

## Integração com o plugin (veo_flow_plugin)
1. `roteiro` / `genjutsu` geram `fila.json` → no popup do plugin, **Importar fila** (e `data/personas/luna.json` se algum `prompt_final` vier vazio).
2. No Flow: **Preencher próximo**, anexar imagem âncora/vídeo fonte, Generate, e marcar o item como `gerado` ou `descartado`.
3. **Exportar estado** gera `fila_estado.json` (mesmo contrato, com `status`: pendente|preenchido|gerado|descartado + `persona`).
4. `python -m veo_pipeline pos --pasta <downloads> --fila fila_estado.json` renomeia os MP4 (casa por id no nome ou por ordem), pula itens `descartado` e gera legenda+disclosure+`quarentena.csv`.
5. `veo --fila fila_estado.json` (rota API) pula itens `gerado`/`descartado`.
Teste de contrato: `tests/test_pipeline.py::test_plugin_aceita_filas_do_python` roda o `parseQueue` do plugin (node) sobre as filas geradas aqui.

## Módulos
- `persona.py` — carrega/valida persona, monta `prompt_final`. Arquétipos: relatable_cidade_grande (alias `relatable`), fit, luxo_viagem, foodie, review_tech, serial_lore.
- `roteiro.py` — templates offline por arquétipo; formatos: série com cliffhanger, POV serializado, memórias, resposta a comentário. Com `GEMINI_API_KEY` usa google-genai (import lazy), com fallback offline em qualquer erro.
- `roteiro.gerar_sequencia` — imagem de referência (sem fala) → 1º frame da cena → vídeos encadeados pelo último frame (Flow: Omni 1.1 Flash, 720p, 10s).
- `genjutsu.py` — fila vídeo→vídeo (motion / swap_produto / restyle), anexos `video_fonte` + `imagem_ancora`, negative prompt reforçado. No Flow: Vídeo → Elementos com Omni 1.1 Flash, vídeo fonte + personagem como elementos, prompt "sem fala". `--preparar-fonte` cria `<video>_mudo.mp4` (sem áudio, até 10s) com ffmpeg: com áudio o Flow recusa ("Não é possível editar a fala neste vídeo").
- `auto_veo.py` — rota API opcional (Veo 3.1 fast, 8s, 720p, 1 take), polling com backoff e timeout, retomável, `--dry-run`. Itens `genjutsu` são ignorados (ver abaixo).
- `pos_producao.py` — renomeia MP4 para `<data>_<id>.mp4`, gera `.txt` com legenda + hashtags + disclosure de IA (`#IA` e "Conteúdo gerado por IA", sempre), e `quarentena.csv` (arquivo, id, rosto_ok, observação).

## Melhorias incluídas
1. Validação por JSON Schema (persona e fila) na leitura e antes de gravar.
2. IDs estáveis (hash do conteúdo) e dedup por id, inclusive `--append` em fila existente.
3. Logs (`LOG_LEVEL`), nunca imprimem a API key.
4. Config via `.env` (`.env.example` sem valores): modelo, resolução, preço/s, intervalos de polling.
5. Retomada: pula itens cujo `<id>.mp4` já existe; `estado.json` registra falhas.
6. Custo estimado por fila (segundos × `VEO_PRICE_PER_SECOND`) no dry-run e antes de gerar.
7. Disclosure de IA obrigatório na legenda e checklist de quarentena de rosto.

## Não confirmado (afirmações do Kimi)
- **Seed fixo** no Veo/Flow: não confirmado; não há seed exposto neste código (só negative prompt fixo).
- **Vídeo→vídeo na API do Veo 3.1**: não confirmado; a rota API ignora itens genjutsu. **No Flow** funciona (testado em 2026-10-18): Omni 1.1 Flash em Elementos com vídeo fonte sem áudio + imagem da Luna gerou o motion transfer de 10s (20 créditos).
- **Preços** (US$ 0,15/s default é só placeholder) e **nome do modelo** (`veo-3.1-fast-generate-preview`): configuráveis, confira a tabela vigente.
- **Higgsfield Genjutsu** (lançamento, preços US$ 2–7,20/clipe) e **trends/Lil Miquela**: vêm da conversa; a busca do Kimi falhou em partes, nada foi verificado.
- Veo "sincroniza lábios a partir do áudio ElevenLabs" e Flow "Frames to Video com imagem âncora garante o rosto": não confirmados; a quarentena existe por isso.
- Termos de uso: o Kimi recomendou não automatizar o login da assinatura; este projeto não faz isso (plugin é copiloto, API é oficial).
