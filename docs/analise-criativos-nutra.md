# Análise de criativos nutra: personagens de IA que vendem suplemento via Amazon/e-commerce (EUA)

**Data:** 29/10/2026 · **Base:** `docs/pesquisa-criadores-ia-ugc.md` §1 (16 contas) + 6 contas extras do mesmo tipo · **Uso:** estudo interno, sem republicar o material.

> **Como ler.** Tudo que vem entre aspas em inglês é fala transcrita do áudio (Whisper large-v3 local) ou, quando indicado, transcrita pelo vidIQ. Views são "plays" do vidIQ lidos em 29/10/2026; curtidas, comentários e data vêm do `info.json` do yt-dlp. O que é dedução está marcado como **(inferência)**. Transcrições completas, `.srt` e pranchas de quadros: `pesquisa/nutra/<conta>/`.

---

## 0. Os três achados principais

1. **Elas usam um banco de roteiros compartilhado.** O mesmo texto, palavra por palavra, aparece em contas diferentes, com persona diferente e só o produto trocado (Serene Soursop Bitters, Jupi Hydration, Physician's Choice, Pura Vida Moringa, livro). Exemplos: o roteiro *"You can eat apples, chicken, yogurt, spinach, and it will not clear what has been sitting inside you for years"* está em 8 vídeos de 6 contas (15,3M + 7,8M + 6,9M + 2,4M + 1,3M + 800K…). O bloco *"If your socks leave marks like this, this is lymphatic dysfunction… they spend billions just to keep this from you"* está igual em @askoliviahealth, @health.life.standard e @travisonwellness. Já o esquete *"I'm 108 / 84 / 68 / 55… just three things… Women pay hundreds for facials that do less than this"* aparece em 4 contas. Detalhes na §3. (Que os roteiros venham do programa de criadores das marcas ou de uma agência que opera várias personas é **inferência**; o texto idêntico é fato.)
2. **A estrutura que vende é "receita grátis → *a receita sozinha não basta* → produto".** O vídeo ensina uma receita caseira (limão, chia, cúrcuma, pimenta, canela), dá o mecanismo e um "prova social" (*"People are gonna ask what surgery you had"*). Depois vem a ponte fixa: *"Now don't get me wrong, this recipe does work, but… ain't enough"* / *"The recipe opens the door, but the soursop is what cleans the whole house"*. O produto entra como o que "completa" a receita, e o CTA leva à DM por palavra-chave mais busca na Amazon. Os vídeos com pitch de produto são **longos (mediana de 114 s)** contra 44,5 s dos que não têm pitch, e a mediana de views é igual (122,5K × 132K). A duração de 2 minutos não derruba o alcance nesta amostra.
3. **O gancho de maior alcance é a negação com prop, não o sintoma.** Por soma de views, o gancho "você pode comer/beber X, Y, Z… e não vai limpar o que está aí há anos" lidera (8 vídeos, 34,6M, mediana de 1,85M). Em seguida vêm "Pare de beber [limão/chia]" (mediana de 1,6M) e o "experimento" ("Put cinnamon on a banana and just watch what happens", 15,1M somados). O "sintoma-espelho" (*"If your socks leave marks like this…"*) é o mais **frequente** (12 de 61), mas tem a **menor mediana** (28K). É o formato de volume diário, não o de viralizar. Todos abrem com um **prop físico absurdo nos primeiros 1–2 s** (intestino transparente cheio de lama, estátua de cubos de açúcar, pé protético que esguicha água), e a produção tem cara de IA (§4.6).

---

## 1. Método e amostra

- **Escolha dos vídeos.** A busca de *outliers* do vidIQ (IG + TikTok, desde 01/01/2026, ≥100–300K views, sem agrupar por criador, 4 consultas e 322 resultados, salvos em `pesquisa/nutra/_vidiq_outliers/`) foi somada aos 12 reels mais recentes de cada perfil (`vidiq_ig_profile_reels`). De cada conta entraram os 3–4 de maior alcance visível. **Limite:** nem o vidIQ nem o Instagram sem login listam o perfil inteiro por views, então pode haver vídeos antigos maiores fora da amostra.
- **Download:** `yt-dlp` sem login funcionou para 54 vídeos. Outros 13 devolveram *"Instagram sent an empty media response"* (exigem login), e o vidIQ informou que 2 deles (Db_18weBjk_, DeMvY5KK9BF) **não existem mais** (removidos).
- **Transcrição:** `faster-whisper` 1.2.1, modelo `large-v3`, CUDA fp16 (RTX 3060), em inglês. Para 7 dos vídeos bloqueados, a fala e o visual vieram do `vidiq_watch_shortform_content` (marcados "vidIQ"). Os créditos do vidIQ acabaram e 3 vídeos ficaram sem análise (§6).
- **Visual:** uma prancha de 8 quadros por vídeo (0 s, 0,8 s, 1,6 s, 2,6 s e 4 pontos ao longo do vídeo) em `pesquisa/nutra/_pranchas/`.
- **Total analisado:** **61 vídeos** de 22 contas, com **54 transcritos por Whisper** e 7 pelo vidIQ. Todos têm 1080×1920 e 30 fps nos arquivos baixados. A fala média é de **3,3 palavras/s** (p25 3,0 · p75 3,5; n = 54).

### 1.1 Tabela da amostra

| Conta | Vídeo | Data | Views | Curt. | Coment. | Dur. | Fonte |
|---|---|---|---|---|---|---|---|
| wellnesseverydayhealth | [DdmTSOHp8g1](https://www.instagram.com/reel/DdmTSOHp8g1) | 22/09 | 7,3M | 59.230 | 10.023 | 60 s | Whisper |
| wellnesseverydayhealth | [DdXgRERJwYL](https://www.instagram.com/reel/DdXgRERJwYL) | 16/09 | 2,8M | 47.128 | 15.133 | 134 s | Whisper |
| wellnesseverydayhealth | [DeSemZtpc-O](https://www.instagram.com/reel/DeSemZtpc-O) | 09/10 | 1,6M | 14.481 | 17.373 | 91 s | Whisper |
| mother.satori | [DczShIoB6PJ](https://www.instagram.com/reel/DczShIoB6PJ) | 02/09 | 3,7M | 33.415 | 7.791 | 179 s | Whisper |
| mother.satori | [DdG2PauOmWi](https://www.instagram.com/reel/DdG2PauOmWi) | 10/09 | 1,2M | 3.044 | 375 | 162 s | Whisper |
| mother.satori | [De2e_vqyOX5](https://www.instagram.com/reel/De2e_vqyOX5) | 23/10 | 25,6K | 274 | 26 | 25 s | Whisper |
| mother.satori | [De9_RJkv0Sx](https://www.instagram.com/reel/De9_RJkv0Sx) | 26/10 | 23,3K | 126 | 38 | 133 s | Whisper |
| askoliviahealth | [DbyXpFjKWhh](https://www.instagram.com/reel/DbyXpFjKWhh) | 08/08 | 666K | 2.793 | 463 | 67 s | Whisper |
| askoliviahealth | [DfA8BBLKqr3](https://www.instagram.com/reel/DfA8BBLKqr3) | 27/10 | 50K | 588 | 110 | 27 s | Whisper |
| askoliviahealth | [DfAOwBzqcP-](https://www.instagram.com/reel/DfAOwBzqcP-) | 27/10 | 23,4K | 107 | 48 | 118 s | Whisper |
| natural.solutions.us | [DdInexVpari](https://www.instagram.com/reel/DdInexVpari) | 11/09 | **15,3M** | 206.809 | 8.292 | 68 s | Whisper |
| natural.solutions.us | [DdA6uScpQjf](https://www.instagram.com/reel/DdA6uScpQjf) | 08/09 | 6,9M | 135.773 | 5.028 | 58 s | Whisper |
| natural.solutions.us | [DdFsxXbsAMq](https://www.instagram.com/reel/DdFsxXbsAMq) | 10/09 | 2,4M | 38.248 | 2.180 | 72 s | Whisper |
| natural.solutions.us | [De7w4U1pgq0](https://www.instagram.com/reel/De7w4U1pgq0) | 25/10 | 54,5K | 809 | 65 | 34 s | Whisper |
| amishremedies | [DdPzYqAS5eD](https://www.instagram.com/reel/DdPzYqAS5eD) | 14/09 | 849K | 20.378 | 508 | 30 s | Whisper |
| amishremedies | [DenAPNJStbx](https://www.instagram.com/reel/DenAPNJStbx) | 17/10 | 51,2K | 901 | 40 | 47 s | Whisper |
| amishremedies | [De99aHlyAFt](https://www.instagram.com/reel/De99aHlyAFt) | 26/10 | 50,4K | 1.436 | 57 | 36 s | Whisper |
| amishremedies | [DfC1L7sRzwx](https://www.instagram.com/reel/DfC1L7sRzwx) | 28/10 | 32,6K | 437 | 14 | 140 s | Whisper |
| silas.nativewisdom | [Db32t9_PHLB](https://www.instagram.com/reel/Db32t9_PHLB) | 10/08 | 234K | 437 | 201 | 29 s | Whisper |
| silas.nativewisdom | [De5vc7YRpE7](https://www.instagram.com/reel/De5vc7YRpE7) | 25/10 | 110,7K | 540 | 68 | 84 s | Whisper |
| silas.nativewisdom | [DfAznTsv0uq](https://www.instagram.com/reel/DfAznTsv0uq) | 27/10 | 13,2K | 230 | 92 | 51 s | Whisper |
| ardenremedy | [DcpSjUoT7tb](https://www.instagram.com/reel/DcpSjUoT7tb) | 30/08 | 627K | — | — | 34 s | vidIQ |
| ardenremedy | [Ddm63AiBpPz](https://www.instagram.com/reel/Ddm63AiBpPz) | 22/09 | 67,5K | 198 | 6 | 72 s | Whisper |
| ardenremedy | [Ddkhx_oTSi-](https://www.instagram.com/reel/Ddkhx_oTSi-) | 22/09 | 34,1K | 613 | 666 | 42 s | Whisper |
| jennifersagewellness | [Dbl0uJOpjZR](https://www.instagram.com/reel/Dbl0uJOpjZR) | 03/08 | 133,5K | 1.683 | 216 | 24 s | Whisper |
| jennifersagewellness | [DexFYNkznAA](https://www.instagram.com/reel/DexFYNkznAA) | 21/10 | 66,7K | 2.612 | 3.405 | 53 s | Whisper |
| jennifersagewellness | [De0WPxSMjx8](https://www.instagram.com/reel/De0WPxSMjx8) | 23/10 | 8,1K | 41 | 1 | 73 s | Whisper |
| health.life.standard | [DepboO2PSCb](https://www.instagram.com/reel/DepboO2PSCb) | 18/10 | 122,5K | — | — | 114 s | vidIQ |
| health.life.standard | [De7Go5ivWMm](https://www.instagram.com/reel/De7Go5ivWMm) | 25/10 | 15,5K | 93 | 5 | 120 s | Whisper |
| health.life.standard | [Dez9jzMxm9m](https://www.instagram.com/reel/Dez9jzMxm9m) | 22/10 | 14,6K | 182 | 30 | 113 s | Whisper |
| travisonwellness | [DeZZlPCRxtC](https://www.instagram.com/reel/DeZZlPCRxtC) | n/d | 1,8M | — | — | 99 s | vidIQ |
| travisonwellness | [De90sxdhwtj](https://www.instagram.com/reel/De90sxdhwtj) | 26/10 | 134,4K | — | — | 114 s | vidIQ |
| travisonwellness | [De7fU8sBjpk](https://www.instagram.com/reel/De7fU8sBjpk) | 25/10 | 25K | 344 | 52 | 100 s | Whisper |
| travisonwellness | [DfDneuHBJtH](https://www.instagram.com/reel/DfDneuHBJtH) | 28/10 | 22K | 335 | 30 | 122 s | Whisper |
| thenicosterling | [DceDC2oTssK](https://www.instagram.com/reel/DceDC2oTssK) | 25/08 | 1,7M | 13.779 | 8.232 | 116 s | Whisper |
| thenicosterling | [DcBuERTxRLM](https://www.instagram.com/reel/DcBuERTxRLM) | 14/08 | 104,8K | — | — | 122 s | vidIQ |
| thenicosterling | [Ddwcl_Dz05b](https://www.instagram.com/reel/Ddwcl_Dz05b) | 26/09 | 4,5K | 57 | 1 | 99 s | Whisper |
| thenicosterling | [DdMWrz-xhUA](https://www.instagram.com/reel/DdMWrz-xhUA) | 12/09 | 4,5K | 43 | 5 | 153 s | Whisper |
| loganalexander1960 | [Dcko95Ft8ff](https://www.instagram.com/reel/Dcko95Ft8ff) | 28/08 | 609K | 3.295 | 259 | 132 s | Whisper |
| loganalexander1960 | [DenjWbvtPPh](https://www.instagram.com/reel/DenjWbvtPPh) | 18/10 | 154 | 3 | 0 | 140 s | Whisper |
| loganalexander1960 | [Dep5mKttgTY](https://www.instagram.com/reel/Dep5mKttgTY) | 18/10 | 122 | 6 | 1 | 60 s | Whisper |
| liveliketrav | [DcB2JldyNal](https://www.instagram.com/reel/DcB2JldyNal) | 14/08 | 124,2K | 2.599 | 112 | 134 s | Whisper |
| liveliketrav | [DfFfn6oFNcf](https://www.instagram.com/reel/DfFfn6oFNcf) | 29/10 | 3K | 34 | 0 | 149 s | Whisper |
| liveliketrav | [De8KR-0Dd2i](https://www.instagram.com/reel/De8KR-0Dd2i) | 26/10 | 2,1K | 36 | 0 | 53 s | Whisper |
| malikhealing | [Dbqqos7z4AQ](https://www.instagram.com/reel/Dbqqos7z4AQ) | 05/08 | 322K | 11.364 | 9.332 | 45 s | Whisper |
| malikhealing | [DbghlcbRAVd](https://www.instagram.com/reel/DbghlcbRAVd) | 01/08 | 303K | 11.129 | 4.855 | 62 s | Whisper |
| malikhealing | [De62DmZT6Wg](https://www.instagram.com/reel/De62DmZT6Wg) | 25/10 | 131K | 3.920 | 3.346 | 30 s | Whisper |
| nordic.healing.wisdom | [DaJNWw0FGkV](https://www.instagram.com/reel/DaJNWw0FGkV) | 28/06 | 6,6M | 208.978 | 65.915 | 60 s | Whisper |
| nordic.healing.wisdom | [DaWna6jh_3A](https://www.instagram.com/reel/DaWna6jh_3A) | 04/07 | 2,6M | 61.505 | 22.908 | 86 s | Whisper |
| nordic.healing.wisdom | [Dbn8XVRpVHw](https://www.instagram.com/reel/Dbn8XVRpVHw) | 04/08 | 444,9K | — | — | 65 s | vidIQ |
| nordic.healing.wisdom | [De1S0_iiNlH](https://www.instagram.com/reel/De1S0_iiNlH) | 23/10 | 17,5K | 354 | 273 | 76 s | Whisper |
| rafael.cortez.remedies | [Deagez3h-p-](https://www.instagram.com/reel/Deagez3h-p-) | 13/10 | 3,2M | 57.326 | 2.576 | 32 s | Whisper |
| rafael.cortez.remedies | [De9PqzQAQgD](https://www.instagram.com/reel/De9PqzQAQgD) | 26/10 | 129,7K | 1.159 | 82 | 44 s | Whisper |
| rafael.cortez.remedies | [DfC4-zrjq_E](https://www.instagram.com/reel/DfC4-zrjq_E) | 28/10 | 48,5K | 742 | 62 | 39 s | Whisper |
| rafael.cortez.remedies | [DfAGzF2HSRM](https://www.instagram.com/reel/DfAGzF2HSRM) | 27/10 | 25,3K | 250 | 48 | 112 s | Whisper |
| *extra* brittanymillerhealth | [DdB0D2OR8pe](https://www.instagram.com/reel/DdB0D2OR8pe) | 08/09 | 7,8M | — | — | 105 s | vidIQ |
| *extra* vincent.protocol | [DcUG9lDh10F](https://www.instagram.com/reel/DcUG9lDh10F) | 21/08 | 3,9M | 34.419 | 9.377 | 86 s | Whisper |
| *extra* shen.healings_ | [Dc-BlwbAswb](https://www.instagram.com/reel/Dc-BlwbAswb) | 07/09 | 2,1M | 3.072 | 299 | 54 s | Whisper |
| *extra* papa.elias.roots | [DdvJr0eIuwx](https://www.instagram.com/reel/DdvJr0eIuwx) | 26/09 | 1,5M | 35.404 | 158 | 129 s | Whisper |
| *extra* angela.brookss | [DdXMCNkPvdo](https://www.instagram.com/reel/DdXMCNkPvdo) | 16/09 | 1,3M | 6.473 | 23 | 84 s | Whisper |
| *extra* zhen.chineseremedies | [DdUUG4mBa8J](https://www.instagram.com/reel/DdUUG4mBa8J) | 15/09 | 799,5K | 7.786 | 638 | 45 s | Whisper |

Todas as datas são de 2026. **Por que essas contas extras:** a legenda de cada uma traz `#syntheticperformer` mais parceria de e-commerce. @brittanymillerhealth usa *"Comment 'JUPI' and I'll send the Amazon link"* com `#jupihydrationpartner`; @vincent.protocol, `#jupihydrationp…`; @angela.brookss, `#jupihydrationpartner #ad`; @papa.elias.roots, `linktw.in/lxxfKd` com Serene; @zhen.chineseremedies, *"Ad | Synthetic Perfor…"*; @shen.healings_ manda para o livro em `healthinaflash.com` (legendas lidas no resultado do vidIQ, em `_vidiq_outliers/`).

---

## 2. Decomposição por conta

Cada conta tem um cabeçalho com a **persona** (quem é, por que convence), o **produto/destino** e a **produção** (comum a todos os vídeos dela). Depois vem um bloco por vídeo com o gancho (fala exata de 0–3 s, o que aparece na tela, o texto queimado e o tipo), o roteiro em beats com tempos, o CTA e as observações de produção.

### 2.1 @wellnesseverydayhealth: "Coach Jones | Retired NBA Coach" (IA declarada)
- **Persona:** homem branco de uns 50 anos, barba grisalha, boné de trás para frente, camisa azul-marinho. Diz ter "clientes" e falar "há décadas". O arquétipo é o **técnico/treinador veterano** com autoridade de quem "viu de tudo".
- **Produto:** Serene Herbs Soursop Bitters (Amazon, `#sereneherbspartner #ad`).
- **Produção:** casa de alto padrão (cozinha de mármore, piscina, escada). O prop-chave é um vaso de vidro com "intestino" de terra rachada e legumes, onde ele despeja água com limão e nada acontece. A legenda mistura sans branca e serifa itálica ("Stop *drinking* lemon water"), e no DdXgRERJwYL também aparece o estilo caixa alta com palavra amarela. São de 13 a 16 cortes por vídeo, com um cenário diferente a cada 1–2 frases.

**DdmTSOHp8g1 (7,3M, 60 s)**
- Gancho 0–3,5 s: *"Stop drinking lemon water, it is not enough."* Na tela, ele despeja uma jarra com rodelas de limão sobre o vaso de terra rachada; texto *"Stop drinking lemon water."* Tipo: **contraintuitivo + prop**.
- Beats: 3,5–13,4 negação (*"You can drink lemon water, add apple cider vinegar, fiber powder, anything, and it will not clear what has been sitting inside you for years"*) · 13,4–29,6 receita (limão fervido, chia, cúrcuma, *"a splash or two of soursop bitters"*, pimenta, ferve 10 min e coa) · 29,6–37,1 resultado (*"bloating, gone, gut cleaned right out"*) · 37,1–53,9 produto (*"a blend of rare herbs that went viral for making people have regular bowel movements"*, Amazon e link da bio).
- CTA 53,9–60,3: *"Comment tea, and I will send you the morning recipe straight to your messages, but you must be following me so I can reach you."*

**DdXgRERJwYL (2,8M, 134 s)**
- Gancho 0–4,7 s: *"If your back carries rolls like this and you want it smooth like this"*. Na tela, dois manequins de costas, um com dobras e outro liso; texto em caixa alta com destaque amarelo. Tipo: **sintoma-espelho (antes/depois em prop)**.
- Beats: 4,7–13,3 mais dois espelhos (coxa, queixo) · 13,3–25,7 "inimigo" (*"nobody's gonna tell you this except me… They will tell you to eat less and exercise more"*) · 25,7–39,4 receita (gengibre, pimenta, limão) · 39,4–60,5 mecanismo e prova social (*"People gonna ask what surgery you had, what diet you did, what your secret is"*) · 60,5–76,5 **ponte** (*"this recipe works but… ginger and lemon alone isn't enough"*) · 76,5–114 produto (ingredientes, *"My clients who add this come back telling me…"*, *"The recipe opens the door but the Soursop is what cleans the whole house"*).
- CTA 114–134: Amazon, bio, *"if you're watching on Facebook… link in the caption"* e *"Comment tea"*.

**DeSemZtpc-O (1,6M, 91 s)**
- Gancho: *"Stop drinking lemon water! It is not enough!"*, com o mesmo prop do primeiro vídeo.
- Corpo: a partir de 2,8 s o texto é **idêntico** ao DeZZlPCRxtC de @travisonwellness (negação → *"When your gut has been backed up for years, the lining becomes inflamed"* → receita com soursop → *"people in their 40s, 50s, and beyond"* → produto → CTA tea).

### 2.2 @mother.satori: "US based Holistic Expert" (IA declarada)
- **Persona:** mulher negra idosa (*"I'm 108 years old and I live without doctors"*), turbante, cruz no pescoço, roupas de padrão africano, casa com bandeira dos EUA. O arquétipo é a **avó curandeira centenária**, cuja credibilidade vem da idade e da fé.
- **Produtos:** Jupi Hydration (Amazon `amzn.to`) e Serene Soursop Bitters (`linktwin.co`).
- **Produção:** legenda em caixa alta branca com a palavra-chave em amarelo, de 2 a 3 palavras por vez. Os vídeos de pitch são longos (133–179 s) e abrem com um esquete de outras pessoas.

**DczShIoB6PJ (3,7M, 179 s)**
- Gancho 0–15 s: um casal corre na calçada, ela poda a cerca, e o homem diz *"hey, I'm your new neighbor next door… you look so fine sweetheart"*. Tipo: **esquete/encontro**.
- Beats: 0–37,6 esquete (*"was that your wife running?… I am 108… you're old enough to be my mom"*) · 37,6–44,2 virada (*"what's your secret? — just three foods. Listen up… Save this video"*) · 44,2–63,9 dica 1: limão e água morna · 63,9–87 dica 2: vinagre de maçã com óleo de coco no rosto (*"Women pay hundreds for facials that do less than this"*) · 87–118 dica 3: gengibre com cúrcuma, *"the most important"* · 118–154 produto (*"most of what's on the market is sugar and flavoring… The only one I recommend is Jupi Hydration… they don't mass produce, and they sell out fast"*).
- CTA 154–178: link abaixo, bio, busca na Amazon, Facebook, *"comment [Jupi]… you must be following me first or I cannot send it to you"*.
- Produção: a câmera sai da rua para a sala com o pote Jupi na mão. A persona troca de roupa entre os blocos (prancha).

**DdG2PauOmWi (1,2M, 162 s)**
- Mesmo corpo do anterior com **outro gancho**: numa arena de basquete, uma mulher acima do peso diz *"Give that back to me. Why are you going to embarrass me in front of the whole arena like that?"*, e o marido responde *"Mrs. Satori, right here in the seats next to me…"*.
- De 22 s em diante o texto é idêntico ao DczShIoB6PJ (a partir de 37,6 s). É **troca de gancho sobre o mesmo corpo**.

**De2e_vqyOX5 (25,6K, 25 s)**
- Gancho: *"Never pour out the water from a can of chickpeas."* Tipo: **hack de cozinha**.
- Mousse de aquafaba. CTA *"Comment mousse and follow for more"*, sem produto. O roteiro é o mesmo do De99aHlyAFt (@amishremedies) e do DfA8BBLKqr3 (@askoliviahealth).

**De9_RJkv0Sx (23,3K, 133 s)**
- Gancho: *"If your breath smells like your ass, there's something dangerous going on inside."* Na tela, uma lanterna sobre uma língua de prop encaixada numa prótese de nádegas. Tipo: **choque/medo**.
- Beats: 6–33 agitação social (*"people would always pinch their nose"*) · 33–52 mecanismo (*"gut imbalance… smelly gases… exhaled through your lungs"*) · 52–73 receita com soursop · 73–98 prova · 98–124 produto (*"you must make sure they're third-party tested for purity… The only brand I trust is Serene Herbs"*).
- CTA: tea.

### 2.3 @askoliviahealth: "Olivia Hart" (IA provável)
- **Persona:** mulher asiático-americana de uns 30 anos, atlética, roupa de academia, faixa no cabelo, cozinha branca com bandeira dos EUA e abóboras. A bio vende "220+ lbs at 31", ou seja, o arquétipo **"eu já estive aí"**. Às vezes aparece em dupla com um homem de óculos.
- **Produto:** Pura Vida Moringa (Amazon Attribution).
- **Produção:** legenda serifada itálica (*"If your* socks*"*), pé protético cheio de água furado com agulha e garrafas de silicone. Mistura reels de receita sem produto (crescimento) com reels de pitch.

**DbyXpFjKWhh (666K, 67 s)**
- Gancho 0–6 s: *"This is high cholesterol."* repetido três vezes, enquanto um homem apalpa a gordura das costas de uma mulher e depois os pés. Tipo: **"THIS IS" ×3**.
- Beats: 6–14 *"The best food to fix it? Not garlic, not oats, and it's definitely not fish oil. Let me show you what actually works."* · 14–34 receita (gengibre, limão, mel) · 34–50 produto (*"if you're wondering what this secret powder is… It's called Pura Vida Moringa… I'll leave the Amazon link"*) · 50–62 prova (*"People will ask you what surgery or diet or secret you did. None of that."*).
- CTA: *"Comment flat below and I'll send you the morning routine that… pushes it three times further."*

**DfA8BBLKqr3 (50K, 27 s)**
- Hack *"Did you know if you pour coconut milk into a bowl and whip it…"*. CTA *"Comment yes"*, sem produto.

**DfAOwBzqcP- (23,4K, 118 s)**
- Gancho: *"If your socks leave marks like this, this is lymphatic dysfunction."* com pé protético e agulha. Tipo: **sintoma-espelho ×3** (meia, FUPA, *"hooters"*).
- Beats: 14–17 *"they spend billions just to keep this from you"* · 39–51 receita (canela, sal do Himalaia, limão) · 51–57 mecanismo (*"Cinnamon breaks down what has been sitting and rotting in your liver"*) · 57–69 prova · 69–78 ponte · 78–104 produto (Pura Vida).
- CTA *"Comment LEAF"*. O roteiro é **idêntico** ao De7Go5ivWMm (@health.life.standard) e ao De90sxdhwtj (@travisonwellness), com o produto trocado.

### 2.4 @natural.solutions.us (IA declarada, `#syntheticperfomer` [sic])
- **Persona:** ancião asiático de barba e cabelo brancos e longos, alternando túnica azul tradicional e camiseta "USA", num quintal com bandeira dos EUA. O arquétipo é o **sábio oriental americanizado**, que fala direto com *"If you're from the United States"*.
- **Produto:** livro "200 natural solutions" (`200naturalsolutions.com/…?ref=tana`, segundo a pesquisa base). No vídeo ele diz que o link leva "straight to Amazon".
- **Produção:** legenda caixa alta com palavra amarela. Os props são um intestino transparente cheio de lama, um torso transparente com órgãos feitos de frutas e uma estátua humana de cubos de açúcar. São de 7 a 12 cortes em cerca de 60 s.

**DdInexVpari (15,3M, 68 s) — maior alcance da amostra**
- Gancho 0–9 s: *"You can't eat apples, spinach, chicken, yogurt, and it will not clear what has been sitting inside you for years."* Na tela, ele segura o intestino transparente com lama e joga dentro maçã, frango e espinafre; texto *"YOU CAN'T EAT / APPLES CHICKEN"*. Tipo: **negação + prop**.
- Beats: 9–16 *"Let me show you what actually works."* · 16–28 receita (limão, chia, cúrcuma, pimenta, 10 min) · 28–34 resultado (*"bloating gone, gut cleaned right out"*) · 34–57 oferta (*"This recipe is one of the 200 I know… blood pressure, blood sugar, cholesterol, stress… table of contents is organized by remedy… special discount"*).
- CTA 57–68: *"Comment book… Or to make it easier, just click my profile photo in the bottom left of the screen, and then tap the blue link in my bio. It will take you straight to Amazon."*

**DdA6uScpQjf (6,9M, 58 s)**
- Mesmo roteiro, versão curta.

**DdFsxXbsAMq (2,4M, 72 s)**
- Variante *"you can eat fruit meat vegetables milk anything…"* com *"if you're from the united states"*, mostrando o torso transparente com órgãos de frutas. O CTA cita um site que o Whisper ouviu como "carrera.com" (provável erro de transcrição).

**De7w4U1pgq0 (54,5K, 34 s)**
- Gancho: *"this is what cinnamon does to the sugar in your body"*, com a estátua de cubos de açúcar recebendo canela. Tipo: **experimento/metáfora física**.
- Receita e linha do tempo (*"by day three… day five… after only a week"*). CTA *"comment yes"*.

### 2.5 @amishremedies: "Beiler Mast | Mennonite Amish farmer" (IA provável)
- **Persona:** ancião branco de chapéu de palha, barba sem bigode e suspensórios, numa cozinha de madeira com panelas de ferro e potes de conserva. Ele se apresenta (*"I am Baylor, a Mennonite Amish farmer"*). O arquétipo é a **tradição rural pura, longe da indústria**.
- **Produto:** Beravia Beetroot (Shopify com `sca_ref`). Ele fala "Baravia".
- **Produção:** plano fixo frontal, legenda minúscula branca simples, ritmo lento, poucos cortes. A maioria dos reels é receita/hack sem produto (crescimento).

**DdPzYqAS5eD (849K, 30 s)**
- Gancho: *"Put an ice cube right in your big toe and middle toe."* com um pé apoiado na mesa e o gelo. Tipo: **experimento/truque de reflexologia**.
- Beats: 3–12 mecanismo (*"This point on your foot is connected directly to your back"*) · 12–16 *"No pills, no medicine"* · 16–22 *"We Amish have always known these simple tricks"*.
- CTA: *"Comment yes… and follow me for more natural remedies"*.

**DenAPNJStbx (51,2K, 47 s)**
- Gancho: *"hold a flame to a potato chip. If it burns like a candle, it is loaded with oil"*. Lista de 4 testes de pureza (batata, azeite, xarope de bordo, café). Tipo: **teste/experimento**. CTA yes.

**De99aHlyAFt (50,4K, 36 s)**
- Hack de aquafaba, mesmo roteiro de @mother.satori.

**DfC1L7sRzwx (32,6K, 140 s)**
- Gancho: ele deitado no chão entre pernas reais com marca de meia, dizendo *"If your socks leave marks like this, that's a backed up lymphatic system"*. Tipo: **sintoma-espelho**.
- Beats: 17–35 inimigo (*"your doctor only checks your heart, your blood, your gut, but nobody checks this"*) · 35–59 receita · 59–76 ponte · 76–118 mecanismo do produto (*"beetroot is loaded with nitrates that widen your blood vessels"*) · 119–135 qualidade (*"Most beetroot supplements are low-dosed, filled with harmful ingredients… That's why I recommend Baravia Beetroot"*).
- CTA: *"I left the link attached below and in my profile."*

### 2.6 @silas.nativewisdom: "Native American Elder" (IA declarada nos reels recentes)
- **Persona:** ancião indígena de cabelo grisalho longo, camisa azul bordada e pulseira de turquesa, em cabana rústica com ervas secas penduradas ou em cozinha moderna. O arquétipo é a **sabedoria ancestral**.
- **Produto:** Physician's Choice Fiber (`linktw.in/jcbypn`, `#physicianschoicepartner #affiliate`).
- **Produção:** legenda caixa alta branca com palavra amarela. Os props são um dedão protético gigante com unha amarelada, pernas com marca de meia e cabeças de manequim.

**Db32t9_PHLB (234K, 29 s)**
- Gancho: *"Get your ugly nails ready for sandals this summer."* Ele derrama líquido no dedão protético e a "crosta" sai. Tipo: **experimento + vaidade**.
- CTA: *"comment health… you have to follow me"*, sem produto.

**De5vc7YRpE7 (110,7K, 84 s)**
- Gancho: *"If your socks leave marks like this, and you want it smooth like this"*. Tipo: **sintoma-espelho ×3**.
- Beats: 14–27 inimigo · 27–36 receita · 36–56 ponte (*"ginger and lemon alone cannot undo that… It does not feed the good bacteria"*) · 56–79 produto (*"One scoop of Physician's Choice Fiber every day, pure prebiotic soluble fiber"*).
- CTA: gut, Amazon e Facebook.

**DfAznTsv0uq (13,2K, 51 s)**
- Gancho: *"Boil two whole oranges for one hour."* Bolo de laranja inteira. Tipo: **receita estranha/curiosidade**.
- CTA: *"Comment yes, and I will send you my full gut health routine with the secret for the best results."*

### 2.7 @ardenremedy: "Arden | Chinese Healer" (legenda "ad | synthetic performer | jupihydrationpartner")
- **Persona:** ancião asiático de barba branca longa e óculos, camiseta preta com bandeira dos EUA, em quintal ou varanda, quase sempre com uma "paciente" ao lado. O arquétipo é o **médico chinês tradicional** (*"the Chinese way"*, *"Eastern protocol"*).
- **Produto:** Jupi Hydration (Amazon Attribution).
- **Produção:** legenda caixa alta branca com amarelo. Toca o corpo de outras pessoas (axila, barriga) para mostrar o "sintoma".

**DcpSjUoT7tb (627K, 34 s, vidIQ)**
- Gancho: *"This is what baking soda does to your belly."* Ele despeja bicarbonato Arm & Hammer numa barriga protética de espuma, a espuma transborda, e vem um corte para um torso plano. Tipo: **experimento**.
- Receita, *"Your belly will go down in a way that will shock you"*.
- CTA: *"comment yes… I'll send you something that makes this three times more effective"*. **O produto fica escondido na DM.**

**Ddm63AiBpPz (67,5K, 72 s)**
- Negação *"You can eat apples, chicken, spinach, yogurt…"* com intestino transparente → receita → ponte (*"But here is what most folks never realize… what you just made clears the surface and stops there"*) → Jupi → CTA Jupi.

**Ddkhx_oTSi- (34,1K, 666 comentários, 42 s)**
- *"This is a backed up gut."* três vezes, apertando a axila e a barriga de uma mulher → *"not fiber powder, not yogurt, definitely not probiotic supplement… the Chinese way"* → receita → *"In three days, your belly will drop"*.
- CTA: yes, para o "exact Eastern protocol".

### 2.8 @jennifersagewellness (IA declarada)
- **Persona:** mulher de uns 45 anos, cabelo castanho ondulado, roupa fitness, apartamento de luxo com vista para o mar. Fala com *"LADIES OVER 40"*. O arquétipo é a **amiga que descobriu**, em primeira pessoa.
- **Produto:** Serene Soursop (`linktwin.co/ubnzai`).
- **Produção:** legenda caixa alta com destaque amarelo ou serifa itálica. Usa composição de escala impossível (ela pequena ao fundo atrás de uma tigela gigante de chia) e B-roll 3D de células.

**Dbl0uJOpjZR (133,5K, 24 s)**
- Gancho: *"you will never go back to the gym."* sobre a tigela de chia gigante. Tipo: **promessa**. CTA share + follow.

**DexFYNkznAA (66,7K, 3,4K comentários, 53 s)**
- Gancho: *"Soak your feet in vinegar and salt before bed and watch what happens to your whole body overnight."* Ela, no chão de um banheiro escuro, derrama sal no pé. Tipo: **experimento**.
- Beats: receita 7–16 · mecanismo 16–34 (*"Fungus and bacteria cannot survive in acid… The salt… pulls out the fluid"*) · resultado 34–44.
- CTA: *"Comment the word yes and I'll send you what to drink alongside this. That makes it work 10 times harder."*

**De0WPxSMjx8 (8,1K, 73 s)**
- Gancho: *"If your ankles look like this and you want them looking like this, listen to me closely."*, com câmera baixa entre pernas reais.
- Corpo em **depoimento em 1ª pessoa** (*"I wasn't just puffy… Then a friend told me about something… My bloating went way down"*) → soursop & black seed bitters → *"it does sell out and people have had to wait"*.

### 2.9 @health.life.standard (IA declarada)
- **Persona:** homem negro de uns 45 anos, óculos, boné Bass Pro Shops, camiseta branca, em cabana de madeira. É o **"coach" de linguagem coloquial** (*"ain't no one else sharing this secret but me"*).
- **Produto:** Serene Soursop Bitters.
- **Produção:** o vídeo mais "cortado" da amostra, com 22–24 tomadas em cerca de 2 min e um cenário novo por frase (bancada com manequins de silicone, TV com diagrama, quadro de giz, sofá com uma mulher segurando o frasco). Legenda sans branca com palavra em serifa itálica.

**DepboO2PSCb (122,5K, 114 s, vidIQ)**
- Gancho: *"If your watermelons hang halfway down to your knees, and you want them firm again"*, com manequins de torso feminino. Tipo: **sintoma-espelho ×3**.
- Beats: 13–29 inimigo (*"They will tell you that you need surgery"*) · 29–40 receita · 40–59 mecanismo e prova · 59–68 ponte · 68–101 produto.
- CTA: TEA.

**De7Go5ivWMm (15,5K, 120 s)**
- Roteiro "lymphatic dysfunction" idêntico ao de @askoliviahealth, com Serene. Ele fura com agulha um pé protético que esguicha água.

**Dez9jzMxm9m (14,6K, 113 s)**
- O DepboO2PSCb com outro rótulo: *"this is a sluggish thyroid"*.

### 2.10 @travisonwellness (IA declarada)
- **Persona:** homem negro de uns 40 anos, dreads, boné do Dallas Cowboys, regata branca, quintal com piscina e decoração de Halloween. O arquétipo é o **coach de bairro**.
- **Produto:** Serene Soursop Bitters.
- **Produção:** legenda serifada itálica com sans. Os props são uma cabeça protética "bebendo" chia com um corpo de sacos plásticos cheios de comida, um pé de silicone que esguicha e um quadro "NORMAL LYMPHATIC SYSTEM vs IMPAIRED DRAINAGE" apontado com uma mão de esqueleto.

**DeZZlPCRxtC (1,8M, 99 s, vidIQ)**
- Gancho: *"If your socks leave marks like this, that's a backed-up gut."* Agachado atrás de pernas reais, aponta com um bastão de madeira.
- Corpo: negação → inflamação → receita com soursop → produto. CTA tea.

**De90sxdhwtj (134,4K, 114 s, vidIQ)**
- Gancho de **reação**: mulher no carro, com o vídeo dele no canto, diz *"I don't know who this man is, but I would fly him to Cancun and rub his feet because I tightened right up after following his advice. Just watch."* (0–8 s).
- Depois vem o roteiro lymphatic padrão.

**De7fU8sBjpk (25K, 100 s)**
- Gancho: *"Stop drinking chia seeds! Don't drink lemon water, and prune juice definitely isn't gonna work."* Tipo: **contraintuitivo**.
- Receita de maçã com canela e soursop → aviso (*"Don't just grab any random bottle of soursop. Most are full of fillers… gritty sludge"*) → produto.
- CTA: share + tea.

**DfDneuHBJtH (22K, 122 s)**
- *"If your socks leave marks like this, this is water retention."* Mesma família, rótulo novo.

### 2.11 @thenicosterling: "Longevity Coach" (IA declarada)
- **Persona:** homem de uns 50 anos, grisalho, galã, relógio dourado, em escritório com diplomas, cozinha de luxo, galeria de arte ou aeroporto. O arquétipo é o **coach de longevidade de elite**, que mostra status e não tradição.
- **Produto:** Physician's Choice Probiotics (`amzn.to`, `linktw.in`).
- **Produção:** legenda caixa alta com palavra amarela. Mostra sintomas em corpos de outras pessoas e usa formato de entrevista de rua.

**DceDC2oTssK (1,7M, 116 s)**
- Gancho: *"This is sugar damage."* três vezes, apertando a gordura das costas de uma mulher. Tipo: **"THIS IS" ×3**.
- Beats: 6–13 *"Not cutting carbs, not drinking more water, and it's definitely not willpower."* · 13–26 receita (cúrcuma, gengibre, caiena, limão) · 26–50 mecanismo e resultado · 50–72 ponte (*"the good bacteria in your gut have been wiped out… most people won't make this every single morning. You and I both know that."*) · 72–97 produto (*"One capsule every morning. 30 seconds and you're done."*).
- CTA: flat.

**DcBuERTxRLM (104,8K, 122 s, vidIQ)**
- *"This is insulin resistance."* três vezes. Mesma estrutura.

**Ddwcl_Dz05b (4,5K, 99 s)**
- Negação com intestino transparente. É **o texto do DdB0D2OR8pe (@brittanymillerhealth, Jupi) com Physician's Choice no lugar** (*"It's the black bottle with the white label"*).

**DdMWrz-xhUA (4,5K, 153 s)**
- Entrevista de rua numa galeria: *"Your wife actually lets you out looking this good?"* → *"I'm 68"* → *"Three things"* → probiótico. É o roteiro de "3 coisas" de @mother.satori.

### 2.12 @loganalexander1960 (IA declarada)
- **Persona:** homem de uns 65 anos, óculos, boné Bass Pro, magro, às vezes sem camisa, em Costco, praia ou Central Park. O arquétipo é o **veterano "praticante há 20–25 anos"**.
- **Produto:** Jupi Hydration.
- **Produção:** legenda caixa alta branca pequena.

**Dcko95Ft8ff (609K, 132 s)**
- Gancho: *"Listen to what he said on this podcast before someone tries to silence him"*. Em tela dividida, uma mulher reagindo aponta para um clipe P&B de "podcast" com ele de headset; texto vermelho *"Do you have these symptoms?"*. Tipo: **autoridade + censura**.
- Beats: 4–11 *"the industry does everything possible to keep them quiet"* · 11–46 três ingredientes com mecanismo · 46–62 *"getting all three in real quality from a supermarket is almost impossible"* · 62–79 autoridade (*"in over 25 years of working with clients… I wouldn't sit on a podcast this big"*) · 79–108 produto · 108–132 escassez (*"It sells out within hours"*).
- CTA: *"comment the word detox"*.

**DenjWbvtPPh (154 plays, 140 s)**
- Esquete na praia, *"Babe, is there any way you can start losing a few pounds?"* → *"84, honey"* → 3 coisas → Jupi.

**Dep5mKttgTY (122 plays, 60 s)**
- Gancho: *"Here's how to know if you've been eating lab-grown beef or real beef."* no Costco, com carne moída. *"Doctors aren't allowed to share this"*.
- 52–54: *"I cannot name it here or this video would be taken down. So comment the word detox."* É a **evidência textual de que o produto vai para a DM para escapar da moderação** (o motivo é dito pelo próprio vídeo).

### 2.13 @liveliketrav (IA declarada nos reels recentes)
- **Persona:** homem de uns 35 anos, cabelo escuro bagunçado, fone com fio, camiseta cinza, em cozinha clara, supermercado ou apartamento em NY à noite. O arquétipo é o **"health expert" jovem de cidade**.
- **Produto:** Serene Soursop.

**DcB2JldyNal (124,2K, 134 s)**
- Gancho em dois tempos: (1) close de alimentos com o texto *"Quit eating this deadly food unless you want to PASS before you're 60 🚨"*; (2) âncora de **telejornal falso**: *"Breaking news in New York. A video is going viral after a health expert exposed the one food that has been silently poisoning patients for years. Just watch."*
- Beats: 8–53 vilão revelado aos poucos (*"not sugar, not gluten… it's any kind of dairy"*) · 53–82 mecanismo linfático · 82–90 prova · 90–109 qualidade e produto (*"100% pure and tested by independent labs right here in the US"*) · 109–124 escassez.
- CTA: cleanse.

**DfFfn6oFNcf (3K, 149 s)**
- Esquete no supermercado (*"Babe, do we still need eggs?"*) → *"I am 55, but I look 38"* → 3 coisas (mesmo texto de @mother.satori) → Serene, mais o gancho sazonal *"the holidays are coming"*.

**De8KR-0Dd2i (2,1K, 53 s)**
- *"This is what your liver looks like before this drink, and this is what it looks like after."* com dois fígados de prop em bandejas e luva azul. Depois receita e Serene.

### 2.14 @malikhealing (`#sereneherbspartner #affiliate`; `#syntheticperformer` nos posts Nello)
- **Persona:** homem negro de uns 40 anos, musculoso e tatuado, sem camisa, dreads, correntes de ouro, apartamento alto com vista. Diz ter 60 (*"I'm 60, but I look 28"*). O arquétipo é o **"anti-sistema"** (*"a healed patient is a lost customer"*).
- **Produtos:** Serene e Nello Superbalance; guia próprio de 25 receitas.
- **Produção:** legenda caixa alta com palavra amarela, plano médio, poucos cortes.

**Dbqqos7z4AQ (322K, 9,3K comentários, 45 s)**
- Gancho: *"Pour apple cider vinegar on baking soda and just watch what happens."* Tipo: **experimento**.
- Beats: 5–16 inimigo (*"Doctors don't want you to know this… customers, not patients… But I care about y'all"*) · 16–31 receita · 31–36 *"No pill, no purple capsule, no $300 doctor's appointment"*.
- CTA: HEAL, para o protocolo.

**DbghlcbRAVd (303K, 62 s)**
- *"This is high blood sugar."* três vezes, apontando para pernas com manchas → *"isn't beet juice, it ain't green tea, and it sure as hell not more water. Let me tell you what your doctor is hiding from you"* → receita → *"a healed patient is a lost customer"*.
- CTA: heal, para o *"secret ingredient… three times faster"*.

**De62DmZT6Wg (131K, 30 s)**
- *"I'm 60, but I look 28 because of this trick right here."* Uma salada → *"one of 25 recipes in my homemade healing remedies guide"*. CTA heal.

### 2.15 @nordic.healing.wisdom: "Astrid and Erik" (`#syntheticperformer`, `#rosabellapartner`)
- **Persona:** casal nórdico de uns 45 anos. Ele tem tranças, barba e colar de martelo de Thor; ela é loira de tranças. Cozinha escandinava com bandeiras dos EUA e da Noruega. O arquétipo é a **tradição do Norte**, e o casal traz credibilidade de família (*"passed down through our family for generations"*).
- **Produtos:** livro "The Forgotten Norse" (45 remédios), Rosabella e colostro.
- **Produção:** legenda minúscula branca simples, close frontal com os dois no quadro.

**DaJNWw0FGkV (6,6M, 209K curtidas, 65,9K comentários, 60 s, fixado)**
- Gancho: *"Put cinnamon on a banana and just watch what happens."* Em close, ela morde a banana enquanto ele despeja canela. Tipo: **experimento**.
- Beats: 4–21 inimigo (*"In the United States of America, the pharmaceutical industry makes over $500 billion a year… Pharmacies don't like this because half their customers would disappear overnight"*) · 21–39 receita (batida) · 41–49 benefícios (*"calms inflammation, detoxes your liver, and keeps your blood sugar in check"*).
- CTA 49–60: *"Comment yes… share this to someone… Follow us"*.

**DaWna6jh_3A (2,6M, 86 s)**
- *"Put turmeric on a boiled egg and just watch what happens."* com o mesmo esqueleto. De 59 a 80 s, oferta do livro (*"We put all 45 of them… into one book. It is called The Forgotten Norse"*). CTA link ou *"comment remedy"*.

**Dbn8XVRpVHw (444,9K, 65 s, vidIQ)**
- *"This is what baking soda does to your belly."* Ele, sem camisa, no estacionamento do Walmart, despeja bicarbonato numa massa amarela de "gordura". CTA TEA, para o protocolo.

**De1S0_iiNlH (17,5K, 76 s)**
- Sintoma-espelho com negação e receita → *"Eric and I have put together a complete healing Bible"*. Bordão: *"Stay safe and stay healthy, folks."*

### 2.16 @rafael.cortez.remedies (IA declarada, `#marvellapartner`)
- **Persona:** homem latino de uns 50 anos, cabelo preto ondulado e longo, polo preta, cozinha branca com bandeira dos EUA. Usa o vínculo emocional *"You spend on everyone in your house before you spend a dollar on yourself. This one is for you."*
- **Produtos:** livro "Ancient Remedies Bible" (53 remédios) e Marvella Amla (Amazon).
- **Produção:** legenda serifada itálica nas receitas e caixa azul nos de choque. Props: estátua humana de cubos de açúcar, nádegas protéticas com "vermes" e B-roll 3D de parasitas.

**Deagez3h-p- (3,2M, 32 s)**
- Gancho: *"This is what cinnamon does to the sugar in your body."* Ele polvilha canela numa estátua humana de cubos de açúcar sentada. Tipo: **experimento/metáfora física**.
- Beats: 5–13 receita · 13–19 resultado · 19–24 *"Nobody can patent cinnamon, lemon, or honey, so nobody spends millions telling you about them."* (inimigo econômico).
- CTA 24–32: livro e *"Comment book"*.

**De9PqzQAQgD (129,7K, 44 s)**
- Frango empanado em parmesão (hack) → bordão emocional → livro.

**DfC4-zrjq_E (48,5K, 39 s)**
- Gancho: *"Nobody is going to tell you this because your dentist never wants you to find out."* Selfie com uma mulher de dentes amarelados. Receita clareadora → livro.

**DfAGzF2HSRM (25,3K, 112 s)**
- Gancho: *"Clean your anus in just one night and you do not need a diet or a doctor for this."* Tipo: **choque**.
- Beats: 5–51 checklist de sintomas que viram "parasitas" · 51–84 mecanismo (*"20 times the vitamin C of an orange"*) · 84–99 *"It is called amla… The only one I trust is Marvella Amla"*.
- CTA: *"Just comment yes"*.

### 2.17 Contas extras

**@brittanymillerhealth, DdB0D2OR8pe (7,8M, 105 s, vidIQ)**
- Mulher loira de uns 50 anos, vestido branco, varanda.
- Negação com intestino transparente → receita → *"girl, your gut is trying to tell you something… this is the part that, like, takes the whole thing up ten notches. Add one scoop of Jupi Hydration"* → *"you're not standing in your kitchen measuring some crazy 12-ingredient gut drink every morning"*.
- CTA: Jupi, para o link da Amazon na DM.

**@angela.brookss, DdXMCNkPvdo (1,3M, 84 s)**
- Mesmo texto, outra persona (mulher de cabelo cacheado, varanda tropical).

**@vincent.protocol, DcUG9lDh10F (3,9M, 86 s)**
- Homem de uns 55 anos, óculos, estúdio com potes. *"This is sugar damage"* três vezes, quase idêntico ao DceDC2oTssK de @thenicosterling até 50 s.
- Ponte de conveniência: *"buying all of this separately every week is expensive. Measuring it out every morning is annoying. And nobody actually sticks with it… That is why I give my clients Jupi Hydration from Amazon. Same ingredients. Right doses."*

**@papa.elias.roots, DdvJr0eIuwx (1,5M, 129 s)**
- Esquete-novela num hotel art déco em Miami, com 36 cortes. O marido humilha a esposa na piscina (*"Bro, that's your wife? The fat one?"*). Uma desconhecida conta *"My husband left me for a skinny younger woman… The only thing that helped me is this holistic healer"*.
- A curandeira, mulher negra idosa de turbante colorido numa cabana com bandeira, diz *"That's not fat, honey. Fat doesn't come and go in a day"* e explica o mecanismo (*"Past 40, your stomach makes less of the juices"*). Em seguida, *"If it's not bitter, it's not working"* → Serene.

**@shen.healings_, Dc-BlwbAswb (2,1M, 54 s)**
- Ancião asiático de túnica branca numa botica.
- Gancho: *"Did you know that this simple drink has been traditionally used as part of a full-body parasite cleanse for generations"*, sobre uma perna protética cheia de buracos (imagem de tripofobia) recebendo o chá. Tipo: **segredo antigo + choque visual**.
- Depois: *"In China, we have known for generations…"*. CTA yes (*"if you are from the United States"*).

**@zhen.chineseremedies, DdUUG4mBa8J (799,5K, 45 s)**
- Negação → receita → *"But this clears what is sitting there today. It does not stop it building right back up again."*
- CTA detox, com o produto na DM.

---

## 3. O banco de roteiros compartilhado (fato: texto igual em contas diferentes)

| Roteiro | Linha-assinatura (transcrita) | Onde aparece (conta → produto) |
|---|---|---|
| **R1 Negação "apples/chicken"** | *"You can eat apples, chicken, yogurt, spinach, and it will not clear what has been sitting inside you for years. Let me show you what actually works."* + receita limão/chia/cúrcuma/pimenta/10 min | natural.solutions.us DdInexVpari 15,3M, DdA6uScpQjf 6,9M, DdFsxXbsAMq 2,4M → livro · brittanymillerhealth 7,8M → Jupi · angela.brookss 1,3M → Jupi · zhen.chineseremedies 800K → DM · ardenremedy Ddm63AiBpPz → Jupi · thenicosterling Ddwcl_Dz05b → Physician's Choice |
| **R1b "Stop drinking lemon water"** | *"Stop drinking lemon water… You can drink lemon water, apple cider vinegar, fiber powder, anything, and it will not clear…"* + *"When your gut has been backed up for years, the lining becomes inflamed"* | wellnesseverydayhealth DdmTSOHp8g1 7,3M, DeSemZtpc-O 1,6M · travisonwellness DeZZlPCRxtC 1,8M · nordic De1S0_iiNlH → todos Serene/livro |
| **R2 Sintoma-espelho "lymphatic"** | *"If your socks leave marks like this, this is lymphatic dysfunction… Listen closely because they spend billions just to keep this from you… Cinnamon breaks down what has been sitting and rotting in your liver… Now don't get me wrong, this recipe does work, but… ain't enough"* | askoliviahealth DfAOwBzqcP- → Pura Vida · health.life.standard De7Go5ivWMm → Serene · travisonwellness De90sxdhwtj → Serene. Variantes com rótulo trocado: "watermelons/FUPA/cellulite" (DepboO2PSCb, Dez9jzMxm9m "sluggish thyroid"), "water retention" (DfDneuHBJtH), "backed-up gut" (DeZZlPCRxtC), "backed up lymphatic system" (amish DfC1L7sRzwx → beterraba), "smooth like this" (silas De5vc7YRpE7 → fibra; wellness DdXgRERJwYL) |
| **R3 "THIS IS ×3"** | *"This is [sugar damage / high cholesterol / insulin resistance / high blood sugar / a backed up gut]" ×3 → "The best [food/thing] to fix it? Not X, not Y, and it's definitely not Z. Let me show you what actually works."* | thenicosterling DceDC2oTssK 1,7M e DcBuERTxRLM · vincent.protocol 3,9M (quase idêntico ao da Nico) · askoliviahealth 666K · malikhealing 303K · ardenremedy Ddkhx_oTSi- |
| **R4 Esquete "3 coisas"** | *"[elogio/provocação] → How old are you? — [108/84/68/55] → What's your secret? — Just three [foods/things]… Save this video… Number one, lemon juice and warm water… Number two, apple cider vinegar and coconut oil [no rosto]… Women/People pay hundreds for facials that do less than this. But here's what most people miss… That's why this third one is the most important."* | mother.satori DczShIoB6PJ 3,7M e DdG2PauOmWi 1,2M → Jupi · liveliketrav DfFfn6oFNcf → Serene · loganalexander1960 DenjWbvtPPh → Jupi · thenicosterling DdMWrz-xhUA → Physician's Choice |
| **R5 Experimento** | *"Put [cinnamon/turmeric] on a [banana/boiled egg] and just watch what happens."* / *"This is what [cinnamon/baking soda] does to [the sugar in your body / your belly]."* | nordic 6,6M e 2,6M · rafael 3,2M · ardenremedy 627K · nordic Dbn8XVRpVHw 445K · malikhealing 322K · natural.solutions De7w4U1pgq0 · (fora da amostra: hua_jin123 1,0M, carter.remedies 1,1M, eleanor.nell.whit 540K com o mesmo gancho, segundo os outliers do vidIQ) |
| **R6 Hack aquafaba** | *"Never pour out the water from a can of chickpeas… whip it… chocolate mousse with no eggs and no cream"* | mother.satori, amishremedies, askoliviahealth (variante leite de coco) |
| **R7 Ponte "receita não basta"** | *"The recipe opens the door, but the [soursop/beetroot] is what cleans the whole house."* · *"most people won't make this every single morning. You and I both know that."* · *"you're not standing in your kitchen measuring some crazy 12-ingredient gut drink"* | wellnesseverydayhealth, amishremedies, travisonwellness, thenicosterling, vincent.protocol, brittanymillerhealth, angela.brookss |

**Frases de CTA iguais em quase todas:** *"Comment [PALAVRA] and I'll send you the [exact morning recipe / protocol] straight to your messages, but you must be following me so I can [reach/message] you."* Com isso, o comentário vira gatilho de DM automática **(inferência: uma ferramenta tipo ManyChat; a exigência de "follow" bate com a regra de DM de contas não seguidas)**. Somam-se *"search [marca] on Amazon"*, *"click my profile photo… tap the blue link in my bio"* e, em 12 vídeos, *"if you're watching on Facebook, the link is in the description"* (os vídeos são postados também no Facebook).

---

## 4. Síntese

### 4.1 Ganchos: frequência e alcance (61 vídeos)

| Tipo de gancho | Nº | Soma de views | Mediana | Maior | Exemplo |
|---|---|---|---|---|---|
| **Negação "você pode comer/beber X… não limpa"** | 8 | 34,6M | **1,85M** | 15,3M | DdInexVpari |
| **"Pare de beber [hábito saudável]"** | 3 | 8,9M | 1,6M | 7,3M | DdmTSOHp8g1 |
| Esquete/encontro/reação | 6 | 6,4M | 602K | 3,7M | DczShIoB6PJ |
| "THIS IS [condição]" ×3 | 6 | 6,7M | 485K | 3,9M | DcUG9lDh10F |
| Experimento ("put X on Y and watch") | 12 | 15,1M | 384K | 6,6M | DaJNWw0FGkV |
| Promessa/idade ("I'm 60 but I look 28") | 2 | 0,3M | 132K | 131K | De62DmZT6Wg |
| Hack de cozinha (sem produto) | 5 | 0,3M | 50K | 130K | De99aHlyAFt |
| Segredo/medo/censura | 7 | 2,9M | 48K | 2,1M | Dc-BlwbAswb |
| Sintoma-espelho ("if your socks leave marks like this") | 12 | 5,1M | 28K | 2,8M | DdXgRERJwYL |

A amostra não é aleatória (§1). A comparação vale como sinal, não como teste.

### 4.2 Arquétipos de persona que aparecem (e de onde vem a credibilidade)

1. **Ancião de tradição étnica ou religiosa:** asiático (5 contas), indígena, amish/menonita, avó negra "de 108 anos", casal nórdico. A credibilidade vem da idade e da linhagem (*"We Amish have always known"*, *"In China, we have known for generations"*, *"passed down through our family"*) e da oposição à indústria. Concentra os maiores alcances (15,3M, 6,6M, 3,7M).
2. **Coach/treinador de meia-idade com "clientes":** Coach Jones, Travis, o do boné Bass Pro, Malik, Nico Sterling, Vincent. A credibilidade vem de um físico conservado mais uma "prática" (*"my clients come back telling me"*, *"in over 20 years of practice"*). O uso de um boné de marca americana (Bass Pro, Dallas Cowboys) como sinal de origem aparece em 3 contas (@health.life.standard, @loganalexander1960, @travisonwellness).
3. **Mulher "que já esteve lá" ou amiga:** Olivia (bio "220+ lbs at 31"), Jennifer (*"LADIES OVER 40"*), Brittany (*"girl…"*). A credibilidade vem da identificação e do depoimento em primeira pessoa.
4. **Sinal "americano" em quase todos:** bandeira dos EUA no cenário (natural.solutions, arden, mother.satori, olivia, nordic, shen, zhen, rafael), camiseta "USA", fachadas de Costco, Target e Walmart, falas *"If you're from the United States"*, hashtags `#usa`. **(Inferência:** é segmentação deliberada para o público americano, porque a Amazon e o programa de afiliados são dos EUA.)

### 4.3 Estruturas de roteiro reutilizáveis (com tempos típicos)

- **E1 "Receita → ponte → produto" (60–140 s, a mais comum com pitch):** gancho de 0–5 s → negação/inimigo de 5–15 s → *"Let me show you what actually works"* → receita de 15–40 s → mecanismo e prova social (*"People are gonna ask what surgery you had"*) de 40–60 s → ponte (*"this recipe works, but…"*) de 60–75 s → produto (ingredientes, qualidade, *"third-party tested, made in the USA"*, *"sells out"*) de 75–110 s → CTA duplo (Amazon/bio/Facebook + palavra-chave na DM) nos últimos 10–15 s.
- **E2 "Experimento curto → DM" (30–60 s):** experimento no prop de 0–4 s → inimigo (*"Pharmacies don't like this"*) → receita → benefícios → CTA de palavra-chave que promete *"something that makes this three times more effective"*. O produto não aparece no vídeo; vai para a DM.
- **E3 "Esquete → 3 coisas → produto" (130–180 s):** esquete de 0–40 s → *"what's your secret? Just three things. Save this video"* → dicas 1 e 2 (grátis) → *"the third one is the most important"* → produto. Permite **trocar só o esquete** e manter o corpo (mother.satori).
- **E4 "Notícia ou podcast falso" (130 s):** moldura de *"breaking news"* ou *"before someone silences him"* → vilão revelado aos poucos → mecanismo → produto → escassez.
- **E5 "Hack de receita → livro/guia" (25–45 s):** hack culinário → *"This is one of 53/200/25 recipes in my [book]"* → *"Comment book"*. Serve para ganhar seguidores e vender o produto de entrada.

### 4.4 Mecanismos e ângulos de produto

- **Acúmulo/entupimento:** *"what has been sitting inside you for years"*, *"sitting and rotting in your liver"*, *"backed-up gut"*. Aparece em 30 dos 61 vídeos (busca por "sitting / backed up / rotting / buildup / stagnant" nas transcrições) e é o ângulo central.
- **Rótulo novo para um sintoma comum:** a marca da meia vira "lymphatic dysfunction", "water retention", "backed up gut" ou "sluggish thyroid". O mesmo visual recebe rótulos diferentes em vídeos diferentes.
- **Inimigo:** a indústria farmacêutica e os médicos (*"a healed patient is a lost customer"*, *"Nobody can patent cinnamon"*, *"they spend billions just to keep this from you"*).
- **Qualidade e escassez para justificar a marca:** *"most are low-dosed/full of fillers"*, *"third-party tested, made in the USA"*, *"they don't mass produce and they sell out fast"*.
- **Conveniência:** *"Same ingredients. Right doses… 30 seconds and you're done"*. O produto é a versão "pronta" da receita.

### 4.5 CTAs

- **Palavras-chave usadas:** TEA/T, JUPI, FLAT, GUT, FIBER, HEAL, BOOK, REMEDY, YES, DETOX, LEAF, CLEANSE, GLOW, HEALTH, mousse.
- **Destinos:** Amazon (Serene, Jupi, Physician's Choice, Pura Vida, Marvella), Shopify com afiliado (Beravia, 200naturalsolutions), livros próprios (Ancient Remedies Bible, The Forgotten Norse, healthinaflash).
- **Mecânica:** "comment + follow" seguido de DM com link. Bio em `linktw.in`/`linktwin.co`. Cross-post no Facebook com o link na descrição.

### 4.6 Como parecem ter sido produzidos (pipeline provável)

| Elemento | Observado (fato) | Leitura (grau de certeza) |
|---|---|---|
| Persona gerada | 19 das 22 contas usam `#syntheticperformer` (ou "synthetic performer") em alguma legenda vista; @shen.healings_ tem a legenda truncada em "#sy…"; @askoliviahealth e @amishremedies não mostraram divulgação | **Alta** para estas, porque é autodeclarado |
| Consistência de persona entre cenários | A mesma pessoa e a mesma roupa aparecem em 10–24 cenários num vídeo (health.life.standard: 22–24 tomadas em 2 min) | **Média-alta**: geração por cena a partir de imagem de referência do personagem (ex.: *ingredients/frames-to-video*) |
| Props | Intestino transparente com lama que "desentope", estátua de cubos de açúcar, pé de silicone que esguicha, fígados em bandeja, perna com buracos, escala impossível (Jennifer atrás de uma tigela gigante) | **Média-alta**: gerados em vídeo (a física é de demonstração, não de experimento real) |
| Duração das tomadas | Num caso medido (DdG2PauOmWi, limiar de cena 0,12) há cortes em sequência a cada ~7 s (38,2 → 45,3 → 52,4 → 59,4 s). A detecção automática perdeu muitos cortes nos demais | **Baixa**: compatível com clipes de ~8 s aparados, mas não comprovado |
| Fala | Contínua por cima dos cortes, 3,3 palavras/s, sotaques e gírias (*"ain't"*, *"y'all"*, *"girl"*) | **Indeterminado** se é áudio nativo do gerador ou TTS (tipo ElevenLabs) com lip-sync. A imprensa relatou operações do gênero com Veo 3, HeyGen e ElevenLabs ([404 Media](https://www.404media.co/inside-an-ai-tiktok-shop-slop-factory-that-shills-supplements-recalled-by-the-fda/)) |
| Legendas | Palavra a palavra, em 4 estilos (caixa alta com palavra amarela; sans com serifa itálica; minúscula simples; caixa com destaque azul) | **Alta**: legenda automática de editor (tipo CapCut/Submagic), aplicada na pós |
| Sazonalidade | Decoração de Halloween em contas diferentes nos vídeos de 25–29/10, e *"the holidays are coming"* | **Alta**: prompts atualizados com a estação |
| Metadados do arquivo | Só `Lavf63.1.100` / `VPC Coding` (recodificado pela plataforma) | A ferramenta de geração não é identificável pelo arquivo |

**Pipeline provável (inferência):** banco de roteiros com troca de produto → imagem-âncora da persona → uma cena por frase (4–8 s), com cenário e prop novos a cada cena → voz (nativa ou TTS) → montagem com corte seco por frase → legenda palavra a palavra → postagem no IG + FB → DM automática pela palavra-chave → link de afiliado na Amazon.

### 4.7 Compliance: o que precisamos seguir (e o que a amostra viola)

1. **Divulgação de performer sintético (NY):** a GBL §396-b exige que o anunciante com conhecimento do uso de um "synthetic performer" divulgue isso **de forma conspícua no anúncio**, em vigor desde 9/6/2026, com multa de US$ 1.000 na primeira violação e US$ 5.000 nas seguintes ([Cooley](https://www.cooley.com/news/insight/2026/2026-01-29-new-york-enacts-synthetic-performer-disclosure-law-for-advertisements-including-those-using-generative-ai); [Mondaq](https://www.mondaq.com/unitedstates/advertising-marketing-branding/1800678/new-yorks-synthetic-performer-disclosure-law-what-advertisers-need-to-know)). A lei não define "conspícuo" ([Mondaq](https://www.mondaq.com/unitedstates/advertising-marketing-branding/1800678/new-yorks-synthetic-performer-disclosure-law-what-advertisers-need-to-know)). A amostra põe só a hashtag no meio da legenda. **Nós:** texto na tela ("AI-generated character · Ad") nos primeiros segundos, mais a legenda.
2. **Endorsement Guides (FTC):** influenciadores virtuais são "endossantes", **não podem alegar experiência pessoal** com o produto, e a conexão material precisa de divulgação clara. Segundo a análise, *"#endorsement, #partner, and #ambassador are not enough"* ([InfoLawGroup](https://www.infolawgroup.com/insights/2023/8/11/virtual-influencers-are-now-officially-regulated-endorsersunless-theyre-spokespersons)). A amostra usa o tempo todo *"I take one every morning"*, *"I never go without it"* e *"my clients come back telling me"*. **Nós:** a persona fala como apresentadora; nada de "eu uso", "meus clientes" ou "pessoas me contam".
3. **Regra de avaliações e depoimentos falsos (16 CFR 465, em vigor desde 21/10/2024):** proíbe depoimentos que aleguem falsamente vir de uma pessoa real, inclusive os gerados por IA ou de quem não teve experiência com o produto, com multa civil ([Manatt](https://manatt.com/insights/newsletters/client-alert/ftc-issues-final-rule-banning-fake-reviews-and-tes); [Kelley Drye](https://www.kelleydrye.com/viewpoints/blogs/ad-law-access/ftc-finalizes-rule-on-fake-reviews)). Na amostra, entram aqui a mulher no carro (*"I tightened right up after following his advice"*), a desconhecida da piscina (*"The only thing that helped me is this holistic healer"*) e o depoimento em 1ª pessoa de Jennifer. **Nós:** nenhum depoimento de resultado feito por personagem.
4. **Comprovação de alegações de saúde (FTC):** a Health Products Compliance Guidance (dez/2022) exige "competent and reliable scientific evidence", em geral ensaios clínicos randomizados em humanos; anedota não serve ([Covington](https://www.cov.com/en/news-and-insights/insights/2023/01/ftc-issues-new-guidance-on-health-related-claims-to-replace-the-dietary-supplements-advertising-guide); [JD Supra](https://jdsupra.com/legalnews/ftc-releases-health-products-compliance-2240320)). Frases da amostra como *"melts"*, *"your belly will drop in three days"*, *"flushes out your liver"* e *"kills parasites"* não teriam essa base.
5. **FDA, alegações de doença × estrutura/função:** suplemento não pode alegar diagnosticar, tratar, curar ou prevenir doença. Alegação de estrutura/função exige o aviso *"This statement has not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease."* ([FDA, Structure/Function Claims](https://www.fda.gov/food/nutrition-food-labeling-and-critical-foods/structurefunction-claims); [21 CFR 101.93](https://www.law.cornell.edu/cfr/text/21/101.93)). A amostra cita high blood sugar, insulin resistance, high cholesterol, blood pressure e parasitas, e um outlier fora da amostra, de [@anticancermom](https://www.instagram.com/reel/DeRylUxxIU_) (4,7M), abre com *"My cancer went away without treatment 18 years ago..."* (texto do gancho segundo o vidIQ). **Nós:** sem nome de doença; só "apoio" a funções normais (digestão, regularidade, energia), com o aviso na legenda.
6. **Moderação e reputação:** 2 dos vídeos escolhidos foram removidos e o próprio @loganalexander1960 diz *"I cannot name it here or this video would be taken down"*. A imprensa já mostrou contas desse tipo vendendo suplemento com recall da FDA e sendo derrubadas ([404 Media](https://www.404media.co/inside-an-ai-tiktok-shop-slop-factory-that-shills-supplements-recalled-by-the-fda/)).

> Este resumo não é parecer jurídico. Antes de veicular, os roteiros finais passam por revisão de um advogado de publicidade dos EUA.

---

## 5. Playbook

### 5.1 Dez modelos de gancho preenchíveis (adaptados para compliance)

| # | Modelo (EN, para preencher) | Origem na amostra | Prop/visual dos primeiros 2 s | Cuidado |
|---|---|---|---|---|
| G1 | *"You can drink [lemon water], [apple cider vinegar], [fiber powder]… and it still won't [do X]. Here's what my [grandmother/people] actually did."* | R1, 15,3M | Intestino transparente recebendo os itens citados | X = função ("leave you feeling light"), não doença |
| G2 | *"Stop [popular healthy habit]. On its own, it's not enough."* | DdmTSOHp8g1, 7,3M | Despejar o item num prop que "não reage" | Não negar ciência; trocar "doesn't work" por "isn't enough on its own" |
| G3 | *"Put [spice] on a [food] and just watch what happens."* | DaJNWw0FGkV, 6,6M | Close da ação, mão da persona no quadro | O "o que acontece" é sabor/receita, não cura |
| G4 | *"This is what [ingredient] does to [visual metaphor: a sugar-cube statue / a glass of water]."* | Deagez3h-p-, 3,2M | Estátua de cubos de açúcar e afins | Metáfora visual, não "prova" |
| G5 | *"— How old are you? — [age]. — What's your secret? — Three things. Save this video."* | R4, 3,7M | Esquete de encontro em local público | A persona não atribui a idade ao produto |
| G6 | *"This is [non-disease state: 'a 3 p.m. crash' / 'a heavy belly after dinner']. This too. And this."* | R3, 3,9M | Três cortes rápidos de "sintoma" (relógio, cinto, sofá) | Nunca rotular doença |
| G7 | *"If your [jeans dig in like this] after dinner and you want to feel like this by morning, watch this."* | R2, 2,8M | Antes/depois em prop (manequim) | Não chamar de "lymphatic dysfunction" ou "thyroid" |
| G8 | *"Hold a flame to a [food]. If it [reaction], [conclusion]."* | DenAPNJStbx | Duas velas, dois itens lado a lado | Teste de culinária, não de saúde |
| G9 | *"Never pour out the [cooking water/peel]. Do this instead."* | R6 | Lata/casca indo para a pia | Gancho de crescimento, sem produto |
| G10 | *"My grandmother made this for every woman on our street. Here's the recipe."* | DdvJr0eIuwx, 1,5M | Mãos idosas mexendo uma panela | Tradição como história, sem promessa de resultado |

### 5.2 Cinco templates de roteiro (30–60 s), com tempo marcado

Regras herdadas da amostra e do Prompt v2:
- **Ritmo de fala.** A amostra fala a 3,3 palavras/s. Para lip-sync confiável, use **no máximo ~2,8 palavras/s** em inglês (o Prompt v2 usa 2,3 para pt-BR).
- **Margens.** 0,5 s no início e 1,0 s no fim de cada cena, então ~6,5 s úteis numa cena de 8 s, o que dá **≤18 palavras por cena**.
- **Duração da cena.** Use a que estiver em `capacidades.json`; as tabelas usam 8 s só como exemplo.
- **Uma frase por cena, nunca atravessando o corte.**
- **Texto na tela.** A legenda e o aviso "AI-generated character · Ad" entram na montagem, não no prompt.

**T1 "Receita → ponte → produto" (56 s, 7 cenas). Estrutura E1.**

| Cena | Tempo | Visual / prop | Fala (exemplo) |
|---|---|---|---|
| 1 | 0–8 | Persona despeja água com limão num intestino transparente cheio de lama; nada desce | "You can drink lemon water, vinegar, fiber… and still feel heavy by dinner." |
| 2 | 8–16 | Close da persona, cozinha com bandeira | "Here's the morning drink my grandmother made instead." |
| 3 | 16–24 | Panela de vidro: limão, gengibre, canela | "Boil half a lemon, a slice of ginger, and a pinch of cinnamon for ten minutes." |
| 4 | 24–32 | Coando na caneca, vapor | "Sip it warm before breakfast. It's simple, and it's a nice way to start the day." |
| 5 | 32–40 | Persona com a caneca, sofá | "But most of us won't boil a pot every morning. You and I both know that." |
| 6 | 40–48 | Mostra o produto (rótulo legível) | "That's why I keep [Product] as the easy version. One scoop, thirty seconds." |
| 7 | 48–56 | Persona aponta para baixo | "It's on Amazon, link in my bio. Comment TEA and I'll send you the recipe." |

**T2 "Experimento curto → DM" (32 s, 4 cenas). Estrutura E2, sem produto no vídeo.**

| Cena | Tempo | Visual | Fala |
|---|---|---|---|
| 1 | 0–8 | Canela sobre estátua de cubos de açúcar | "This is what cinnamon does to a sugar cube statue. Watch." |
| 2 | 8–16 | Copo: água morna, canela, limão, mel | "Warm water, a teaspoon of cinnamon, a squeeze of lemon, a spoon of honey." |
| 3 | 16–24 | Persona bebendo | "It's my favorite way to start a slow morning. Cozy and simple." |
| 4 | 24–32 | Persona falando para a câmera | "Comment WARM and I'll send you the full morning routine. Follow so it reaches you." |

**T3 "Esquete → 3 coisas → produto" (64 s, 8 cenas). Estrutura E3; troque só as cenas 1–2 para testar ganchos.**

| Cena | Tempo | Visual | Fala |
|---|---|---|---|
| 1 | 0–8 | Corredor de supermercado: jovem para a persona | "Sorry, can I ask, how are you this full of energy at seven a.m.?" |
| 2 | 8–16 | Persona sorri | "Seventy-four, honey. Three habits. Save this video." |
| 3 | 16–24 | Copo de água com limão | "One: a glass of warm lemon water before anything else." |
| 4 | 24–32 | Caminhada na calçada | "Two: a ten-minute walk after supper. Every single night." |
| 5 | 32–40 | Persona em casa | "Three is the one people skip, and it's the one I'd never drop." |
| 6 | 40–48 | Produto na bancada | "A scoop of [Product] in water. That's my morning routine." |
| 7 | 48–56 | Persona aponta | "It's on Amazon. The link is in my bio." |
| 8 | 56–64 | Close | "Comment HABITS and I'll send you my full list. Follow so it reaches you." |

Compliance do T3: a persona apresenta **rotina**, não "por causa disso eu pareço mais jovem".

**T4 "Hack de receita → guia" (24 s, 3 cenas). Estrutura E5, crescimento.**

| Cena | Tempo | Visual | Fala |
|---|---|---|---|
| 1 | 0–8 | Água da lata de grão-de-bico indo para a pia, mão para | "Never pour out the water from a can of chickpeas. Do this instead." |
| 2 | 8–16 | Batedeira, picos brancos, cacau | "Whip it until it peaks, fold in cocoa and maple syrup, chill it." |
| 3 | 16–24 | Taça de mousse | "Chocolate mousse with no eggs. Comment MOUSSE for my recipe guide." |

**T5 "Espelho → receita → produto" (48 s, 6 cenas). Estrutura E1 curta, para volume diário.**

| Cena | Tempo | Visual | Fala |
|---|---|---|---|
| 1 | 0–8 | Dois manequins: cintura apertada × folgada | "If your jeans feel like this after dinner and you want them like this, listen." |
| 2 | 8–16 | Persona | "It's usually not one meal. It's what you do every morning." |
| 3 | 16–24 | Panela: gengibre, limão, pimenta | "Two cups of water, ginger, half a lemon, a pinch of black pepper. Ten minutes." |
| 4 | 24–32 | Persona com caneca | "Sip it warm. When I skip the pot, I use [Product] instead." |
| 5 | 32–40 | Produto | "It's on Amazon, search [Product], or tap the link in my bio." |
| 6 | 40–48 | Persona | "Comment GINGER and I'll send the recipe. Follow so it reaches you." |

### 5.3 Três personas prontas (blocos de trava para o `[PERSONAGEM — fixo]` do Prompt v2)

Nenhuma tem credencial inventada (médico, enfermeira) nem "clientes". A credibilidade vem do arquétipo, como nos anciãos da amostra, e não de mentira.

**P1 "Grandma June", 74, Kentucky** (arquétipo 1: tradição)
- **Visual travado:** mulher branca de 74 anos, cabelo branco preso em coque baixo, óculos de armação dourada fina, avental de linho azul-claro sobre blusa creme, mãos com manchas da idade, aliança simples.
- **Cenário:** cozinha de fazenda com armários de pinho, potes de conserva, bandeira dos EUA pequena na janela, luz natural da manhã pela janela à esquerda.
- **Voz:** feminina idosa, timbre médio-grave, sotaque do sul dos EUA (Kentucky), fala calma e calorosa, ritmo pausado.
- **Bordões:** "Save this one, honey." · "My mama made this every Sunday."
- **Formatos:** G1, G9, G10, T1, T4.
- **Não diz:** "cura", "meus clientes", "eu uso todo dia e emagreci".

**P2 "Coach Dale", 58, Texas** (arquétipo 2: treinador)
- **Visual travado:** homem branco de 58 anos, barba grisalha curta, boné de pesca verde-oliva liso (sem logo), camisa polo cinza, relógio esportivo preto, braços em forma.
- **Cenário:** quintal com churrasqueira, gramado e cerca de madeira, mais um galpão/garagem com bancada; luz de fim de tarde.
- **Voz:** masculina grave, sotaque texano leve, direta e bem-humorada, *"y'all"*.
- **Bordões:** "Here's the deal." · "Thirty seconds and you're done."
- **Formatos:** G2, G6, G7, T5, T3.
- **Não diz:** "ex-técnico da NBA" (credencial falsa), "meus atletas tomam".

**P3 "Mei", 41, Califórnia** (arquétipo 3: amiga de cozinha)
- **Visual travado:** mulher asiático-americana de 41 anos, cabelo preto liso na altura dos ombros, faixa de cabelo bege, moletom creme, sem joias além de argolas pequenas.
- **Cenário:** cozinha clara com bancada de quartzo branco, plantas, bandeira dos EUA discreta na estante, luz suave de janela.
- **Voz:** feminina, timbre médio, sotaque da Califórnia, animada e próxima.
- **Bordões:** "Did you know…?" · "Okay, watch this."
- **Formatos:** G3, G4, G8, T2, T4.
- **Não diz:** "eu pesava 100 kg", depoimento de resultado.

### 5.4 Como produzir isso no nosso pipeline (Veo 3 / Flow, Prompt v2)

1. **Banco de roteiros em dados.** Cada template (T1–T5) vira um JSON de cenas no formato do contrato do Prompt v2 (`ordem`, `duracao_s`, `visual`, `audio.falas` com `inicio_s`/`fim_s`). O produto, a persona e a palavra do CTA são **slots**. Isso replica o que a amostra faz (mesmo corpo, produto ou persona trocados) sem reescrever nada.
2. **Teste de gancho barato.** Como no par DczShIoB6PJ/DdG2PauOmWi, gere 3 versões só das cenas 1–2 e reaproveite as cenas aprovadas 3–N. **Ponto de atenção no Prompt v2:** pela regra atual, regenerar a cena *k* invalida *k+1…N* porque o frame de entrada muda. Para trocar o gancho sem refazer o corpo, a cena 3 precisa começar de um **frame-âncora** (imagem da persona no cenário do corpo) e não do último frame da cena 2, ou seja, um corte seco entre blocos.
3. **Blocos contínuos + cortes secos.** A amostra troca de cenário a cada frase. **Proposta:** dentro de um bloco no mesmo cenário (ex.: cenas 3–4 na panela), encadeie pelo último frame (modo B do Prompt v2). Entre blocos, comece do frame-âncora da persona no novo cenário. No contrato, isso pede um `frame_entrada.origem` do tipo `ancora:<id>` além de `ultimo_frame:<cena>`. É uma **extensão a decidir**, porque o Prompt v2 hoje só prevê o encadeamento pelo último frame.
4. **Prop como cena própria e sem fala.** O choque visual (intestino que desentope, estátua de açúcar) é uma cena de 4–8 s sem diálogo ou com fala curta. Na QA do Prompt v2, olhe com atenção `objeto_duplicado` e `fisica`, que é onde o gerador mais erra num prop.
5. **Fala dentro do limite.** ≤18 palavras por cena de 8 s, com a verificação por Whisper que o Prompt v2 já prevê (similaridade ≥0,8). A amostra mostra que o Whisper erra nomes de marca ("Jupe", "Soursab"), então compare com tolerância nos nomes próprios.
6. **Pós (montagem).** Áudio preservado (já corrigido no commit de49b8f) e saída em 1080×1920 a 30 fps, como na amostra. Legenda palavra a palavra gerada dos timestamps do Whisper, em estilo caixa alta com uma palavra destacada. Faixa fixa "AI-generated character · Ad" nos 3 primeiros segundos e selo pequeno até o fim (NY §396-b). Na legenda do post: `#ad #syntheticperformer #[marca]partner` e o aviso DSHEA quando houver alegação de estrutura/função.
7. **Distribuição.** IG + FB com link na descrição e automação de DM pela palavra-chave. **(Inferência a validar:** a ferramenta de DM exige que a pessoa siga a conta, e por isso todo CTA da amostra termina com *"follow me or I can't reach you"*.)

---

## 6. O que não foi coberto ou ficou incerto

- **Sem análise (bloqueados e sem crédito no vidIQ):** De90q56Ja1f (@wellnesseverydayhealth), De6-tuzEQXj (@nordic), Dc8-h5wTayT (@dre.daily.wellness), Dc1UWVCx61K (@maxhealingwithlan) e TikTok 7677369795796339999 (@holistic.rx, erro do yt-dlp). **Removidos:** Db_18weBjk_ (@health.life.standard) e DeMvY5KK9BF (@healthyolifetoday). Para essas contas entraram substitutos dos 12 reels recentes.
- **"Maior alcance":** a escolha se limita aos outliers do vidIQ (2026, ≥100K) mais os 12 reels recentes de cada perfil. Contas pequenas (@loganalexander1960, @liveliketrav) entraram com vídeos de centenas de views.
- **TikTok e Facebook:** a amostra é quase toda Instagram. A busca no TikTok trouxe contas de TikTok Shop, fora do recorte (ver `_vidiq_outliers/`).
- **Erros do Whisper visíveis nas transcrições:** marcas ("Jupe" = Jupi, "Soursab" = Soursop, "Baravia" = Beravia, "carrera.com" provavelmente errado), alucinações em loop (DdG2PauOmWi 58 s; DfDneuHBJtH 88 s) e "Subtitles by the Amara.org community" no fim de Dep5mKttgTY.
- **Ferramentas exatas de geração (Veo/Kling/HeyGen, TTS ou áudio nativo):** não dá para determinar pelos arquivos. O quadro da §4.6 é inferência visual.
- **Regras do Amazon Associates e Attribution para links em redes sociais:** não pesquisadas.
- **Compliance:** a §4.7 resume as fontes citadas e não é parecer jurídico.

## 7. Arquivos

- Transcrições Whisper (`.txt` com tempos, `.srt`), metadados (`.info.json`), vídeos (`.mp4`) e pranchas por vídeo (`_sheet.jpg`): `pesquisa/nutra/<conta>/`.
- Transcrições do vidIQ (vídeos bloqueados): `pesquisa/nutra/<conta>/<id>.vidiq.txt`.
- Pranchas por conta: `pesquisa/nutra/_pranchas/`.
- Outliers brutos do vidIQ (322 vídeos IG+TikTok): `pesquisa/nutra/_vidiq_outliers/all.json` e `all.txt`.
- Lista de URLs baixadas: `pesquisa/nutra/lista.tsv`. As falhas de download estão em `*.dl.err`.
