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
3. Na aba do Flow ou Gemini, clique em **Preencher próximo**. O próximo item `pendente` passa a `preenchido` somente após o editor confirmar a inserção.
4. Anexe manualmente a imagem âncora e, para Genjutsu, o vídeo fonte indicados no item. Confira o prompt e clique em **Generate** na página.
5. Revise o vídeo e marque o item como **gerado** ou **descartado**. É possível voltar um item a `pendente`.
6. Use **Exportar estado** para baixar `fila_estado.json`. Esse arquivo pode ser reimportado como fila após limpar o estado, inclusive com os status e a persona. **Limpar fila** apaga apenas os dados locais desta extensão.

O estado fica em `chrome.storage.local`. A extensão não faz requisições externas, não envia telemetria e não coleta cookies. As permissões são `storage` e `activeTab`; o content script só roda nas páginas de Flow e Gemini definidas no manifest.

## Modo sequência (imagem → vídeo → estender)

Gere a fila com `python -m veo_pipeline sequencia --persona data/personas/luna.json --nicho "vida em SP" --beats 3 --out fila_sequencia.json`. Ela traz, em ordem: a imagem de referência da personagem (sem fala, fundo neutro), o primeiro frame da cena e os vídeos de 8s. No projeto aberto em flow.google.com, use **Executar próximo passo**:

O clique na seta de gerar é sempre seu: o Flow ignora cliques sintéticos nesse botão (verificado em 2026-10-18). A extensão prepara o passo, acompanha a página e marca o item como `gerado` quando a mídia nova aparece no projeto. Ela também guarda o nome que o Flow deu à mídia (`flow_midia`). Se aparecer um card "Falha", o popup mostra o erro e o item continua `preenchido`.

1. **Imagens**: a extensão troca o Flow para Imagem 9:16, anexa a referência quando o item pede e preenche. O popup mostra o custo (0 créditos com Nano Banana 2.1). Confira a imagem e, se não ficou fiel à persona, use **Voltar a pendente** e execute de novo.
2. **Vídeo 1**: Vídeo → Frames 9:16, **Omni 1.1 Flash, 720p, 10s** (configurável no `flow` do item), coloca no Início a imagem mais recente do projeto e preenche. Gere na própria página (usa créditos).
3. **Vídeos seguintes**: a extensão abre o vídeo anterior: o que estiver aberto no editor; senão, o vídeo com o nome gravado no item anterior; senão, o mais recente do projeto. Depois pula para o fim, lê o **último frame** direto do player (nada é baixado), volta ao projeto, envia o frame pelo **Enviar mídia** do Início e preenche o prompt de continuação. Não usa "Estender". No primeiro envio, o Flow mostra o aviso **Direitos de uso desta imagem**: quem clica em **Concordo** é você; a extensão espera.

### Genjutsu (vídeo → vídeo)

Gere a fila com `python -m veo_pipeline genjutsu --modo motion --video-fonte trend.mp4 --preparar-fonte --qtd 1 --out fila_genjutsu.json`. O `--preparar-fonte` cria `trend_mudo.mp4`, sem áudio e com até 10s, porque com áudio o Flow recusa com "Não é possível editar a fala neste vídeo". No popup, **Escolher vídeo fonte e preparar genjutsu** pede o arquivo `_mudo.mp4`. Vídeos com mais de 10s são recusados no próprio popup. A extensão configura Vídeo → Elementos · Omni 1.1 Flash · 720p · 9:16, envia o vídeo pelo "+" → Vídeos, ou reaproveita o que já estiver no projeto com o mesmo nome (aviso "Direitos de uso deste vídeo": você clica em Concordo), anexa a imagem âncora pelo nome, ou a imagem mais recente do projeto, e preenche o prompt. Com vídeo de referência o Flow cobra mais (20 créditos em 2026-10-18); o popup mostra o custo lido do Flow. Use apenas vídeos sobre os quais você tem direitos.

Um passo só roda depois que o item de origem estiver `gerado`. As ações no DOM ficam em `src/flow-actions.js`. O envio do frame usa `src/page-upload.js`, que roda no contexto da página do Flow (só em flow.google.com) e só intercepta o seletor de arquivos quando a extensão o arma, uma vez.

## Contrato de dados

Aceita filas `version: 1` com `persona_id`, `gerado_em` e `itens` no formato do pipeline Python. Tipos: `imagem` e `veo` (`modo: null`) e `genjutsu` (`modo: motion`, `swap_produto` ou `restyle`). Status: `pendente`, `preenchido`, `gerado`, `descartado`. A extensão usa `prompt_final` exatamente como veio do pipeline, sem acrescentar texto. Se ele estiver vazio, usa a persona importada para o fallback descrito acima.

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
