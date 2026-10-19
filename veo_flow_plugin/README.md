# Flow Copiloto · Luna

Extensão Chrome Manifest V3 para acompanhar uma fila de vídeos da persona Luna. Ela **só preenche o texto do prompt** no Google Flow ou no app Gemini. A escolha dos anexos, a revisão e o clique em **Generate** são sempre seus.

## Instalação

1. Abra `chrome://extensions` no Chrome e ative **Modo do desenvolvedor**.
2. Clique em **Carregar sem compactação** e selecione a pasta `veo_flow_plugin`.
3. Abra `https://flow.google.com` (o antigo `https://labs.google/fx/tools/flow` redireciona para lá) ou `https://gemini.google.com` e recarregue a aba se ela já estava aberta antes de instalar a extensão.

Não é necessário instalar dependências para usar a extensão. `npm.cmd install` é necessário apenas para rodar os testes.

## Uso

1. Importe `fila.json` e, se desejar, `fila_genjutsu.json` pelo botão **Importar fila**. Itens com o mesmo `id` são ignorados; o status já salvo permanece.
2. Importe `persona.json` se algum item tiver `prompt_final` vazio. Nesse caso, o plugin monta o texto com `bloco_fixo`, `cena`, `camera` e `fala`.
3. Na aba do Flow ou Gemini, clique em **Preencher próximo**. O item atual passa a `preenchido` somente após o editor confirmar a inserção. No Flow, uma fila sem o campo `flow` (ex.: a semanal) é preparada como Vídeo → Frames 9:16, mantendo o modelo e a duração que já estão no Flow.
4. Anexe manualmente a imagem âncora e, para Genjutsu, o vídeo fonte indicados no item. Confira o prompt e clique em **Generate** na página.
5. Revise o vídeo e clique em **Aprovar** ou **Rejeitar** (ou use **Importar veredito**, abaixo). A fila só avança para o item seguinte depois que o atual é aprovado. Rejeitado mostra **Regenerar este**, que reusa o mesmo prompt (ou o `prompt_correcao` da QA) e o mesmo frame inicial. É possível voltar um item a `pendente` ou descartá-lo.
6. Use **Exportar estado** para baixar `fila_estado.json`. Esse arquivo pode ser reimportado como fila após limpar o estado, inclusive com os status e a persona. **Limpar fila** apaga apenas os dados locais desta extensão.

O estado fica em `chrome.storage.local`. A extensão não faz requisições externas, não envia telemetria e não coleta cookies. As permissões são `storage`, `activeTab` e `downloads` (só para salvar o vídeo gerado e o último frame em Downloads/veo3); o content script só roda nas páginas de Flow e Gemini definidas no manifest.

## Modo sequência (imagem → vídeo → estender)

Gere a fila com `python -m veo_pipeline sequencia --persona data/personas/luna.json --nicho "vida em SP" --beats 3 --out fila_sequencia.json`. Ela traz, em ordem: a imagem de referência da personagem (sem fala, fundo neutro), o primeiro frame da cena e os vídeos de 8s. No projeto aberto em flow.google.com, use **Executar próximo passo**:

O clique na seta de gerar é sempre seu: o Flow ignora cliques sintéticos nesse botão (verificado em 2026-10-18). A extensão prepara o passo, acompanha a página e marca o item como `gerado` quando a mídia nova aparece no projeto. Ela também guarda o nome que o Flow deu à mídia (`flow_midia`). Se aparecer um card "Falha", o popup mostra o erro e o item continua `preenchido`.

### Estado de cada item

`pendente` → `preenchido` → `gerado` → `aprovado` | `rejeitado`. O popup mostra o **item atual** (o primeiro ainda não aprovado nem descartado) e o motivo de não avançar. **Preencher próximo** muda conforme o estado: *Preencher de novo* (preenchido, ainda sem gerar), *Aguardando aprovação* (gerado), *Regenerar este* (rejeitado).

### Vídeo gerado e último frame

Quando o vídeo novo aparece no projeto, a extensão:

1. baixa o MP4 com `chrome.downloads` para `Downloads/veo3/<persona_id>/<item_id>.mp4` e grava o caminho em `video_path`. No Flow real o tile só cria o `<video>` com o endereço do arquivo ao passar o mouse; a extensão simula esse hover e entrega o endereço ao service worker (`src/background.js`), que baixa com os cookies do navegador. A página não consegue baixar sozinha: `fetch` e canvas no `<video>` do grid são bloqueados por CORS;
2. abre o vídeo no editor, pula para o fim, lê o último frame do canvas do player (PNG 1080×1920), volta ao projeto e salva `Downloads/veo3/<persona_id>/<item_id>_last.png` (`ultimo_frame`). O PNG também fica no armazenamento da extensão (os 2 mais recentes) para o próximo item.

Se algum dos dois falhar, o popup avisa, o erro fica no item (`download_erro`/`frame_erro`) e o botão **Baixar vídeo atual** refaz os dois. O próximo vídeo da fila, depois que o atual for aprovado, recebe esse PNG no **Início**. **Usar outro frame** troca o frame de continuação por um arquivo que você escolhe.

### Veredito da QA

**Importar veredito** lê `<item_id>.verdict.json`:

```json
{"item_id": "58155a350544", "verdict": "aprovado", "motivos": [], "frame_continuacao": null, "prompt_correcao": null}
```

O status do item muda para `aprovado` ou `rejeitado`; os motivos aparecem no popup. `prompt_correcao` substitui o prompt em **Regenerar este**. Se `frame_continuacao` indicar um arquivo diferente de `<item_id>_last.png`, a extensão pede que você escolha esse PNG, porque ela não lê arquivos do disco sozinha.

1. **Imagens**: a extensão troca o Flow para Imagem 9:16, anexa a referência quando o item pede e preenche. O popup mostra o custo (0 créditos com Nano Banana 2.1). Confira a imagem e, se não ficou fiel à persona, use **Voltar a pendente** e execute de novo.
2. **Vídeo 1**: Vídeo → Frames 9:16, **Omni 1.1 Flash, 720p, 10s** (configurável no `flow` do item), coloca no Início a imagem mais recente do projeto e preenche. Gere na própria página (usa créditos).
3. **Vídeos seguintes**: a extensão abre o vídeo anterior: o que estiver aberto no editor; senão, o vídeo com o nome gravado no item anterior; senão, o mais recente do projeto. Depois pula para o fim, lê o **último frame** direto do player (nada é baixado), volta ao projeto, envia o frame pelo **Enviar mídia** do Início e preenche o prompt de continuação. Não usa "Estender". No primeiro envio, o Flow mostra o aviso **Direitos de uso desta imagem**: quem clica em **Concordo** é você; a extensão espera.

### Genjutsu (vídeo → vídeo)

Gere a fila com `python -m veo_pipeline genjutsu --modo motion --video-fonte trend.mp4 --preparar-fonte --qtd 1 --out fila_genjutsu.json`. O `--preparar-fonte` cria `trend_mudo.mp4`, sem áudio e com até 10s, porque com áudio o Flow recusa com "Não é possível editar a fala neste vídeo". No popup, **Escolher vídeo fonte e preparar genjutsu** pede o arquivo `_mudo.mp4`. Vídeos com mais de 10s são recusados no próprio popup. A extensão configura Vídeo → Elementos · Omni 1.1 Flash · 720p · 9:16, envia o vídeo pelo "+" → Vídeos, ou reaproveita o que já estiver no projeto com o mesmo nome (aviso "Direitos de uso deste vídeo": você clica em Concordo), anexa a imagem âncora pelo nome, ou a imagem mais recente do projeto, e preenche o prompt. Com vídeo de referência o Flow cobra mais (20 créditos em 2026-10-18); o popup mostra o custo lido do Flow. Use apenas vídeos sobre os quais você tem direitos.

Um passo só roda depois que o item de origem estiver `aprovado`. As ações no DOM ficam em `src/flow-actions.js`. O envio do frame usa `src/page-upload.js`, que roda no contexto da página do Flow (só em flow.google.com) e só intercepta o seletor de arquivos quando a extensão o arma, uma vez.

## Contrato de dados

Aceita filas `version: 1` com `persona_id`, `gerado_em` e `itens` no formato do pipeline Python. Tipos: `imagem` e `veo` (`modo: null`) e `genjutsu` (`modo: motion`, `swap_produto` ou `restyle`). Status: `pendente`, `preenchido`, `gerado`, `aprovado`, `rejeitado`, `descartado`. A extensão usa `prompt_final` exatamente como veio do pipeline, sem acrescentar texto. Se ele estiver vazio, usa a persona importada para o fallback descrito acima.

## Limitações e cuidados

- O DOM do Flow e do Gemini muda. A busca pelo campo usa três estratégias, mas pode precisar de ajuste em `src/field-selection.js` se a interface mudar ou o editor estiver dentro de um iframe não coberto.
- As interfaces de assinatura têm regras próprias e existe uma zona cinzenta nos termos de uso para automações. A extensão nunca clica em gerar nem aceita avisos de direitos; ela só prepara e acompanha. Ela não usa APIs internas e não gerencia sessão.
- O preenchimento do prompt não garante consistência visual. Confira a imagem âncora, o rosto, a voz, o produto e os direitos do vídeo fonte antes da geração e publicação.
- Marque conteúdo sintético/gerado por IA na plataforma onde publicar.

## Desenvolvimento

Na pasta da extensão:

```powershell
npm.cmd install
npm.cmd test
npm.cmd run check:manifest
```

Os módulos `src/queue.js`, `src/prompt.js` e `src/field-selection.js` não dependem da API Chrome. Os testes usam `node:test` e `jsdom`; `test/fixtures/fila.exemplo.json` é uma fila própria de teste.

## Melhorias futuras

- Verificar visualmente o preenchimento nas versões novas de Flow e Gemini e atualizar os seletores por versão da página.
- Permitir seleção explícita de um item específico da fila para preencher.
- Adicionar checklist de quarentena para rosto, movimento, marca e disclosure após cada geração.
