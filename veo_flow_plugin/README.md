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

## Contrato de dados

Aceita filas `version: 1` com `persona_id`, `gerado_em` e `itens` no formato do pipeline Python. Tipos: `veo` (`modo: null`) e `genjutsu` (`modo: motion`, `swap_produto` ou `restyle`). Status: `pendente`, `preenchido`, `gerado`, `descartado`. A extensão usa `prompt_final` exatamente como veio do pipeline, sem acrescentar texto. Se ele estiver vazio, usa a persona importada para o fallback descrito acima.

## Limitações e cuidados

- O DOM do Flow e do Gemini muda. A busca pelo campo usa três estratégias, mas pode precisar de ajuste em `src/field-selection.js` se a interface mudar ou o editor estiver dentro de um iframe não coberto.
- As interfaces de assinatura têm regras próprias e existe uma zona cinzenta nos termos de uso para automações. Por isso, a extensão não clica em **Generate**, não automatiza anexos, não usa APIs internas e não gerencia sessão.
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
