# QA de vídeo antes do próximo beat

O problema que este fluxo procura é uma transição visual incorreta, como surgir uma segunda mala quando a personagem puxa a primeira. O ffmpeg só extrai e monta; a inspeção visual precisa ser feita pelo agente com acesso às imagens, ou pela API de visão opcional.

1. Gere a `fila.json` com `roteiro` ou `sequencia`; importe a fila no plugin Flow. Os prompts gerados pedem quantidade explícita para objetos reconhecidos e incluem termos contra duplicação no `negative_prompt`.
2. Gere **um** vídeo no Flow e baixe seu MP4 como `<ID>.mp4` em uma pasta de clipes. Pause a sequência antes do próximo vídeo.
3. No agente que consegue ler imagens, use a skill [`veo-video-qa`](../skills/veo-video-qa/SKILL.md) (copie o diretório para `~/.claude/skills/veo-video-qa` se usar Claude Code):

   ```bash
   python -m veo_pipeline qa extrair --video clips/ID.mp4 --item-id ID --fila fila.json --out-dir clips/qa/ID/
   ```

   Abra a contact sheet, os frames-chave e `checklist.json`. A amostra padrão é 2 fps, mais o primeiro e último frame; `--fps` aceita até 4.
4. Grave `clips/qa/ID/ID.verdict.json` conforme a skill e rode `python -m veo_pipeline qa validar --verdict clips/qa/ID/ID.verdict.json`. Como alternativa, com chave configurada, rode `python -m veo_pipeline qa analisar --api --checklist clips/qa/ID/checklist.json` e revise o resultado.
5. Importe o veredito no plugin. Aprovado: use o PNG de `frame_continuacao` como imagem inicial do próximo vídeo. Rejeitado: regenere o mesmo item com `prompt_correcao` e repita o QA. Se o erro ocorreu só no fim, `corte_sugerido` preserva o trecho bom e o frame de continuação deve vir de dentro desse trecho.
6. Após aprovar **todos os vídeos** na ordem da fila, monte:

   ```bash
   python -m veo_pipeline montar --fila fila.json --dir clips --out final.mp4
   ```

   A montagem ignora os itens do tipo `imagem`, exige exatamente um MP4 e veredito aprovado por item de vídeo, aplica os cortes e verifica que a duração final corresponde à soma dos trechos aprovados. Não pula lacunas da sequência. Ela gera vídeo sem trilha de narração adicional.

## Limites

- Uma grade de 2–4 fps pode não capturar defeitos de poucos quadros. Inspecione mais quadros nos instantes de interação e em todas as junções.
- O checklist só extrai automaticamente quantidades de alguns substantivos comuns. Confirme manualmente os demais objetos e conte usando a cena e o prompt.
- Para comparar continuidade com uma imagem `item:<ID>`, mantenha o arquivo dessa imagem acessível ao agente. O checklist guarda a referência; ele não baixa arquivos do Flow.
- Se a fila exportada não contiver `persona`, mantenha `data/personas/<persona_id>.json` no projeto (ou `personas/<persona_id>.json` junto da fila) para preencher o look e o `bloco_fixo`.
- A montagem reencoda os trechos cortados para cortes no tempo certo. A etapa não corrige defeitos visuais nem substitui o julgamento do agente.
