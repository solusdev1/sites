(function (global) {
  function setPrompt(field, prompt, win) {
    field.focus();
    if (field.matches('textarea, input')) {
      const prototype = field.matches('textarea') ? win.HTMLTextAreaElement.prototype : win.HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
      if (setter) setter.call(field, prompt);
      else field.value = prompt;
    } else {
      field.textContent = prompt;
    }
    const inputEvent = typeof win.InputEvent === 'function'
      ? new win.InputEvent('input', {bubbles:true, inputType:'insertText', data:prompt})
      : new win.Event('input', {bubbles:true});
    field.dispatchEvent(inputEvent);
    field.dispatchEvent(new win.Event('change', {bubbles:true}));
  }

  function fillPrompt(prompt, doc = document, win = doc.defaultView) {
    if (typeof prompt !== 'string' || !prompt.trim()) return {ok:false, error:'O prompt está vazio.'};
    const field = global.FlowFieldSelection.findPromptField(doc, win);
    if (!field) return {ok:false, error:'Campo de prompt não encontrado nesta página. Abra o editor do Flow ou Gemini e tente novamente.'};
    try {
      setPrompt(field, prompt, win);
      return {ok:true};
    } catch (error) {
      return {ok:false, error:`Não foi possível preencher o campo de prompt: ${error.message}`};
    }
  }

  const STORAGE_KEY = 'veoFlowState';

  // O content script grava o status sozinho: o popup pode fechar no meio da geração.
  async function readState() {
    const storage = global.chrome?.storage?.local;
    return storage ? (await storage.get(STORAGE_KEY))[STORAGE_KEY] : null;
  }

  async function saveStatus(id, status, extra = {}) {
    const state = await readState();
    if (!state?.itens) return;
    await global.chrome.storage.local.set({[STORAGE_KEY]: {...state, itens: state.itens.map(item => item.id === id ? {...item, ...extra, status} : item)}});
  }

  // Depois de preparar, acompanha o clique do usuário em gerar: quando o resultado aparece, marca 'gerado'
  // e guarda o nome da mídia no Flow (flow_midia), usado para achar o vídeo certo no passo seguinte.
  function watchGeneration(item, kind, doc) {
    const actions = global.FlowActions;
    const before = actions.mediaCount(doc, kind);
    const failuresBefore = actions.failures(doc);
    const watch = actions.waitNewMedia(kind, before, doc, undefined, failuresBefore).then(async name => {
      await saveStatus(item.id, 'gerado', {flow_midia:name});
      notify(`"${item.hook || item.id}" gerado no Flow (${name}).`, 'success');
      return name;
    }, error => { notify(error.message); throw error; });
    watch.catch(() => {});
    FlowContent.lastWatch = watch;
    return watch;
  }

  async function ready(item, kind, credits, doc, intro) {
    await saveStatus(item.id, 'preenchido');
    watchGeneration(item, kind, doc);
    const cost = credits === 0 ? '0 créditos' : `${credits ?? '?'} créditos`;
    return {ok:true, status:'preenchido', credits,
      next:`${intro} Clique na seta de gerar no Flow (${cost}); a extensão acompanha e marca "gerado" quando o resultado aparecer.`};
  }

  function fillOrThrow(prompt, doc, win) {
    const result = fillPrompt(prompt, doc, win);
    if (!result.ok) throw new Error(result.error);
  }

  // Prepara o passo inteiro no Flow; o clique em gerar é do usuário (o Flow ignora cliques sintéticos).
  async function runStep(item, prompt, doc = document, win = doc.defaultView, {video} = {}) {
    const actions = global.FlowActions;
    const frame = item.frame_inicial || '';
    const onRights = () => notify('Clique em "Concordo" no aviso de direitos de uso do Flow para continuar.');
    if (item.tipo === 'genjutsu') {
      // Vídeo → Elementos: vídeo fonte (sem áudio, até 10s) + imagem da personagem como elementos.
      if (!(video instanceof win.File)) throw new Error('Escolha o vídeo fonte (sem áudio, até 10s) no popup.');
      await actions.configure(item.flow, doc, win, {duracao_s:item.duracao_s});
      await actions.addVideoElement(video, doc, win, {onRights});
      await actions.addImageElement(doc, (item.anexos?.imagem_ancora || '').split(/[\\/]/).pop());
      const credits = await actions.readCredits(doc, win);
      fillOrThrow(prompt, doc, win);
      return ready(item, 'video', credits, doc, 'Genjutsu pronto: vídeo fonte e personagem anexados.');
    }
    if (frame.startsWith('ultimo_frame:')) {
      // Último frame do vídeo anterior vira o Início de um vídeo novo (sem "Estender").
      const source = (await readState())?.itens?.find(other => other.id === frame.split(':')[1]);
      await actions.openVideo(doc, source?.flow_midia || '');
      const file = await actions.captureLastFrame(doc, `ultimo_frame_${frame.split(':')[1]}.jpg`);
      await actions.backToProject(doc);
      const {credits} = await actions.configure(item.flow, doc, win, {duracao_s:item.duracao_s});
      await actions.uploadStartFrame(file, doc, win, {onRights});
      fillOrThrow(prompt, doc, win);
      return ready(item, 'video', credits, doc, 'Último frame do vídeo anterior no Início e prompt pronto.');
    }
    const {credits} = await actions.configure(item.flow, doc, win, {duracao_s:item.duracao_s});
    if (item.tipo === 'imagem') {
      if (frame.startsWith('item:')) await actions.attachReference(doc);
      fillOrThrow(prompt, doc, win);
      return ready(item, 'imagem', credits, doc, 'Imagem pronta (confira a fidelidade à persona depois de gerar).');
    }
    if (frame.startsWith('item:')) await actions.setStartFrame(doc);
    fillOrThrow(prompt, doc, win);
    return ready(item, 'video', credits, doc, 'Vídeo pronto.');
  }

  function notify(text, kind = 'error') {
    try { global.chrome?.runtime?.sendMessage?.({type:'FLOW_NOTICE', text, kind})?.catch?.(() => {}); } catch { /* popup fechado */ }
  }

  // O popup manda o vídeo fonte como data URL (mensagens da extensão não carregam File).
  async function toFile(video) {
    if (!video?.data) return null;
    const blob = await (await fetch(video.data)).blob();
    return new File([blob], video.name, {type:video.type || blob.type});
  }

  const respond = (promise, sendResponse) => {
    promise.then(sendResponse, error => sendResponse({ok:false, error:error.message}));
    return true;
  };

  const FlowContent = {fillPrompt, runStep, lastWatch:null};
  global.FlowContent = FlowContent;
  if (global.chrome?.runtime?.onMessage) {
    global.chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message?.type === 'FILL_PROMPT') {
        sendResponse(fillPrompt(message.prompt));
        return false;
      }
      if (message?.type === 'RUN_STEP') return respond(toFile(message.video).then(video => runStep(message.item, message.prompt, document, window, {video})), sendResponse);
      return false;
    });
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = global.FlowContent;
})(globalThis);
