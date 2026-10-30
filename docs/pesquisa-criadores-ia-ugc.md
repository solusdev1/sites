# Criadores de IA e UGC que vendem ofertas de resposta direta (mercado dos EUA)

**Data da coleta:** 29/10/2026 · **Plataformas:** Instagram, Facebook (Meta Ad Library), TikTok · **Buscas em inglês**
**Substitui** o rascunho anterior (pane-177), cujas contas foram reverificadas uma a uma — ver §5 "Descartadas".

> **Como ler:** **VERIFICADA** = há evidência direta da oferta (link da bio/legenda resolvido até o destino, ou anúncio na Meta Ad Library com o domínio `HOP.CLICKBANK.NET`, ou case publicado pela própria rede). **PROVÁVEL** = só indício indireto (dito qual). "Tipo IA" só é afirmado quando a conta se declara com `#syntheticperformer`; nos outros casos aparece como "IA provável" com o indício, ou "não determinado".
>
> **Fontes dos números:** seguidores e views do Instagram/TikTok vieram do vidIQ (perfil e busca de outliers) e da página pública do TikTok, todos lidos em 29/10/2026. Os links de bio foram resolvidos com `curl` até a URL final. Dados de anúncios vieram da [Meta Ad Library](https://www.facebook.com/ads/library/), filtrada para EUA e vídeo.

---

## 0. Resumo do que se achou (leia primeiro)

1. **No orgânico (IG/TikTok) não achei nenhum criador com link direto para ClickBank, BuyGoods, Digistore24, MaxWeb ou SmartAdv na bio.** As grandes contas de saúde com personagem de IA levam a **Amazon (Amazon Attribution / Associates) ou lojas Shopify com parâmetro de afiliado**, ou seja, e-commerce e programas de criadores das próprias marcas (Serene Herbs, Jupi, Physician's Choice, Rosabella), e não VSL.
2. **As redes de VSL aparecem nos anúncios pagos da Meta.** A busca pelo domínio `hop.clickbank.net` na Meta Ad Library (EUA, vídeo) retornou cerca de 980 anúncios no histórico e cerca de 95 ativos em 29/10/2026. Boa parte vem de **páginas com nome de pessoa** ("Susan Miller", "Barbara Silva", "Julianne Anderson"…) com vídeo de depoimento em estilo UGC. É esse o formato "criador + VSL" que existe hoje em escala.
3. **Personagens de IA estão se declarando.** Dezenas de contas usam `#syntheticperformer` na legenda, junto com `#<marca>partner`/`#affiliate`/`#ad`. Isso coincide com a lei de Nova York de divulgação de "synthetic performer" em anúncios, em vigor desde 9/6/2026 ([Mondaq — New York's Synthetic Performer Disclosure Law](https://www.mondaq.com/unitedstates/advertising-marketing-branding/1800678/new-yorks-synthetic-performer-disclosure-law-what-advertisers-need-to-know)). A hashtag virou uma **chave de busca** para achar personagens de IA que vendem.
4. A imprensa já documentou operações de "influencers" de IA vendendo suplementos no TikTok. São contas feitas com Veo 3, HeyGen e ElevenLabs, com hooks como "If you're trying to sell health products to a 50-year-old… make your avatar 50 years old" ([404 Media — Inside an AI TikTok Shop Slop Factory](https://www.404media.co/inside-an-ai-tiktok-shop-slop-factory-that-shills-supplements-recalled-by-the-fda/); [Media Matters — deepfake and AI-generated influencers on TikTok](https://www.mediamatters.org/tiktok/scammers-seem-be-using-deepfake-and-ai-generated-influencers-tiktok-sell-you-wellness)). Várias dessas contas foram removidas depois das reportagens.

**Contagem:** 32 VERIFICADAS (14 IG-IA/e-commerce + 16 páginas Meta→ClickBank + 2 outras) · 2 PROVÁVEIS · 36 descartadas (18 do rascunho + 18 da pesquisa atual; o grupo #viewmaxpartner conta como 1).

---

## 1. Personagens de IA no Instagram (saúde/remédio natural → e-commerce afiliado)

Padrão comum: persona de autoridade gerada (ex-técnico da NBA, ancião nativo-americano, fazendeiro amish, curandeiro chinês, casal nórdico), vídeo com prop anatômico ou "experimento", CTA "Comment TEA/FLAT/REMEDY" (DM automática) e link na bio via `linktw.in`/`linktwin.co`. O destino é a Amazon, com parâmetros `maas…&tag=maas&aa_campaignid=lens_c_…` (Amazon Attribution) ou `tag=<loja>-20` (Associates). **Três contas diferentes caem na mesma campanha Amazon (`lens_c_dk6va0nn`, Serene Soursop Bitters, ASIN B0CYV4FCJS)**, o que mostra que fazem parte do mesmo programa de criadores da marca.

| # | Conta (URL) | Tipo | Seguidores (29/10) | Evidência da oferta | Status |
|---|---|---|---|---|---|
| 1 | [@wellnesseverydayhealth](https://www.instagram.com/wellnesseverydayhealth/) "Coach Jones \| Retired NBA Coach" | IA (legenda `#syntheticperformer`) | 714,6K | Bio `linktw.in/lzTOHg` → Amazon B0CYV4FCJS (Attribution, campanha `lens_c_dk6va0nn`); legenda `#sereneherbspartner #ad` | VERIFICADA |
| 2 | [@mother.satori](https://www.instagram.com/mother.satori/) "US based Holistic Expert" | IA (legenda `#syntheticperformer`) | 1,2M | Bio `linktwin.co/rfqfwf` → Amazon B0CYV4FCJS (mesma campanha); legenda do reel com `amzn.to` Jupi + `#jupihydrationpartner #affiliate` | VERIFICADA |
| 3 | [@askoliviahealth](https://www.instagram.com/askoliviahealth/) "Olivia Hart" | IA provável (mesma infraestrutura linktw.in + Amazon Attribution das contas declaradas; persona "220+ lbs at 31") | 496,9K | Bio `linktw.in/bgpvZl` → Amazon B00Y2MAE9O (Attribution); bio "Get Pura Vida Moringa" | VERIFICADA |
| 4 | [@natural.solutions.us](https://www.instagram.com/natural.solutions.us/) | IA (legenda `#syntheticperfomer` [sic] `#ad`) | 271,9K | Bio → `200naturalsolutions.com/products/200naturalsolutions?ref=tana` (Shopify, parâmetro de afiliado `ref`) — livro de remédios | VERIFICADA |
| 5 | [@amishremedies](https://www.instagram.com/amishremedies/) "Beiler Mast \| Mennonite Amish farmer" | IA provável (persona arquetípica; sem divulgação vista) | 503,9K | Bio `beraviahealth.com/trybeetroot` → `…/products/beetroot?sca_ref=…` (Shopify, parâmetro de afiliado) | VERIFICADA |
| 6 | [@silas.nativewisdom](https://www.instagram.com/silas.nativewisdom/) "Native American Elder" | IA provável (idem) | 158K | Bio `linktw.in/nmiyzn` → Amazon Physician's CHOICE B0FTTGT6M7 (Attribution) | VERIFICADA |
| 7 | [@ardenremedy](https://www.instagram.com/ardenremedy/) "Arden \| Chinese Healer" | IA provável (idem) | 231,4K | Bio `linktwin.co/sehkma` → Amazon B0DS1C3P6X (Jupi, Attribution) | VERIFICADA |
| 8 | [@jennifersagewellness](https://www.instagram.com/jennifersagewellness/) | IA (`#syntheticperformer`) | 39K | Legenda: `linktw.in/iYQrKF` → Amazon soursop, `tag=rosafacebookcaptions-20`; `#sereneherbspartner #ad` | VERIFICADA |
| 9 | [@health.life.standard](https://www.instagram.com/health.life.standard/) | IA (`#syntheticperformer`) | 189,1K | Bio `linktw.in/DwnFYB` → Amazon B0CYV4FCJS (campanha `lens_c_dk6va0nn`); legenda `#sereneaffiliate #ad` | VERIFICADA |
| 10 | [@travisonwellness](https://www.instagram.com/travisonwellness/) | IA (`#syntheticperformer`) | 458,3K | Legenda `#sereneherbspartner #ad` (link da bio não resolvido) | VERIFICADA |
| 11 | [@thenicosterling](https://www.instagram.com/thenicosterling/) "Longevity Coach" | IA (`#syntheticperformer`) | 62,5K | Bio `linktw.in/abQJQI` → Amazon probiótico B079H53D2B; legenda `#physicianschoicepartner #affiliate` | VERIFICADA |
| 12 | [@loganalexander1960](https://www.instagram.com/loganalexander1960/) | IA (`#syntheticperformer`) | 2,2K | Legenda `linktw.in/dTNiOg` → Amazon B0DS1C3P6X, `tag=thisisjupiforfb-20`; `#jupihydrationpartner` | VERIFICADA |
| 13 | [@liveliketrav](https://www.instagram.com/liveliketrav/) | não determinado | 3K | Legenda `linktw.in/cTXKKM` → Amazon B0CYV4FCJS (campanha `lens_c_dk6va0nn`) | VERIFICADA |
| 14 | [@malikhealing](https://www.instagram.com/malikhealing/) | não determinado | 242,6K | Legenda `#sereneherbspartner #affiliate` | VERIFICADA |
| 15 | [@nordic.healing.wisdom](https://www.instagram.com/nordic.healing.wisdom/) "Astrid and Erik" | IA provável (logo ilustrado, persona de casal) | 584,8K | Bio diz "Get Glutathione HERE👇", mas a ferramenta não devolveu o link externo; legenda vende "Ancestral Healing guide" via "Comment REMEDY" | PROVÁVEL (sem destino resolvido) |
| 16 | [@rafael.cortez.remedies](https://www.instagram.com/rafael.cortez.remedies/) | IA provável (legenda truncada começa com "#sy…") | 101K | Bio "Marvella the Amla brand I use daily👇" sem link capturado; legenda "Comment BOOK… Ancient Remedies Bible" | PROVÁVEL |

**Vídeos de exemplo (views na data da coleta, do vidIQ):**
- #1 — [DdmTSOHp8g1](https://www.instagram.com/reel/DdmTSOHp8g1) 7,3M views: abre com "Stop drinking lemon water." e mostra água sendo despejada num "cólon" de lama → receita → produto. Também [DdXgRERJwYL](https://www.instagram.com/reel/DdXgRERJwYL) 2,8M: "IF YOUR BACK CARRIES ROLLS LIKE THIS AND YOU WANT IT SMOOTH LIKE THIS", com manequins anatômicos.
- #2 — [DczShIoB6PJ](https://www.instagram.com/reel/DczShIoB6PJ) 3,7M: esquete com vizinho ("idosa podando cerca") que vira monólogo anti-aging e pitch da Jupi.
- #3 — [DbyXpFjKWhh](https://www.instagram.com/reel/DbyXpFjKWhh) 666K: "THIS IS HIGH CHOLESTEROL" repetido sobre montagem rápida de marcas na pele → Moringa.
- #4 — [DdFsxXbsAMq](https://www.instagram.com/reel/DdFsxXbsAMq) 2,4M: fruta posta na boca de um torso anatômico transparente ("YOU CAN EAT…") → receita → livro.
- #5 — [DdPzYqAS5eD](https://www.instagram.com/reel/DdPzYqAS5eD) 849K: "put an ice cube right in your big toe and middle toe".
- #6 — [Db32t9_PHLB](https://www.instagram.com/reel/Db32t9_PHLB) 234K: dedo do pé falso + "GET YOUR UGLY NAILS READY FOR SANDALS THIS SUMMER".
- #7 — [DcpSjUoT7tb](https://www.instagram.com/reel/DcpSjUoT7tb) 627K: bicarbonato numa barriga protética, "THIS IS WHAT BAKING SODA DOES TO YOUR BELLY".
- #8 — [Dbl0uJOpjZR](https://www.instagram.com/reel/Dbl0uJOpjZR) 133,5K: chia despejada, "YOU WILL NEVER GO BACK TO THE GYM".
- #9 — [Db_18weBjk_](https://www.instagram.com/reel/Db_18weBjk_) 229,6K: "IF YOU HAVE A TURKEY NECK LIKE THIS".
- #10 — [DeZZlPCRxtC](https://www.instagram.com/reel/DeZZlPCRxtC) 1,8M: close na marca de meia no tornozelo, "If your SOCKS leave marks like this, that's a backed-up gut."
- #11 — [DceDC2oTssK](https://www.instagram.com/reel/DceDC2oTssK) 1,7M: "THIS IS SUGAR DAMAGE" (apertando gordura das costas de modelos).
- #12 — [Dcko95Ft8ff](https://www.instagram.com/reel/Dcko95Ft8ff) 609,4K: recorte de podcast em tela dividida, "Do you have these symptoms?".
- #13 — [DcB2JldyNal](https://www.instagram.com/reel/DcB2JldyNal) 124,2K: falso "breaking news", "Quit eating this deadly food unless you want to PASS before you're 60 🚨".
- #14 — [DbghlcbRAVd](https://www.instagram.com/reel/DbghlcbRAVd) 303,4K: "THIS IS HIGH BLOOD SUGAR" sobre close-ups de pele e pés.
- #15 — [DaWna6jh_3A](https://www.instagram.com/reel/DaWna6jh_3A) 2,6M: "Put turmeric on a boiled egg and just watch what happens."
- #16 — [Deagez3h-p-](https://www.instagram.com/reel/Deagez3h-p-) 3,2M: canela sobre uma estátua de cubos de açúcar, "This is what cinnamon does to the sugar in your body."

---

## 2. Páginas do Facebook com anúncios em vídeo que levam a ClickBank (Meta Ad Library)

Busca usada: [`hop.clickbank.net`, EUA, vídeo, todos os status](https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=hop.clickbank.net&search_type=keyword_unordered&media_type=video). Cada página abaixo apareceu nessa busca. Nos cards marcados com ★ o domínio **HOP.CLICKBANK.NET** aparecia visível no próprio anúncio. Todos são páginas do Facebook com veiculação também em Instagram/Messenger/Threads (ícones de plataforma no card). O tipo é "UGC/depoimento" pelo formato da miniatura (pessoa falando para a câmera, legenda queimada); **não confirmei se o rosto é gerado por IA**. A Ad Library não mostra seguidores, então os números aqui são quantidade de anúncios e período de veiculação.

| # | Página (URL) | Oferta / nicho | Anúncios e período | Exemplo (permalink) e gancho | Status |
|---|---|---|---|---|---|
| 17 | [Susan Miller](https://www.facebook.com/61588662030263/) ★ | emagrecimento ("orange peel") | 8 anúncios, 24–29/03/2026 | [1449002840213056](https://www.facebook.com/ads/library/?id=1449002840213056): "This Spanish trick with orange peel melts 16 kg in 5 weeks." Mulher mais velha falando na cozinha, legenda "It was only when I discovered this in orange peel that my body started burning fat again" | VERIFICADA |
| 18 | [Barbara Silva](https://www.facebook.com/61555945287846/) | saúde masculina (inferido do texto) | 5 anúncios | [1422749635942106](https://www.facebook.com/ads/library/?id=1422749635942106): "A lot of guys ask me if this thing is actually…" | VERIFICADA |
| 19 | [Julianne Anderson](https://www.facebook.com/100094446726883/) | narrativa pessoal (oferta não identificada) | 5 anúncios, 12–13/03/2026 | [2972084752990399](https://www.facebook.com/ads/library/?id=2972084752990399): "All my life, I was overshadowed by constant unfavorable comparisons to my younger brother," | VERIFICADA |
| 20 | [Maria Conner](https://www.facebook.com/61557189326859/) | emagrecimento | 2 anúncios | [942446858470743](https://www.facebook.com/ads/library/?id=942446858470743): "Melt stubborn fat faster — backed by Harvard…" | VERIFICADA |
| 21 | [Laura Peterson](https://www.facebook.com/61579153966146/) | — (anúncio removido; Meta informa conta/página desabilitada) | 4 anúncios, 08–14/03/2026 | [1553928805689188](https://www.facebook.com/ads/library/?id=1553928805689188) | VERIFICADA (página derrubada) |
| 22 | [Hearing Health Daily](https://www.facebook.com/61562930700075/) ★ | sono (gotas naturais) | 3 anúncios, 27/05–12/06/2026 | [1603671845099745](https://www.facebook.com/ads/library/?id=1603671845099745): "If you've tried magnesium, ashwagandha, lavender oil, melatonin, and chamomile tea… and STILL can't stay asleep…"; título "After Magnesium and Melatonin Failed Me, I Looked Closer". Também [965052899730079](https://www.facebook.com/ads/library/?id=965052899730079): "Racing thoughts the moment your head hits the pillow?" | VERIFICADA |
| 23 | [Caravello](https://www.facebook.com/61583292427562/) ★ | saúde bucal (pastilha probiótica) | 3 anúncios, 17–20/03/2026 | [820252373700618](https://www.facebook.com/ads/library/?id=820252373700618): "Say goodbye to the embarrassment of bad breath. A probiotic lozenge…" | VERIFICADA |
| 24 | [Kryonshop](https://www.facebook.com/61587387712627/) | dispositivo de nervo vago (Pulsetto) | 2 anúncios, 13–16/05/2026 | [1774603886842799](https://www.facebook.com/ads/library/?id=1774603886842799): "Discover a new way to manage stress, anxiety, and poor sleep." Homem falando com cérebro em overlay | VERIFICADA |
| 25 | [Smart Projects](https://www.facebook.com/61572057236079/) | marcenaria (planos) | 7 anúncios (12 versões do mesmo criativo), 10–13/04/2026 | [1397954982135262](https://www.facebook.com/ads/library/?id=1397954982135262): "I didn't know you could actually build something like this yourself… I always thought woodworking was complicated" | VERIFICADA |
| 26 | [SOHL Health](https://www.facebook.com/61588383782427/) | emagrecimento ("orange peel") | 15–16/04/2026 (2 versões) | [940097101977901](https://www.facebook.com/ads/library/?id=940097101977901): "Soak orange peel for 30 seconds to burn fat" | VERIFICADA |
| 27 | [Weight Loss Diet Plans](https://www.facebook.com/100070768607164/) | emagrecimento | 16–19/02/2026 | [1416745453262428](https://www.facebook.com/ads/library/?id=1416745453262428): "Soaking this orange peel in hot water … 76 lbs GONE" | VERIFICADA |
| 28 | [Vanessa Cruz](https://www.facebook.com/vanessacruz.com.br/) ★ | foco/cognição ("ear trick") | 2 anúncios, 21–26/01/2026 | [3414258698721913](https://www.facebook.com/ads/library/?id=3414258698721913): "A simple 8-second ear trick many people are trying to feel more focused and mentally clear. No pills. No supplements." | VERIFICADA |
| 29 | [Miller's Journal](https://www.facebook.com/61589237033279/) ★ | e-commerce (travesseiro "butterfly") | **ativo** em 29/10/2026 | [1592058995442084](https://www.facebook.com/ads/library/?id=1592058995442084): "Don't buy this weird butterfly pillow… unless you sleep on your side. 🦋". Também [1108581022057854](https://www.facebook.com/ads/library/?id=1108581022057854): "We run two Airbnbs in Miami, and guests keep asking the same thing…" | VERIFICADA |
| 30 | [AI Found](https://www.facebook.com/100067596887404/) ★ | curso de idioma (Rocket Spanish) | **ativo** desde 18/10/2026 | [1638634267954934](https://www.facebook.com/ads/library/?id=1638634267954934): "Someone speaks Spanish to you and you freeze? Save these three 👇" | VERIFICADA |
| 31 | [Happy Life](https://www.facebook.com/61570833372117/) ★ | saúde masculina | **ativo** 28–29/10/2026 (3 anúncios com o mesmo criativo) | [1746749920146857](https://www.facebook.com/ads/library/?id=1746749920146857): "Curious about the science behind men's wellness? 👀" | VERIFICADA |
| 32 | [ClearFlow Home](https://www.facebook.com/61587583223223/) | "remédio tradicional" (oferta não identificada) | 4 anúncios (data não capturada) | [935741562648460](https://www.facebook.com/ads/library/?id=935741562648460): "People have recently been discussing a tradit[ional]…" | VERIFICADA |

Outras buscas no mesmo dia: `digistore24.com` deu cerca de 270 resultados, a maioria anúncios da própria Digistore24/Pagewheel e de vendedores (não de criadores afiliados). `buygoods` deu cerca de 29, quase todos educadores de "afiliado"; nenhuma conta de criador promovendo oferta foi identificada. **Para BuyGoods, Digistore24, MaxWeb e SmartAdv não achei evidência direta de criador.** Afiliados dessas redes costumam esconder o hop link atrás de uma página "presell" no próprio domínio, então a busca pelo domínio da rede não pega esses casos (inferência, não verificada).

---

## 3. Outros (quiz de manifestação e case histórico da ClickBank)

| # | Conta | Tipo | Números (29/10) | Evidência | Exemplo | Status |
|---|---|---|---|---|---|---|
| 33 | [@maya.astor](https://www.instagram.com/maya.astor/) | não determinado (persona "life reading") | 206K seguidores | Bio `spirit.s.gy/MAYA.ASTOR` → 302 → `app.auralyapp.com` → `quiz.auralyapp.com/…?aff=…&utm_id=maya.astor&lander=TM-V1.5 \| 🇺🇸 Inglês \| Creators \| Tarot Manifest \| Auraly App` com parâmetros do rastreador RedTrack (`rtkcid`). É um funil de quiz de resposta direta com ID de afiliado; o rótulo do lander em português indica operação brasileira | [DeHG6EOIMbm](https://www.instagram.com/reel/DeHG6EOIMbm) 2,6M views: abre um compartimento secreto cheio de dólares, "If you need urgent and unexpected money:" → "check my Story before it disappears" | VERIFICADA (rede própria do app, não uma das cinco redes) |
| 34 | Brett Boles — TikTok [@brettboles](https://www.tiktok.com/@brettboles) / IG [@thebrettboles](https://www.instagram.com/thebrettboles/) | UGC humano | TikTok 419,3K seguidores / 8,7M curtidas; IG 267,6K | Case oficial: professor de música que promoveu um curso de piano da ClickBank com link na bio e vídeos diários de 1 min ([ClickBank — Brett Boles success story](https://clickbank.com/blog/brett-boles-success-story), 21/11/2023; listado em [ClickBank — Customer Stories](https://clickbank.com/customer-stories)). **Hoje a bio aponta para a comunidade própria dele no Skool, não para ClickBank** | formato: análise de 1 min de músicas da Broadway/Disney (conforme o case) | VERIFICADA (histórico) |

---

## 4. Padrões de gancho e roteiro observados (com a conta/vídeo de origem)

1. **"Se o seu X está assim e você quer assim…"**: sintoma visual mostrado no corpo/prop, depois promessa. Ex.: #1 [DdXgRERJwYL](https://www.instagram.com/reel/DdXgRERJwYL) "IF YOUR BACK CARRIES ROLLS LIKE THIS…"; #10 "If your SOCKS leave marks like this, that's a backed-up gut."; TikTok [@zayden.rennox.pro](https://www.tiktok.com/@zayden.rennox.pro/video/7692034333837708575) "IF YOUR ANKLES LOOK LIKE THIS AND YOU WANT THEM LOOKING LIKE THIS LISTEN CLOSELY" (2M views).
2. **"THIS IS [condição]" repetido sobre montagem rápida**: #3 "THIS IS HIGH CHOLESTEROL", #14 "THIS IS HIGH BLOOD SUGAR", #11 "THIS IS SUGAR DAMAGE".
3. **"Ponha X em Y e veja o que acontece"** (experimento caseiro): #15 cúrcuma no ovo; #5 gelo entre os dedos; TikTok [@jace.rhodes.protocol](https://www.tiktok.com/@jace.rhodes.protocol/video/7695368777977859359) "PUT BLACK PEPPER ON PINEAPPLE AND WATCH WHAT HAPPENS" (923,8K).
4. **Contraintuitivo / "pare de fazer"**: #1 "Stop drinking lemon water." (7,3M); #13 "Quit eating this deadly food…".
5. **Prop anatômico ou metáfora física** (torso transparente, cólon de lama, estátua de açúcar, barriga protética): #4, #16, #7, #1.
6. **Persona de autoridade arquetípica** gerada por IA (idoso sábio, etnia ou tradição, ex-atleta, "coach" de longevidade): #1, #5, #6, #7, #15. A credibilidade vem do arquétipo, não do produto.
7. **CTA por palavra-chave nos comentários** ("Comment TEA / FLAT / REMEDY / BOOK") somado ao link da bio: #1, #3, #15, #16. Captura a intenção em DM antes de mandar para a oferta.
8. **Nos anúncios ClickBank (Meta), o padrão é VSL/advertorial em formato de depoimento:**
   - "eu já tentei de tudo": #22 "If you've tried magnesium, ashwagandha… and STILL can't stay asleep";
   - "truque estrangeiro/estranho + número": #17 "This Spanish trick with orange peel melts 16 kg in 5 weeks", #28 "8-second ear trick", #26/#27 "orange peel";
   - "não compre isso… a menos que": #29;
   - prova social em história: #29 "We run two Airbnbs in Miami";
   - autoridade emprestada: #20 "backed by Harvard";
   - história pessoal longa que abre o VSL: #19.
9. **Manifestação/dinheiro**: "If this message found you… don't ignore it", revelação de dinheiro escondido e CTA para Story/bio: #33.

---

## 5. Descartadas (com motivo)

**Do rascunho anterior:**
| Conta | Motivo |
|---|---|
| Robby Blanchard | Instagram `@robbyblanchard` está **privado**; sem evidência coletada nesta sessão. Os números "$200M / #1 affiliate" do rascunho não tinham fonte |
| @freedom.with.sergio | Perfil no IG existe, mas com **0 posts e 0 seguidores**, nome "Ivan Luchkin": não corresponde à descrição |
| Aitana López (@fit_aitana) | Existe (403,9K, IA), mas a bio aponta para uma comunidade Skool e parcerias de marca. **Sem oferta de rede DR** |
| "Luna" (influencer de IA) | Sem handle informado; não verificável |
| Jonathan Montoya, @860affiliate, John Crestani | Não verificados nesta sessão (sem perfil nem evidência de oferta coletados) |
| @the__gloss, @celeste111555, @songofskin, @tatlafata, LeanBeefPatty, @collectcreatives | Beleza, cabelo ou TikTok Shop, fora do foco; o rascunho não dava nenhuma evidência de rede DR (ex.: "@songofskin… ClickBank" sem fonte) |
| @creator_tutorials, @samanthamaddie.ugc, @javierrlucena | Sem evidência de oferta; o último é conteúdo em espanhol |
| Genies, "TikTok AI Influencer Tool" | São plataformas ou recursos, não contas |

**Da pesquisa atual:**
| Conta | Motivo |
|---|---|
| @samuelreed_wellness, @weightloss_coach_testimonies | Apareceram nos outliers, mas o perfil **não foi encontrado** (removido ou renomeado) |
| @walter.hale777 (110K) | Manifestação; bio "The answer… is right here 👆" **sem link externo** retornado |
| @camaftershift (58,1K) | "Start Here" sem link externo retornado |
| @paulsminhas (37,5K) | Funil próprio (`paulgetfgs.com`, GoHighLevel), não rede de afiliados |
| TikTok @jace.rhodes.protocol (350K) | Bio leva a e-book próprio (`cravewellkitchen.shop`), não afiliado |
| TikTok @holisticglpgirly (134,4K), @drew.review (198,5K), @barefoot.plant.mama (43,2K) | TikTok Shop, Stan Store ou parceria de marca; não é rede DR |
| TikTok @zayden.rennox.pro | Não consegui ler a bio (bloqueio na leitura) |
| Grupo "#viewmaxpartner" (@jennymakescontent 351K, @michelle26.mp4, @xo.cierranicole…) | Afiliados de SaaS de vídeo com IA, não de oferta VSL. Útil como referência de formato "ganhe dinheiro com IA" |
| TikTok @liverboosthub11, @poormaninla | Citadas por [404 Media](https://www.404media.co/inside-an-ai-tiktok-shop-slop-factory-that-shills-supplements-recalled-by-the-fda/) como IA/Rosabella; não verifiquei se ainda existem |
| Páginas "Ponto Nexus", "The Cookie Jar", "Healthy Life", "Online Orbit Market" (busca Meta) | Apareceram na busca por `hop.clickbank.net`, mas sem criativo ou texto aproveitável, ou sem formato de criador |

---

## 6. Palavras-chave e buscas que de fato trouxeram resultado

| Onde | Busca | Resultado em 29/10/2026 |
|---|---|---|
| Meta Ad Library (EUA, vídeo) | `hop.clickbank.net` | cerca de 980 anúncios no histórico, cerca de 95 ativos. **A melhor fonte para ClickBank** |
| Meta Ad Library | `digistore24.com` | cerca de 270, a maioria da própria rede ou de vendedores |
| Meta Ad Library | `buygoods` | cerca de 29, educadores (nenhum criador-afiliado) |
| Instagram (legenda) | `#syntheticperformer` + `#sereneherbspartner` / `#jupihydrationpartner` / `#physicianschoicepartner` / `#sereneaffiliate` | O grupo de IA da §1 |
| vidIQ outliers (conceito) | "old doctor reveals natural remedy trick, comment or click link…" / "AI avatar woman talking about weight loss supplement secret, link in bio" | Grupo de remédio natural da §1 |
| vidIQ outliers | "Billionaire Brain Wave OR Genius Wave… manifestation frequency" | Grupo de manifestação (#33) |
| vidIQ outliers | "ClickBank affiliate marketing for beginners…" | **Nenhum resultado com ClickBank**; só SaaS (`#viewmaxpartner`) e dropshipping |
| vidIQ outliers | "Mitolyn OR Sugar Defender OR Prodentim…" | Nenhum vídeo citando esses produtos pelo nome; vieram contas de suplemento de e-commerce |

Ganchos de busca que funcionaram como filtro de legenda: `Comment "TEA"`, `Get Soursop Bitters HERE`, `#usahealth`, `#womenintheusa`, `#healthyusa`.

---

## 7. Fontes de descoberta (corrigido)

- **Meta Ad Library**: `facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=<termo>&search_type=keyword_unordered&media_type=video`. A busca por domínio de link funciona (testado). Permalink de cada anúncio: `facebook.com/ads/library/?id=<ID>`. Página do anunciante: `view_all_page_id=<id>` (a página da Susan Miller voltou vazia, provavelmente porque foi desativada).
- **TikTok Creative Center / Commercial Content Library**: não testado nesta sessão.
- **Ferramentas de espionagem de anúncios** (Minea, BigSpy, PiPiADS etc.): não testadas. Os preços do rascunho foram removidos por não terem fonte.
- **Hashtags**: as contagens de views do rascunho (ex.: "#clickbank 1.7B+") **foram removidas** porque não havia fonte. Use as buscas da §6.
- **Resolver o link da bio** é o teste decisivo. Os encurtadores `linktw.in`/`linktwin.co` respondem 200 e redirecionam via JavaScript; o destino aparece no HTML (`grep` por `https://www.amazon.com/...`, `hop.clickbank.net`, `?aff=`, `?ref=`, `sca_ref=`). Parâmetros que identificam a rede ou o programa: `tag=…-20` (Amazon Associates), `maas…aa_campaignid=` (Amazon Attribution), `sca_ref` (afiliado em loja Shopify), `aff=` + `rtkcid` (RedTrack), `hop.clickbank.net` (ClickBank).

---

## 8. Redes de afiliados (o que foi confirmado)

- **ClickBank**: presença direta confirmada em anúncios Meta (§2) e no case de Brett Boles (§3). A própria ClickBank anuncia o programa "Spark" de cursos para afiliados na Meta (anúncios ativos em 29/10/2026, página [ClickBank](https://www.facebook.com/ClickBank/)).
- **Digistore24**: na Ad Library aparece sobretudo a própria rede (Pagewheel, recrutamento de vendedores). Nenhum criador-afiliado foi identificado.
- **BuyGoods**: nenhuma evidência de criador; a busca devolve educadores de "afiliado".
- **MaxWeb**: rede de performance com sede na Irlanda, focada em nutra e conhecida por ofertas VSL, com pagamentos CPA/CPL/revshare ([Business of Apps — MaxWeb](https://businessofapps.com/affiliate/maxweb); [Morning Dough — MaxWeb Affiliate Network](https://www.morningdough.com/affiliate-networks/maxweb/)). **Não é brasileira**, ao contrário do que dizia o rascunho. Nenhum criador identificado.
- **SmartAdv**: o site [smartadv.com](https://smartadv.com/) existe e se descreve como "affiliate network", com seção "Affiliate Programs" (lido via `curl` em 29/10/2026; o WebFetch devolveu 404). Nenhum criador identificado.

---

## 9. Técnico: baixar e transcrever vídeos para análise (mantido e corrigido)

> Nada desta seção foi testado nesta sessão. Respeite os Termos de cada plataforma, use só conteúdo público, para análise interna e sem repostar.

```bash
pip install yt-dlp faster-whisper   # ffmpeg precisa estar no PATH
yt-dlp -o "data/%(uploader)s_%(id)s.%(ext)s" "https://www.instagram.com/reel/DdmTSOHp8g1"
```

```python
# transcreve um vídeo baixado e grava .srt (corrige o script do rascunho, que usava info.title do Whisper)
from faster_whisper import WhisperModel

def fmt(t):
    h, r = divmod(t, 3600); m, s = divmod(r, 60)
    return f"{int(h):02}:{int(m):02}:{s:06.3f}".replace(".", ",")

def transcribe(video_path, srt_path, model_size="small"):
    model = WhisperModel(model_size, device="auto")
    segments, _ = model.transcribe(video_path, language="en")
    with open(srt_path, "w", encoding="utf-8") as f:
        for i, seg in enumerate(segments, 1):
            f.write(f"{i}\n{fmt(seg.start)} --> {fmt(seg.end)}\n{seg.text.strip()}\n\n")
```

- Anúncios da Meta: o permalink `ads/library/?id=` abre o vídeo no navegador. Não testei o download com yt-dlp.
- As ferramentas "ytpipe" e "ytws" do rascunho **foram removidas** (não verificadas).

---

## 10. O que NÃO foi coberto

- TikTok Creative Center / Commercial Content Library e ferramentas de espionagem pagas.
- Se os rostos dos anúncios ClickBank (§2) são IA ou humanos: só vi as miniaturas.
- Seguidores das páginas do Facebook (a Ad Library não mostra).
- Transcrição completa dos vídeos: os ganchos vêm de legenda, texto na tela ou descrição do vidIQ, não de áudio transcrito.
- Contas de afiliado de BuyGoods, Digistore24, MaxWeb e SmartAdv: provavelmente escondidas atrás de presells; precisa de outro método (ex.: buscar os nomes das ofertas dessas redes na Ad Library).
