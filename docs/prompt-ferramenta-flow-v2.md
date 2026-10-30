# Prompt v2: Flow Video Creator AI (cenas encadeadas com fala)

> Versão 2 do prompt "Gerador automático de vídeos longos com IA".
> Mudanças em relação à v1: contrato fixo para cada cena, encadeamento último frame → primeiro frame com verificação, áudio e fala com tempo marcado em cada cena, QA obrigatória antes da cena seguinte, montagem que não descarta o áudio nem muda a ordem, e retry com limite.
> O diagnóstico que motivou a v2 está no fim deste arquivo.

---

## COPIE A PARTIR DAQUI

### 0. Papel e regra de ouro

Você vai construir a **Flow Video Creator AI**. A ferramenta transforma um roteiro (e imagens de referência opcionais) em **N cenas curtas geradas uma de cada vez**. Cada cena começa **exatamente** no último frame aprovado da cena anterior, e o resultado é montado num MP4 com a fala preservada.

Regra de ouro: **nenhuma cena começa antes de a anterior estar aprovada.** O pipeline é sequencial e passa por uma porta de qualidade. A ordem e a continuidade são garantidas por dados (ids, ordem, hashes, verificação), nunca por suposição como "o arquivo mais recente".

Não invente identificadores de modelo, endpoints, parâmetros nem preços. Quando um recurso não existe na API ou na interface usada, diga isso na interface e use o modo de fallback definido abaixo. Não simule resultados.

### 1. Validação técnica antes de escrever código

Confirme na documentação oficial e registre num arquivo `capacidades.json`, com a fonte de cada item:

| Pergunta | Campo |
|---|---|
| Qual é o identificador real do modelo (ex.: "Omni 1.1 Flash" no Flow, `veo-3.x-…` na API)? | `modelo` |
| O acesso é por API ou só pela interface do Google Flow? | `canal`: `api` \| `flow_ui` |
| Quais durações por clipe são aceitas (4/6/8/10 s)? | `duracoes_s` |
| O modelo aceita **imagem como primeiro frame** (frames-to-video)? | `aceita_frame_inicial` |
| O modelo aceita **vídeo anterior / extensão nativa**? Com qual sobreposição? | `aceita_extensao`, `sobreposicao_s` |
| O modelo **gera áudio/fala nativa** nesse modo (frame inicial + 720p)? | `audio_nativo` |
| Quantas saídas cada geração produz (1, 2, 4)? Dá para fixar em 1? | `saidas_por_geracao` |
| Quais resoluções, FPS e proporções existem? | `resolucoes`, `fps`, `proporcoes` |
| Qual é o custo por geração (créditos ou US$)? | `custo` (ou `null` + aviso) |

O Google Flow (interface) e a API são canais diferentes. No canal `flow_ui`, o clique em gerar é sempre do usuário, porque o Flow ignora cliques sintéticos. A ferramenta só prepara o passo e acompanha o resultado. Nada de automatizar login.

### 2. Planejamento: roteiro → cenas

1. Interprete o roteiro e extraia personagens, produtos, ambientes, ações e falas.
2. Divida em cenas com `duracao_s` igual a uma das `duracoes_s` permitidas. Padrão: 10 s.
3. Para cada cena, gere **um objeto do contrato da seção 3**. A lista de cenas é a única fonte de verdade da ordem.
4. Mostre ao usuário a tabela de cenas (ordem, ação, fala, duração e custo estimado) e peça confirmação antes de qualquer operação paga.

Regras de divisão:
- Cada cena tem **uma** ação principal. Nada de duas ações que dependam uma da outra dentro dos mesmos 10 s.
- **A fala nunca atravessa o corte.** Uma frase termina dentro da cena em que começou.
- A ação de uma cena termina num **estado de repouso**: pose estável, boca fechada, câmera parada ou em movimento lento constante. Esse estado é o "frame de passagem" da cena seguinte.

### 3. Contrato de cada cena (entrada e saída)

Cada cena é um objeto JSON validado por schema antes de gerar e antes de gravar:

```json
{
  "sequencia_id": "seq_7f3a",
  "cena_id": "seq_7f3a_c02",
  "ordem": 2,
  "total": 3,
  "depende_de": "seq_7f3a_c01",
  "duracao_s": 10,

  "visual": {
    "acao": "ela se aproxima do espelho e mostra a costura lateral do vestido",
    "camera": "plano médio, câmera na mão, leve aproximação contínua",
    "estado_inicial": "igual ao frame_entrada: de pé, de frente, mão esquerda na cintura",
    "estado_final": "parada de frente para o espelho, boca fechada, mãos paradas na lateral do vestido",
    "travas": ["rosto", "cabelo", "vestido vermelho", "iluminação quente da janela à esquerda"]
  },

  "audio": {
    "modo": "nativo",
    "voz": "voz feminina jovem, timbre médio, sotaque paulistano, tom animado e próximo",
    "falas": [
      {"inicio_s": 0.8, "fim_s": 6.8, "texto": "Olha o acabamento dessa costura, é tudo feito à mão."}
    ],
    "pausas": [{"inicio_s": 6.8, "fim_s": 10.0, "tipo": "silencio_ambiente"}],
    "ambiente": "som leve de apartamento, sem música",
    "musica": false
  },

  "frame_entrada": {
    "origem": "ultimo_frame:seq_7f3a_c01",
    "arquivo": "seq_7f3a_c01_last.png",
    "sha256": "<hash do PNG extraído do take aprovado da cena 1>"
  },

  "saida": {
    "take_id": null,
    "video": null,
    "duracao_real_s": null,
    "corte": {"inicio_s": 0, "fim_s": null},
    "frame_saida": {"arquivo": null, "t_s": null, "sha256": null},
    "status": "pendente",
    "tentativas": 0,
    "qa": null
  }
}
```

Regras do contrato:
- `ordem` vai de 1 a `total`, sem buracos nem repetição dentro de uma `sequencia_id`. `depende_de` é a cena `ordem-1` (a cena 1 depende da imagem inicial ou de nada).
- `frame_entrada.sha256` precisa ser **igual** a `frame_saida.sha256` da cena de que ela depende. Se forem diferentes, a geração é bloqueada.
- `status` segue a máquina: `pendente → preparada → gerada → (aprovada | rejeitada)`. A cena rejeitada volta a `preparada`, e `descartada` tira a cena da sequência. Só `aprovada` libera a próxima.
- Cada geração cria um **take** com `take_id` único. Os takes antigos ficam versionados e só o take aprovado entra na montagem.

### 4. Prompt enviado ao modelo (montado a partir do contrato)

O texto é sempre montado na mesma ordem e com os mesmos rótulos. Os blocos fixos são **idênticos, caractere por caractere, em todas as cenas**:

```
[PERSONAGEM — fixo] <descrição travada: idade, pele, cabelo, olhos, marcas>
[LOOK — fixo] <roupa/produto travado>
[CENÁRIO — fixo] <ambiente + luz travados>
[CONTINUIDADE] Continue exatamente a partir da imagem inicial: mesma pessoa, mesma roupa, mesmo cenário, mesma luz, mesma posição de câmera no primeiro instante. Não corte, não mude de plano no início.
[AÇÃO 0–10s] <visual.acao>. Termina em: <visual.estado_final>.
[CÂMERA] <visual.camera>
[ÁUDIO] Voz: <audio.voz>.
  0,0–0,8s: silêncio, só som ambiente.
  0,8–6,8s: ela diz, em português do Brasil, com clareza e sincronia labial: "<texto>"
  6,8–10,0s: silêncio, boca fechada, só som ambiente. Sem música, sem narração extra.
[ESTILO] <estilo>, 9:16, sem texto na tela, sem legendas, sem marca d'água.
```

Regras do bloco de áudio:
- **Limite de palavras por fala**: cerca de 2,3 palavras por segundo em pt-BR. A janela de fala é a duração menos as margens, e a ferramenta recusa e pede para dividir a fala que não couber.
- **Margens**: pelo menos 0,5 s de silêncio no início e 1,0 s no fim de toda cena com fala. Assim o corte não come sílabas e o último frame sai com a boca fechada.
- **Pausa dentro da fala**: escreva como um intervalo próprio (`3,0–3,6s: pausa, ela sorri em silêncio`). Reticências não servem como instrução de pausa.
- A descrição da `voz` é a mesma em todas as cenas.
- Se `audio_nativo = false` no modo usado, gere o vídeo **sem fala** (pedindo "personagem não fala") e produza a fala por TTS com os mesmos tempos, mixando na montagem. Não peça fala a um modo que não gera áudio.
- O `negative_prompt` só vai para o modelo quando o canal tiver esse campo. Se não tiver, converta as restrições em frases positivas dentro do prompt.

### 5. Encadeamento último frame → primeiro frame (com verificação)

Modo padrão: **B (frame inicial)**. Os outros modos só entram quando `capacidades.json` confirmar.

Para gerar a cena *k* (k ≥ 2):
1. Pegue o **take aprovado** da cena *k-1* pelo `take_id`. Nunca use "o vídeo mais recente do projeto" nem "a imagem mais recente".
2. Extraia o frame de passagem com ffmpeg, a partir do **MP4 baixado** (não do canvas do player):
   - sem `corte`: o último frame decodificado (`-sseof -1 … -update 1`);
   - com `corte.fim_s`: o frame em `corte.fim_s - 1/fps`. **O frame de passagem sempre vem de dentro do trecho que vai para a montagem.**
3. Rejeite o frame se ele estiver preto, borrado (variância do Laplaciano abaixo do limite) ou com a boca aberta (marcado pela QA). Nesse caso, recue até 0,5 s procurando o frame estável mais próximo do fim e ajuste `corte.fim_s` para esse ponto.
4. Grave o PNG com o nome `<cena_id_anterior>_last.png` e calcule o `sha256`. Preencha `frame_saida` da cena *k-1* e `frame_entrada` da cena *k*.
5. Envie esse arquivo como frame inicial, em resolução e proporção iguais às do vídeo. No Flow, o arquivo entra no slot "Início" **pelo nome**, com conferência de que o item incluído é esse arquivo.
6. Fixe `saidas_por_geracao = 1` quando o canal permitir. Se o canal gerar mais de uma saída, o usuário escolhe o take explicitamente e a ferramenta registra o `take_id` escolhido.
7. **Verificação depois de gerar:** extraia o primeiro frame da cena *k* e compare com `frame_entrada` (SSIM ou pHash). Se a similaridade ficar abaixo do limiar (padrão SSIM < 0,80), a cena é rejeitada com o motivo `continuidade_entrada`.

Modo A (extensão nativa): só com `aceita_extensao = true`. O trecho já existente devolvido pela extensão é removido pela duração documentada (`sobreposicao_s`) e conferido por comparação de frames. Com clipes de 10 s, "usar os últimos 10 s" significa reenviar o clipe inteiro: não faça isso, use a sobreposição documentada.

Modo C (só referência): sem frame inicial nem extensão. A interface avisa que a continuidade é aproximada e que o corte entre as cenas não fica contínuo.

### 6. QA obrigatória antes da próxima cena

Depois de cada geração, e antes de liberar a cena seguinte:

**Checagens automáticas (bloqueiam a cena):**
- Duração real dentro de ±0,3 s de `duracao_s`; resolução, FPS e proporção esperados.
- **Áudio:** existe stream de áudio quando `audio.modo = nativo`; o volume médio nas janelas de fala fica acima do limiar (`volumedetect`/`silencedetect`); as janelas de silêncio estão realmente quietas.
- **Fala** (quando houver transcrição disponível, ex.: Whisper): o texto transcrito bate com `falas[].texto` (similaridade ≥ 0,8) e cai dentro da janela prevista (±0,7 s).
- **Entrada:** similaridade entre o primeiro frame e `frame_entrada` (seção 5.7).
- **Saída:** o último frame do trecho aproveitado não é preto, não está borrado e mostra a boca fechada.

**Checagem visual** (agente com visão ou pessoa), com frames a 2–4 fps mais o primeiro e o último: rosto, mãos, roupa e produto conforme as `travas`, objetos duplicados, física e cenário.

**Veredito** (`<cena_id>.verdict.json`): `aprovado | rejeitado`, `motivos[] {t, tipo, descricao}` com tipos `rosto | maos | cenario | continuidade_entrada | continuidade | fisica | objeto_duplicado | audio_ausente | fala_errada | fala_cortada | outro`, `corte` opcional, `frame_continuacao` opcional e `prompt_correcao` opcional.

### 7. Falhas e retry

- **Retry automático** no máximo 2 vezes por cena para erros técnicos (rede, timeout, card "Falha", download incompleto), com backoff de 30 s e 120 s.
- **Retry por QA**: no máximo 3 takes por cena. A cada take, aplique `prompt_correcao` (ex.: encurtar a fala, reforçar "boca fechada no fim", reforçar a trava do rosto). Na 3ª rejeição a cena pausa e pede decisão ao usuário: editar a cena, dividir a fala ou aceitar com corte.
- **Nunca reaproveite um frame de passagem antigo.** Se a captura do frame da cena aprovada falhar, apague o frame salvo anteriormente para essa cena e bloqueie a próxima com uma mensagem clara. Continuar com o frame de um take rejeitado está proibido.
- Regenerar uma cena *k* já aprovada **invalida** as cenas *k+1…N*: elas voltam a `pendente`, porque o frame de entrada delas mudou.
- Tudo é retomável: o estado (contrato de todas as cenas) é salvo depois de cada transição. Se a sequência parar na cena 15 de 30, ela continua na 15.
- As operações são idempotentes: gerar a mesma cena com o mesmo `take_id` não cria duplicata.

### 8. Montagem (FFmpeg)

1. Selecione as cenas da `sequencia_id`, **ordenadas por `ordem`**. Recuse a montagem se faltar alguma ordem, se alguma cena não estiver `aprovada` ou se algum `frame_entrada.sha256` for diferente do `frame_saida.sha256` da cena anterior.
2. Para cada take aprovado, aplique o `corte`. Da cena 2 em diante, **descarte o primeiro frame**, que é a cópia do frame de passagem, para não haver quadro duplicado no corte.
3. Normalize o vídeo (H.264, `yuv420p`, mesmo FPS, mesma resolução) e o **áudio** (AAC 48 kHz estéreo). Cena sem stream de áudio recebe uma trilha de silêncio (`anullsrc`) com a duração exata, para o concat não perder nem dessincronizar o áudio. **Nunca use `-an` num clipe com fala.**
4. Concatene. Se houver narração por TTS ou trilha, mixe depois, respeitando os tempos de cada cena.
5. Valide o arquivo final: a duração bate com a soma dos trechos (±0,1 s por cena), existe stream de áudio, o volume não é nulo nas janelas de fala e a ordem confere com a lista de cenas.

### 9. Interface (resumo)

Mantenha a interface simples, em português: imagem de referência (com modo de uso), roteiro, configurações (duração, formato, estilo, áudio, continuidade), botão **GERAR VÍDEO COMPLETO**, painel de progresso e timeline.

Cada cena da timeline mostra: ordem, prévia, primeiro e último frame lado a lado com o último frame da cena anterior, fala com tempos, status, tentativas, motivos da QA e os botões regenerar, editar e aceitar com corte.

O painel avisa quando o modo de continuidade é aproximado (C) e quando o áudio nativo não está disponível.

### 10. Requisitos de aceite

1. Três cenas de 10 s, com fala em cada uma, viram um MP4 de cerca de 30 s com **as três falas audíveis**, na ordem 1 → 2 → 3.
2. Em cada junção, o primeiro frame da cena *k* tem SSIM ≥ 0,80 com o último frame aproveitado da cena *k-1*, e não há quadro duplicado.
3. Regenerar a cena 2 invalida a cena 3 e reutiliza o frame **do novo take** da cena 2.
4. Se a captura do último frame falhar, a geração da próxima cena é bloqueada. Ela nunca usa um frame velho.
5. Interromper e reabrir a ferramenta retoma da primeira cena não aprovada.

## FIM DO PROMPT

---

## Por que a v1 falhava (diagnóstico resumido)

| Sintoma | Causa no prompt v1 | Causa no código atual |
|---|---|---|
| Cenas fora de ordem | Não havia id, ordem nem dependência por cena, só "Cena 1 / Cena 2 / repetir". A seção 11 dizia "Organizar os vídeos" sem critério. | `qa.py:258` monta na ordem do array da fila (não por `ordem` nem `sequencia_id`). `flow-actions.js:107` e `:132` usam "o mais recente do grid" (`options[0]` / `mediaTiles[0]`) como fallback. `pos_producao.py:34` casa os arquivos que sobram pela data de modificação. |
| Áudio ou fala some | "Áudio original gerado pela IA, quando disponível" e "Etapa 7: processar áudio" depois da montagem, sem tempos, sem limite de palavras e sem especificar a voz. | `qa.py:287` reencoda cada trecho com `-an`: **a montagem final não tem áudio nenhum**. `persona.py:43` põe a fala sem tempos nem margens. `luna.json:14` tem a voz vazia. A QA (verdict.schema, SKILL) não checa áudio. |
| Encadeamento falha | "Extrair os últimos dez segundos" com cenas de 10 s equivale ao clipe inteiro. Faltava regra sobre o frame vir do trecho cortado e sobre verificar a entrada. | `content.js:216` pede o frame ao servidor sem `since`. `content.js:142` deixa no storage o frame antigo quando a captura nova falha (risco de encadear a partir de um take rejeitado). `content.js:220` e `flow-actions.js:131` podem abrir outro vídeo. `queue.js:126` só pede outro frame quando há `frame_continuacao`; um `corte_sugerido` sozinho não muda o frame de passagem. |
