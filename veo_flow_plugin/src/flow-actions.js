// Ações no DOM do Google Flow (flow.google.com), mapeadas no Flow real em 2026-10-18.
// Isolado da API Chrome; rótulos em pt-BR. Se o Flow mudar, ajuste os seletores aqui.
(function (global) {
  const TRIGGER = '[aria-label="Gatilho de configurações"]';
  const GENERATE = '[aria-label="Iniciar geração"]';
  const ADD_ELEMENT = '[aria-label="Adicionar elementos à caixa de comando"]';
  const MODE_LABEL = {imagem:'Imagem', video:'Vídeo'};
  const SUBMODE_LABEL = {frames:'Frames', elementos:'Elementos'};
  let delay = 250;

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const text = element => (element.textContent || '').replace(/\s+/g, ' ').trim();
  const overlay = doc => doc.querySelector('.cdk-overlay-container');
  const promptBox = doc => doc.querySelector('.base-prompt-box');

  async function waitFor(find, what, timeout = 5000) {
    const end = Date.now() + timeout;
    for (;;) {
      const found = find();
      if (found) return found;
      if (Date.now() > end) throw new Error(`Flow: ${what} não apareceu.`);
      await sleep(Math.min(100, delay));
    }
  }

  // Os menus do Angular CDK fecham com Escape ouvido no body (no document não funciona).
  function closeOverlays(doc, win) {
    doc.body.dispatchEvent(new win.KeyboardEvent('keydown', {key:'Escape', code:'Escape', keyCode:27, bubbles:true}));
  }

  // Ícones vêm como texto ("crop_9_16 9:16"), então o rótulo é o fim do texto do botão.
  const radio = (doc, label) => Array.from(overlay(doc)?.querySelectorAll('[role="radio"]') || []).find(b => text(b).endsWith(label));

  async function pickRadio(doc, label) {
    const button = await waitFor(() => radio(doc, label), `opção "${label}"`);
    if (button.getAttribute('aria-checked') !== 'true') button.click();
    await waitFor(() => radio(doc, label)?.getAttribute('aria-checked') === 'true', `seleção de "${label}"`);
  }

  function credits(doc) {
    const match = text(overlay(doc) || doc.body).match(/usar (\d+) créditos?/);
    return match ? Number(match[1]) : null;
  }

  // Lista de modelos: botão com "arrow_drop_down" no menu de configurações → item com o nome do modelo.
  async function pickModel(doc, model) {
    const current = () => Array.from(overlay(doc).querySelectorAll('button')).find(b => text(b).includes('arrow_drop_down'));
    const button = await waitFor(current, 'seletor de modelo');
    if (text(button).includes(model)) return;
    button.click();
    const item = await waitFor(() => Array.from(overlay(doc).querySelectorAll('[role="menuitem"], [role="option"], [role="menuitemradio"]')).find(m => text(m).endsWith(model)), `modelo "${model}"`);
    item.click();
    await waitFor(() => text(current() || doc.body).includes(model), `seleção do modelo "${model}"`);
  }

  async function configure(flow, doc = document, win = doc.defaultView, {duracao_s} = {}) {
    const trigger = promptBox(doc)?.querySelector(TRIGGER);
    if (!trigger) throw new Error('Flow: configurações não encontradas. Abra um projeto no Flow.');
    trigger.click();
    await pickRadio(doc, MODE_LABEL[flow.modo]);
    await sleep(delay);
    if (flow.modo === 'video' && flow.submodo) await pickRadio(doc, SUBMODE_LABEL[flow.submodo]);
    await pickRadio(doc, flow.proporcao);
    if (flow.modo === 'video') {
      if (flow.modelo) { await pickModel(doc, flow.modelo); await sleep(delay); }
      if (flow.resolucao) await pickRadio(doc, flow.resolucao);
      if (duracao_s) await pickRadio(doc, `${duracao_s}s`);
    }
    await sleep(delay);
    const cost = credits(doc);
    closeOverlays(doc, win);
    await waitFor(() => !radio(doc, flow.proporcao), 'fechamento do menu');
    return {credits: cost};
  }

  // Seletor de mídia do projeto (Início ou "+"): aba → item → incluir. Em alguns seletores o Flow inclui ao
  // clicar no item e fecha sozinho; em outros pede "Incluir no comando". Tratamos os dois.
  const pickerOpen = doc => !!overlay(doc)?.querySelector('[role="tab"]');
  const options = doc => Array.from(overlay(doc)?.querySelectorAll('[role="option"]') || []);

  async function openPicker(opener, tabLabel, doc) {
    if (!pickerOpen(doc)) opener.click();
    const tab = await waitFor(() => Array.from(overlay(doc)?.querySelectorAll('[role="tab"]') || []).find(t => text(t).endsWith(tabLabel)), `aba "${tabLabel}"`);
    if (tab.getAttribute('aria-selected') !== 'true') { tab.click(); await sleep(delay); }
  }

  async function chooseOption(option, doc) {
    option.click();
    await sleep(delay);
    if (!pickerOpen(doc)) return;
    const include = await waitFor(() => !pickerOpen(doc) || Array.from(overlay(doc).querySelectorAll('button')).find(b => text(b) === 'Incluir no comando'), 'botão "Incluir no comando"');
    if (include !== true) include.click();
    await waitFor(() => !pickerOpen(doc), 'fechamento do seletor');
  }

  // O Flow mostra imagens com extensão ("x.jpg") e vídeos sem ("x"); durante o envio, "Enviando x".
  function sameName(option, name) {
    const label = text(option);
    if (label.startsWith('Enviando')) return false;
    const stem = name.replace(/\.[^.]+$/, '');
    return [name, stem].some(n => label === n || label.endsWith(` ${n}`));
  }

  // Sem nome: o mais recente da aba. Com nome (ex.: imagem âncora), o item com esse nome, se existir.
  async function includeRecent(opener, tabLabel, doc, name = '') {
    await openPicker(opener, tabLabel, doc);
    const option = await waitFor(() => (name && options(doc).find(o => sameName(o, name))) || options(doc)[0], 'mídia no projeto (gere a imagem antes)');
    await chooseOption(option, doc);
  }

  function startSlot(doc) {
    const slot = Array.from(promptBox(doc)?.querySelectorAll('button') || []).find(b => text(b) === 'Início');
    if (!slot) throw new Error('Flow: campo "Início" não encontrado (o modo Vídeo → Frames está ativo?).');
    return slot;
  }

  async function setStartFrame(doc = document) {
    await includeRecent(startSlot(doc), 'Imagens', doc);
  }

  const inEditor = doc => /\/(edit|scene)\//.test(doc.defaultView.location.pathname);
  const videoTiles = doc => Array.from(doc.querySelectorAll('main button')).filter(b => text(b).startsWith('play_circle'));

  // Abre o vídeo mais recente do projeto (o grid lista do mais novo para o mais antigo).
  async function openLatestVideo(doc = document) {
    if (inEditor(doc)) return;
    const tile = await waitFor(() => videoTiles(doc)[0], 'vídeo no projeto (gere o vídeo anterior antes)');
    tile.click();
    await waitFor(() => inEditor(doc) && doc.querySelector('canvas'), 'editor do vídeo');
  }

  // No editor, pula para o fim do clipe e lê o frame direto do canvas do player (sem baixar nada).
  async function captureLastFrame(doc = document, name = 'ultimo_frame.jpg') {
    const end = await waitFor(() => doc.querySelector('[aria-label="Pular para o próximo clipe"]'), 'controles do player');
    end.click();
    await waitFor(() => {
      const times = text(doc.body).match(/\d{2}:\d{2}:\d{2}/g) || [];
      return times.length >= 2 && times[0] === times[1] && times[0] !== '00:00:00';
    }, 'fim do vídeo no player');
    await sleep(Math.max(delay, 500));  // o canvas redesenha depois do seek
    const canvas = await waitFor(() => doc.querySelector('canvas'), 'player do vídeo');
    const blob = await new Promise((resolve, reject) => {
      try { canvas.toBlob(b => b ? resolve(b) : reject(new Error('canvas vazio')), 'image/jpeg', 0.95); }
      catch (error) { reject(new Error(`Flow: não foi possível ler o frame do player (${error.name}).`)); }
    });
    return new File([blob], name, {type:'image/jpeg'});
  }

  async function backToProject(doc = document) {
    if (!inEditor(doc)) return;
    const back = await waitFor(() => doc.querySelector('[aria-label^="Botão \\"Voltar\\""]'), 'botão Voltar');
    back.click();
    await waitFor(() => !inEditor(doc) && promptBox(doc)?.querySelector(TRIGGER), 'página do projeto');
  }

  // Envia um arquivo pelo "Enviar mídia" de um seletor e o inclui no comando. O aviso "Direitos de uso" é do
  // usuário: a extensão nunca clica em "Concordo", só espera ele aceitar (onRights avisa o popup).
  async function uploadAndInclude(opener, tabLabel, file, doc, win, {rightsTimeout = 180000, uploadTimeout = 180000, onRights} = {}) {
    await openPicker(opener, tabLabel, doc);
    const upload = await waitFor(() => Array.from(overlay(doc).querySelectorAll('button')).find(b => text(b).endsWith('Enviar mídia')), 'botão "Enviar mídia"');
    win.postMessage({source:'flow-copiloto', type:'arm-upload', file}, win.location.origin);
    await sleep(Math.max(delay, 100));
    upload.click();
    const rights = () => Array.from(overlay(doc).querySelectorAll('[role="dialog"], mat-dialog-container')).find(d => text(d).includes('Direitos de uso'));
    const uploaded = () => options(doc).find(o => sameName(o, file.name));
    await waitFor(() => rights() || uploaded() || options(doc).some(o => text(o).startsWith('Enviando')), `envio de ${file.name}`, 20000);
    if (rights() && !uploaded()) {
      onRights?.();
      await waitFor(() => !rights(), 'aceite do aviso "Direitos de uso" (clique em Concordo no Flow)', rightsTimeout);
    }
    await chooseOption(await waitFor(uploaded, `${file.name} na lista do Flow`, uploadTimeout), doc);
  }

  async function uploadStartFrame(file, doc = document, win = doc.defaultView, opts = {}) {
    await uploadAndInclude(startSlot(doc), 'Imagens', file, doc, win, opts);
  }

  function addButton(doc) {
    const add = promptBox(doc)?.querySelector(ADD_ELEMENT);
    if (!add) throw new Error('Flow: botão de adicionar elementos não encontrado.');
    return add;
  }

  // Genjutsu: o vídeo fonte (sem áudio, até 10s) entra como elemento pelo "+" → Vídeos.
  async function addVideoElement(file, doc = document, win = doc.defaultView, opts = {}) {
    await uploadAndInclude(addButton(doc), 'Vídeos', file, doc, win, opts);
  }

  async function addImageElement(doc = document, name = '') {
    await includeRecent(addButton(doc), 'Imagens', doc, name);
  }

  // Confirma que o vídeo nasceu: o Flow às vezes some com a geração sem avisar (vimos 503 no status).
  async function waitNewVideo(before, doc = document, timeout = 420000) {
    await waitFor(() => !generating(doc) && videoTiles(doc).length > before, 'novo vídeo no projeto (o Flow pode ter falhado sem aviso)', timeout);
  }

  // Custo atual mostrado pelo Flow (muda com os elementos: vídeo de referência encarece a geração).
  async function readCredits(doc = document, win = doc.defaultView) {
    promptBox(doc).querySelector(TRIGGER).click();
    await waitFor(() => overlay(doc)?.querySelector('[role="radio"]'), 'menu de configurações');
    const cost = credits(doc);
    closeOverlays(doc, win);
    await waitFor(() => !overlay(doc).querySelector('[role="radio"]'), 'fechamento do menu');
    return cost;
  }

  async function attachReference(doc = document) {
    await addImageElement(doc);
  }

  const generating = doc => /\b\d{1,3}%/.test(text(doc.querySelector('main') || doc.body));

  async function generate(doc = document, {wait = false, timeout = 180000} = {}) {
    const button = await waitFor(() => {
      const found = doc.querySelector(GENERATE);
      return found && !found.disabled ? found : null;
    }, 'botão de gerar habilitado');
    button.click();
    if (!wait) return;
    await waitFor(() => generating(doc), 'início da geração', 15000);
    await waitFor(() => !generating(doc), 'fim da geração', timeout);
  }

  global.FlowActions = {configure, setStartFrame, attachReference, generate, credits, generating,
    openLatestVideo, captureLastFrame, backToProject, uploadStartFrame, addVideoElement, addImageElement, readCredits, waitNewVideo, videoTiles: doc => videoTiles(doc).length,
    setDelay(ms) { delay = ms; }};
  if (typeof module !== 'undefined' && module.exports) module.exports = global.FlowActions;
})(globalThis);
