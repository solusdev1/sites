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

  async function saveFields(id, fields) {
    const state = await readState();
    if (!state?.itens) return;
    await global.chrome.storage.local.set({[STORAGE_KEY]: {...state, itens: state.itens.map(item => item.id === id ? {...item, ...fields} : item)}});
  }

  // Frames ficam em chrome.storage (a extensão não lê arquivos do disco): só os mais recentes, pelo limite de espaço.
  const FRAMES_KEY = 'veoFlowFrames';
  const MAX_FRAMES = 2;  // PNG 1080x1920 do Flow real ≈ 1,7 MB; a cota do chrome.storage.local é 10 MB
  async function saveFrame(key, frame) {
    const frames = (await global.chrome.storage.local.get(FRAMES_KEY))[FRAMES_KEY] || {};
    const kept = Object.entries(frames).filter(([k]) => k !== key).slice(-(MAX_FRAMES - 1));
    await global.chrome.storage.local.set({[FRAMES_KEY]: Object.fromEntries([...kept, [key, frame]])});
  }

  function dataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Não foi possível ler o frame.'));
      reader.readAsDataURL(blob);
    });
  }

  // chrome.downloads só existe no service worker (src/background.js): o content script pede o download.
  async function download(url, filename) {
    let result;
    try { result = await global.chrome.runtime.sendMessage({type:'DOWNLOAD', url, filename}); }
    catch (error) { throw new Error(`download indisponível (${error.message}); recarregue a extensão e a aba`); }
    if (!result?.ok) throw new Error(result?.error || 'o Chrome não confirmou o download');
    return result;  // {path, aviso?}: aviso quando o Chrome salvou fora de Downloads/veo3/<persona>/
  }

  const personaId = state => String(state?.persona_id || 'sem_persona').replace(/[^\w.-]+/g, '_');
  const folder = (state, item) => `veo3/${personaId(state)}/${item.id}`;

  // Servidor local (python -m veo_pipeline servir), via service worker. undefined/erro = servidor fora: segue sem ele.
  async function ask(message) {
    try { return await global.chrome.runtime.sendMessage(message); }
    catch { return undefined; }
  }

  // Último frame extraído pelo servidor com ffmpeg do MP4 baixado (preferido ao canvas do player). since: só aceita
  // frame de um MP4 gravado depois desse instante (ms), para não devolver o do vídeo antigo.
  async function serverFrame(persona, id, since = 0) {
    const result = await ask({type:'ULTIMO_FRAME', persona, item_id:id, depois:since});
    if (result?.ok && typeof result.data === 'string' && result.data.startsWith('data:image/png')) return result;
    if (result?.preto) return {preto:true, erro:result.erro || 'último frame quase todo preto'};
    return null;
  }

  async function canvasFrame(doc, name, id, base, fields, avisos) {
    const actions = global.FlowActions;
    try {
      await actions.openVideo(doc, name);
      const file = await actions.captureLastFrame(doc, `${id}_last.png`);
      await actions.backToProject(doc);
      const data = await dataUrl(file);
      await saveFrame(id, {name:file.name, data});
      const png = await download(data, `${base}_last.png`);
      fields.ultimo_frame = png.path;
      fields.frame_fonte = 'canvas';
      if (png.aviso) avisos.push(png.aviso);
      fields.frame_erro = null;
      return null;
    } catch (error) {
      await actions.backToProject(doc).catch(() => {});
      return error;
    }
  }

  // Depois de gerar: baixa o MP4 para Downloads/veo3/<persona>/<item>.mp4 (sobrescreve; com o servidor ligado o
  // anterior vira <item>.vN.mp4) e obtém o último frame <item>_last.png: primeiro do servidor (ffmpeg no MP4), senão
  // do canvas do player com checagem de frame preto. Uma falha não impede a outra.
  async function collect(item, name, doc = document) {
    const actions = global.FlowActions;
    const state = await readState();
    const persona = personaId(state), base = folder(state, item);
    const fields = {}, errors = [], avisos = [];
    let since = null;
    try {
      const src = await actions.videoSource(doc, name);
      const versao = await ask({type:'VERSIONAR', persona, item_id:item.id});
      fields.video_anterior = versao?.ok && versao.anterior ? versao.anterior : null;
      since = Date.now() - 2000;  // folga de relógio/arredondamento do mtime
      const video = await download(src, `${base}.mp4`);
      fields.video_path = video.path;
      fields.download_aviso = video.aviso || null;
      if (video.aviso) avisos.push(video.aviso);
      fields.download_erro = null;
    } catch (error) { since = null; fields.download_erro = error.message; errors.push(`vídeo: ${error.message}`); }
    const fromServer = since === null ? null : await serverFrame(persona, item.id, since);
    if (fromServer?.data) {
      await saveFrame(item.id, {name:`${item.id}_last.png`, data:fromServer.data});
      Object.assign(fields, {ultimo_frame:fromServer.path, frame_fonte:'servidor', frame_erro:null});
    } else {
      if (fromServer?.preto) avisos.push(`o servidor achou o último frame preto (${fromServer.erro}); tentei o player.`);
      const error = await canvasFrame(doc, name, item.id, base, fields, avisos);
      if (error) { fields.frame_erro = error.message; errors.push(`último frame: ${error.message}`); }
    }
    await saveFields(item.id, fields);
    if (errors.length) notify(`Não consegui tudo de "${item.hook || item.id}" (${errors.join('; ')}). Use "Baixar vídeo atual" no popup.`);
    else if (avisos.length) notify(`"${item.hook || item.id}" gerado, mas ${avisos.join(' ')}`);
    else notify(`"${item.hook || item.id}" gerado: vídeo e último frame salvos em Downloads/${base}. Revise e aprove ou rejeite.`, 'success');
    return {ok:!errors.length, ...fields};
  }

  // Depois de preparar, acompanha o clique do usuário em gerar: quando o resultado TERMINA de renderizar, marca
  // 'gerado', guarda o nome da mídia no Flow (flow_midia) e, se for vídeo, baixa o MP4 e o último frame.
  function watchGeneration(item, kind, doc) {
    const actions = global.FlowActions;
    const before = actions.mediaCount(doc, kind);
    const failuresBefore = actions.failures(doc);
    const onWaiting = () => {
      saveFields(item.id, {render:'aguardando'}).catch(() => {});
      notify(`"${item.hook || item.id}": aguardando render… a extensão marca "gerado" quando o Flow terminar.`, 'info');
    };
    const watch = actions.waitNewMedia(kind, before, doc, undefined, failuresBefore, {onWaiting}).then(async name => {
      await saveStatus(item.id, 'gerado', {flow_midia:name, render:null});
      if (kind !== 'video') notify(`"${item.hook || item.id}" gerado no Flow (${name}). Revise e aprove ou rejeite.`, 'success');
      return name;
    }, error => { saveFields(item.id, {render:null}).catch(() => {}); notify(error.message); throw error; });
    watch.catch(() => {});
    FlowContent.lastWatch = watch;
    FlowContent.lastCollect = kind === 'video' ? watch.then(name => collect(item, name, doc)) : null;
    FlowContent.lastCollect?.catch(() => {});
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
  // startFrame: o último frame salvo do item anterior (ou o indicado pelo usuário/QA), enviado pelo popup.
  async function runStep(item, prompt, doc = document, win = doc.defaultView, {video, startFrame} = {}) {
    const actions = global.FlowActions;
    const frame = item.frame_inicial || '';
    // Fila sem `flow` (ex.: semanal): o popup usa o padrão Vídeo → Frames 9:16 e mantém duração/modelo do Flow.
    const duracao_s = item.flow_padrao ? undefined : item.duracao_s;
    const onRights = () => notify('Clique em "Concordo" no aviso de direitos de uso do Flow para continuar.');
    if (startFrame instanceof win.File && item.tipo !== 'genjutsu' && item.tipo !== 'imagem') {
      const {credits} = await actions.configure(item.flow, doc, win, {duracao_s});
      await actions.uploadStartFrame(startFrame, doc, win, {onRights});
      fillOrThrow(prompt, doc, win);
      return ready(item, 'video', credits, doc, `Frame ${startFrame.name} no Início e prompt pronto.`);
    }
    if (item.tipo === 'genjutsu') {
      // Vídeo → Elementos: vídeo fonte (sem áudio, até 10s) + imagem da personagem como elementos.
      if (!(video instanceof win.File)) throw new Error('Escolha o vídeo fonte (sem áudio, até 10s) no popup.');
      await actions.configure(item.flow, doc, win, {duracao_s});
      await actions.addVideoElement(video, doc, win, {onRights});
      await actions.addImageElement(doc, (item.anexos?.imagem_ancora || '').split(/[\\/]/).pop());
      const credits = await actions.readCredits(doc, win);
      fillOrThrow(prompt, doc, win);
      return ready(item, 'video', credits, doc, 'Genjutsu pronto: vídeo fonte e personagem anexados.');
    }
    if (frame.startsWith('ultimo_frame:')) {
      // Último frame do vídeo anterior vira o Início de um vídeo novo (sem "Estender").
      const state = await readState();
      const sourceId = frame.split(':')[1];
      const source = state?.itens?.find(other => other.id === sourceId);
      const fromServer = await serverFrame(personaId(state), sourceId);
      let file;
      if (fromServer?.data) file = await toFile({name:`${sourceId}_last.png`, data:fromServer.data, type:'image/png'});
      else {
        await actions.openVideo(doc, source?.flow_midia || '');
        file = await actions.captureLastFrame(doc, `${sourceId}_last.png`);
        await actions.backToProject(doc);
      }
      const {credits} = await actions.configure(item.flow, doc, win, {duracao_s});
      await actions.uploadStartFrame(file, doc, win, {onRights});
      fillOrThrow(prompt, doc, win);
      return ready(item, 'video', credits, doc, 'Último frame do vídeo anterior no Início e prompt pronto.');
    }
    const {credits} = await actions.configure(item.flow, doc, win, {duracao_s});
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

  // Frame inicial salvo em chrome.storage pela captura (ou escolhido no popup), pela chave de startFrameSource.
  async function loadFrame(key) {
    if (!key) return null;
    const frame = ((await global.chrome.storage.local.get(FRAMES_KEY))[FRAMES_KEY] || {})[key];
    if (!frame) throw new Error('O último frame do vídeo anterior não está salvo. Use "Baixar vídeo atual" nele ou "Usar outro frame".');
    return toFile({...frame, type:'image/png'});
  }

  // "Baixar vídeo atual": refaz download + último frame do item (o vídeo pelo nome gravado; sem nome, o mais recente).
  async function collectById(id, doc = document) {
    const item = (await readState())?.itens?.find(other => other.id === id);
    if (!item) throw new Error(`Item ${id} não encontrado.`);
    return collect(item, item.flow_midia || '', doc);
  }

  const FlowContent = {fillPrompt, runStep, collect, collectById, lastWatch:null, lastCollect:null};
  global.FlowContent = FlowContent;
  if (global.chrome?.runtime?.onMessage) {
    global.chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message?.type === 'FILL_PROMPT') {
        sendResponse(fillPrompt(message.prompt));
        return false;
      }
      if (message?.type === 'RUN_STEP')
        return respond(Promise.all([toFile(message.video), loadFrame(message.startFrameKey)])
          .then(([video, startFrame]) => runStep(message.item, message.prompt, document, window, {video, startFrame})), sendResponse);
      if (message?.type === 'COLLECT') return respond(collectById(message.item_id), sendResponse);
      return false;
    });
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = global.FlowContent;
})(globalThis);
