---
name: veo-video-qa
description: Analisa cada vídeo da fila antes de continuar a sequência, usando os frames locais; API de visão é opcional.
---

# QA visual do vídeo

Use esta skill em Claude Code ou outro agente que consiga **abrir imagens**. Ela não exige chave de API. A extração por ffmpeg prepara evidências; a decisão visual é sua. Não aprove um vídeo apenas porque o comando terminou sem erro.

## Para cada item de vídeo, na ordem da fila

1. Execute `python -m veo_pipeline qa extrair --video <mp4> --item-id <ID> --fila <fila.json> --out-dir qa/<ID>/`. Instale `ffmpeg` (ou `imageio-ffmpeg` para o binário) e Pillow se necessário.
2. Leia `qa/<ID>/checklist.json`. **Abra visualmente** `contact_sheet.jpg`, `first.png`, `last.png` e os `frame_*.png` próximos a qualquer dúvida. Leia a persona `bloco_fixo`, look, cena, objetos esperados e quantidade. Para `frame_inicial` do tipo `ultimo_frame:<ID anterior>`, abra o `frame_continuacao` do veredito anterior e compare com `first.png`. Para `item:<ID imagem>`, compare com a imagem desse item. Se a referência não estiver disponível, registre a limitação; não invente continuidade.
3. Confira quadro a quadro onde há ação: objetos duplicados ou que aparecem/somem (especialmente uma segunda mala atrás da personagem), mãos e dedos, rosto em relação à persona, roupa, cenário/luz, física e movimento, texto ou legendas deformados. Verifique também se a ordem temporal faz sentido e se o início do vídeo continua o frame aprovado anterior. Revise especialmente o instante de pegar, puxar, abrir ou soltar objetos. Quadros amostrados podem não revelar erros breves; extraia frames adicionais com ffmpeg se necessário.
4. Escreva **somente** `qa/<ID>/<ID>.verdict.json` com exatamente estas seis chaves (sem comentários ou campos extras):

```json
{
  "item_id": "ID",
  "verdict": "aprovado",
  "motivos": [],
  "frame_continuacao": "qa/ID/last.png",
  "corte_sugerido": null,
  "prompt_correcao": null
}
```

Cada motivo é `{"t": 1.5, "tipo": "objeto_duplicado", "descricao": "..."}`. Tipos permitidos: `objeto_duplicado`, `rosto`, `maos`, `cenario`, `continuidade`, `fisica`, `outro`. Use `outro` para texto/legendas. `t` é em segundos desde o início do clipe.

5. Se o defeito está **só no fim**, aprove com `corte_sugerido: {"inicio": 0, "fim": <segundos antes do erro>}` e escolha `frame_continuacao` como um PNG do último quadro **bom dentro do corte**. Se necessário, extraia esse quadro do vídeo com `ffmpeg -ss <tempo> -i <mp4> -frames:v 1 qa/<ID>/continuacao_boa.png`. Se o defeito está no meio, rejeite, defina `frame_continuacao: null`, `corte_sugerido: null` e forneça `prompt_correcao` concreto para regeneração. Nunca aponte a continuação para um quadro com o defeito.
6. Rode `python -m veo_pipeline qa validar --verdict qa/<ID>/<ID>.verdict.json`. A validação confirma o **formato**, não substitui sua inspeção visual. Só depois da aprovação entregue o `frame_continuacao` ao próximo item como imagem inicial. A montagem exigirá um veredito aprovado para cada vídeo da sequência.

## API opcional

Com `GEMINI_API_KEY` ou `ANTHROPIC_API_KEY` no ambiente, é possível rodar `python -m veo_pipeline qa analisar --api --checklist qa/<ID>/checklist.json`. Revise o veredito gerado visualmente e valide antes de prosseguir. Não exponha chaves em logs ou mensagens. O modo local acima continua funcionando sem API.
