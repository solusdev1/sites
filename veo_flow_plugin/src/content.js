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
  async function saveStatus(id, status) {
    const storage = global.chrome?.storage?.local;
    if (!storage) return;
    const state = (await storage.get(STORAGE_KEY))[STORAGE_KEY];
    if (!state?.itens) return;
    await storage.set({[STORAGE_KEY]: {...state, itens: state.itens.map(item => item.id === id ? {...item, status} : item)}});
  }

  function fillOrThrow(prompt, doc, win) {
    const result = fillPrompt(prompt, doc, win);
    if (!result.ok) throw new Error(result.error);
  }

  // Imagem: gera sozinho, mas só se o Flow mostrar 0 créditos. Vídeo: prepara e espera confirmação.
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
      await saveStatus(item.id, 'preenchido');
      return {ok:true, status:'preenchido', credits, next:`Genjutsu pronto: vídeo fonte e personagem anexados. Gere o vídeo (${credits ?? '?'} créditos).`};
    }
    if (frame.startsWith('ultimo_frame:')) {
      // Último frame do vídeo anterior vira o Início de um vídeo novo (sem "Estender").
      await actions.openLatestVideo(doc);
      const file = await actions.captureLastFrame(doc, `ultimo_frame_${frame.split(':')[1]}.jpg`);
      await actions.backToProject(doc);
      const {credits} = await actions.configure(item.flow, doc, win, {duracao_s:item.duracao_s});
      await actions.uploadStartFrame(file, doc, win, {onRights});
      fillOrThrow(prompt, doc, win);
      await saveStatus(item.id, 'preenchido');
      return {ok:true, status:'preenchido', credits, next:`Último frame no Início e prompt pronto. Gere o vídeo (${credits ?? '?'} créditos).`};
    }
    const {credits} = await actions.configure(item.flow, doc, win, {duracao_s:item.duracao_s});
    if (item.tipo === 'imagem') {
      if (frame.startsWith('item:')) await actions.attachReference(doc);
      fillOrThrow(prompt, doc, win);
      if (credits !== 0) {
        await saveStatus(item.id, 'preenchido');
        return {ok:true, status:'preenchido', credits, next:`Esta imagem custaria ${credits ?? '?'} créditos; gere manualmente se quiser.`};
      }
      await actions.generate(doc, {wait:true});
      await saveStatus(item.id, 'gerado');
      return {ok:true, status:'gerado', credits, next:'Confira a imagem no Flow. Se não ficou fiel à persona, use "Voltar a pendente" e execute de novo.'};
    }
    if (frame.startsWith('item:')) await actions.setStartFrame(doc);
    fillOrThrow(prompt, doc, win);
    await saveStatus(item.id, 'preenchido');
    return {ok:true, status:'preenchido', credits, next:`Vídeo pronto para gerar (${credits ?? '?'} créditos).`};
  }

  // Só marca 'gerado' quando o vídeo novo aparece no projeto; falha silenciosa do Flow vira erro.
  async function generateVideo(item, doc = document, {timeout} = {}) {
    const before = global.FlowActions.videoTiles(doc);
    await global.FlowActions.generate(doc);
    await global.FlowActions.waitNewVideo(before, doc, timeout);
    await saveStatus(item.id, 'gerado');
    return {ok:true, status:'gerado'};
  }

  function notify(text) {
    try { global.chrome?.runtime?.sendMessage?.({type:'FLOW_NOTICE', text})?.catch?.(() => {}); } catch { /* popup fechado */ }
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

  global.FlowContent = {fillPrompt, runStep, generateVideo};
  if (global.chrome?.runtime?.onMessage) {
    global.chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message?.type === 'FILL_PROMPT') {
        sendResponse(fillPrompt(message.prompt));
        return false;
      }
      if (message?.type === 'RUN_STEP') return respond(toFile(message.video).then(video => runStep(message.item, message.prompt, document, window, {video})), sendResponse);
      if (message?.type === 'GENERATE_VIDEO') return respond(generateVideo(message.item), sendResponse);
      return false;
    });
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = global.FlowContent;
})(globalThis);
