import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const read = name => readFileSync(new URL(`../src/${name}`, import.meta.url), 'utf8');
const scripts = ['field-selection.js', 'flow-actions.js', 'content.js'].map(read);
// Cada passo deixa um acompanhamento esperando o clique do usuário: fechar a janela encerra os timers.
const windows = [];
test.afterEach(() => { while (windows.length) windows.pop().close(); });

// Flow falso com o comportamento mapeado no Flow real (2026-10-18): menu de radios do Angular CDK que fecha com
// Escape no body, seletor de mídia com abas/opções/"Incluir no comando", geração com "%" e Estender no editor de cena.
function flow({credits = {imagem: 0, video: 15}, videos = 0, failSilently = false, rights = true, images = ['Woman standing in studio']} = {}) {
  const dom = new JSDOM(`<main><div class="grid"></div><div class="editor"></div></main>
    <div class="base-prompt-box"><div class="slots"></div>
      <div class="ProseMirror" contenteditable="true" role="textbox" aria-label="O que você quer criar?"><p><br></p></div>
      <button aria-label="Adicionar elementos à caixa de comando">add</button>
      <button aria-label="Gatilho de configurações">cfg</button>
      <button aria-label="Iniciar geração" disabled>arrow_forward</button></div>
    <div class="cdk-overlay-container"></div>`, {url:'https://flow.google.com/project/x', runScripts:'outside-only'});
  const {window} = dom, doc = window.document;
  const store = {};
  const log = [];
  window.chrome = {storage:{local:{get: async key => ({[key]: store[key]}), set: async obj => Object.assign(store, obj)}}};
  const overlay = doc.querySelector('.cdk-overlay-container');
  const box = doc.querySelector('.base-prompt-box');
  const generate = box.querySelector('[aria-label="Iniciar geração"]');
  const config = {modo:'imagem', submodo:'elementos', proporcao:'16:9', modelo:'Veo 3.1 - Lite', resolucao:'360p', duracao:'8s'};
  const editor = box.querySelector('.ProseMirror');
  const refreshButton = () => { generate.disabled = !editor.textContent.trim(); };
  editor.addEventListener('input', refreshButton);

  function radio(group, label, icon) {
    const b = doc.createElement('button');
    b.setAttribute('role', 'radio');
    b.textContent = `${icon} ${label}`;
    b.setAttribute('aria-checked', String(config[group] === label));
    b.addEventListener('click', () => { config[group] = label; log.push(`radio:${label}`); renderMenu(); });
    return b;
  }
  function renderMenu() {
    overlay.replaceChildren();
    const modes = {Imagem:'imagem', 'Vídeo':'video'};
    for (const label of Object.keys(modes)) {
      const b = radio('modo', label, label === 'Imagem' ? 'image' : 'videocam');
      b.setAttribute('aria-checked', String(config.modo === modes[label]));
      b.addEventListener('click', () => { config.modo = modes[label]; renderMenu(); });
      overlay.append(b);
    }
    if (config.modo === 'video') for (const label of ['Frames', 'Elementos']) {
      const b = radio('submodo', label, 'crop_free');
      b.setAttribute('aria-checked', String(config.submodo === label.toLowerCase()));
      b.addEventListener('click', () => { config.submodo = label.toLowerCase(); renderMenu(); });
      overlay.append(b);
    }
    for (const r of config.modo === 'video' ? ['16:9', '9:16'] : ['16:9', '4:3', '1:1', '3:4', '9:16']) overlay.append(radio('proporcao', r, 'crop'));
    if (config.modo === 'video') {
      const model = doc.createElement('button');
      model.textContent = `${config.modelo} arrow_drop_down`;
      model.addEventListener('click', () => {
        for (const name of ['Omni 1.1 Flash', 'Veo 3.1 - Lite', 'Veo 3.1 - Fast']) {
          const m = doc.createElement('button');
          m.setAttribute('role', 'menuitem');
          m.textContent = `volume_up ${name}`;
          m.addEventListener('click', () => { config.modelo = name; log.push(`modelo:${name}`); renderMenu(); });
          overlay.append(m);
        }
      });
      overlay.append(model);
      for (const r of ['360p', '720p']) overlay.append(radio('resolucao', r, 'hd'));
      for (const r of ['4s', '6s', '8s', '10s']) overlay.append(radio('duracao', r, 'timer'));
    }
    const cost = doc.createElement('span');
    cost.textContent = `A geração vai usar ${credits[config.modo] + (elements.some(e => e.video) ? 5 : 0)} créditos`;
    overlay.append(cost);
  }
  box.querySelector('[aria-label="Gatilho de configurações"]').addEventListener('click', renderMenu);
  doc.body.addEventListener('keydown', event => { if (event.key === 'Escape') overlay.replaceChildren(); });

  let picker = function (onInclude) {
    overlay.replaceChildren();
    for (const label of ['image Imagens', 'drive_folder_upload Envios']) {
      const t = doc.createElement('div');
      t.setAttribute('role', 'tab');
      t.textContent = label;
      t.setAttribute('aria-selected', String(label.endsWith('Imagens')));
      overlay.append(t);
    }
    const option = doc.createElement('button');
    option.setAttribute('role', 'option');
    option.textContent = 'Woman standing in studio';
    option.addEventListener('click', () => log.push('option'));
    const include = doc.createElement('button');
    include.textContent = 'Incluir no comando';
    include.addEventListener('click', () => { onInclude(); overlay.replaceChildren(); });
    overlay.append(option, include);
  };
  const elements = [];
  box.querySelector('[aria-label="Adicionar elementos à caixa de comando"]').addEventListener('click', () => plusPicker());
  const slots = box.querySelector('.slots');
  const renderSlots = () => {
    slots.replaceChildren();
    if (config.modo === 'video' && config.submodo === 'frames') {
      const start = doc.createElement('button');
      start.textContent = 'Início';
      start.addEventListener('click', () => picker(() => log.push('frame-inicial')));
      slots.append(start);
    }
  };
  new window.MutationObserver(renderSlots).observe(overlay, {childList:true});
  const grid = doc.querySelector('.grid');
  // Como no Flow real: flow-grid-tile-container[aria-label] > flow-video-tile|flow-image-tile > .container (abre o
  // editor) + rodapé div[role=button] com o nome (clicar no rodapé NÃO abre nada). Mais recente primeiro.
  const addTile = (name, icon = 'play_circle') => {
    const tile = doc.createElement('flow-grid-tile-container');
    tile.setAttribute('role', 'group');
    tile.setAttribute('aria-label', name);
    const kind = doc.createElement(icon === 'play_circle' ? 'flow-video-tile' : 'flow-image-tile');
    kind.innerHTML = `<div class="container"><img src="https://flow.google.com/asb/thumb"></div><div role="button" aria-label="${name}">${icon} ${name}</div>`;
    if (icon === 'play_circle') {
      const container = kind.querySelector('.container');
      container.addEventListener('click', () => openEditor(name));
      // Como no Flow real: o <video> só existe enquanto o mouse está sobre o tile.
      container.addEventListener('mouseenter', () => { container.innerHTML = `<video src="https://flow.google.com/asb/video-${encodeURIComponent(name)}"></video>`; });
    }
    tile.append(kind);
    grid.prepend(tile);
  };
  for (let i = 1; i <= videos; i++) addTile(`Video ${i}`);
  function openEditor(name) {
    window.history.pushState({}, '', '/project/x/edit/v');
    const ed = doc.querySelector('.editor');
    // Como no Flow real: o player começa em 00:00:00 / 00:00:00 e só aceita "pular" depois de carregar.
    ed.innerHTML = '<button aria-label="Botão &quot;Voltar&quot; para acessar a página anterior">arrow_back</button><canvas width="1080" height="1920"></canvas><span class="t">00:00:00 / 00:00:00</span><button aria-label="Pular para o próximo clipe">skip_next</button>';
    setTimeout(() => { const t = ed.querySelector('.t'); if (t) t.textContent = '00:00:00 / 00:08:00'; }, 25);
    ed.querySelector('canvas').toBlob = cb => { log.push(`frame:${ed.querySelector('.t').textContent}`); cb(new window.Blob(['jpg'], {type:'image/jpeg'})); };
    ed.querySelector('[aria-label="Pular para o próximo clipe"]').addEventListener('click', () => { const t = ed.querySelector('.t'); if (!t.textContent.endsWith('00:00:00')) t.textContent = '00:08:00 / 00:08:00'; });
    ed.querySelector('button').addEventListener('click', () => { window.history.pushState({}, '', '/project/x'); ed.replaceChildren(); log.push('voltar'); });
    log.push(`abriu:${name}`);
  }
  let armed = null;
  window.addEventListener('message', event => { if (event.data?.type === 'arm-upload') armed = event.data.file; });
  const origPicker = picker;
  picker = onInclude => {
    origPicker(onInclude);
    const up = doc.createElement('button');
    up.textContent = 'upload Enviar mídia';
    up.addEventListener('click', () => setTimeout(() => {
      if (!armed) return;
      const file = armed; armed = null;
      log.push(`upload:${file.name}`);
      const showOption = () => {
        const option = doc.createElement('button');
        option.setAttribute('role', 'option');
        option.textContent = file.name;
        option.addEventListener('click', () => log.push(`selecionou:${file.name}`));
        overlay.querySelector('[role="option"]').before(option);
      };
      if (!rights) return showOption();
      const dialog = doc.createElement('div');
      dialog.setAttribute('role', 'dialog');
      dialog.innerHTML = 'Direitos de uso desta imagem <button>Cancelar</button><button>Concordo</button>';
      dialog.lastChild.addEventListener('click', () => { dialog.remove(); showOption(); log.push('concordo(usuario)'); });
      overlay.append(dialog);
    }, 5));
    overlay.prepend(up);
  };
  // Seletor do "+" como no Flow real: abas Imagens/Vídeos, clicar no item já inclui e fecha; envio mostra
  // "Enviando x" e o vídeo aparece sem extensão.
  const library = {Imagens: [...images], 'Vídeos': ['Woman walking toward camera']};
  function plusPicker(tab = 'Imagens') {
    overlay.replaceChildren();
    for (const label of ['image Imagens', 'videocam Vídeos']) {
      const t = doc.createElement('div');
      t.setAttribute('role', 'tab');
      t.textContent = label;
      t.setAttribute('aria-selected', String(label.endsWith(tab)));
      t.addEventListener('click', () => plusPicker(label.split(' ')[1]));
      overlay.append(t);
    }
    const up = doc.createElement('button');
    up.textContent = 'upload Enviar mídia';
    up.addEventListener('click', () => setTimeout(() => {
      if (!armed) return;
      const file = armed; armed = null;
      const video = file.type.startsWith('video/');
      log.push(`upload:${file.name}`);
      const pending = doc.createElement('button');
      pending.setAttribute('role', 'option');
      pending.textContent = `Enviando ${file.name.replace(/\.[^.]+$/, '')}`;
      overlay.querySelector('[role="option"]').before(pending);
      const finish = () => setTimeout(() => {
        pending.textContent = video ? file.name.replace(/\.[^.]+$/, '') : file.name;
        library[video ? 'Vídeos' : 'Imagens'].unshift(pending.textContent);
        pending.addEventListener('click', () => { elements.push({name:pending.textContent, video}); log.push(`elemento:${pending.textContent}`); overlay.replaceChildren(); });
      }, 20);
      if (!rights) return finish();
      const dialog = doc.createElement('div');
      dialog.setAttribute('role', 'dialog');
      dialog.innerHTML = 'Direitos de uso deste vídeo <button>Cancelar</button><button>Concordo</button>';
      dialog.lastChild.addEventListener('click', () => { dialog.remove(); log.push('concordo(usuario)'); finish(); });
      overlay.append(dialog);
    }, 5));
    overlay.append(up);
    for (const name of library[tab]) {
      const option = doc.createElement('button');
      option.setAttribute('role', 'option');
      option.textContent = tab === 'Vídeos' ? `videocam ${name}` : name;
      option.addEventListener('click', () => { elements.push({name, video: tab === 'Vídeos'}); log.push(`elemento:${name}`); overlay.replaceChildren(); });
      overlay.append(option);
    }
  }

  generate.addEventListener('click', () => {
    log.push('gerar');
    const progress = doc.createElement('span');
    progress.textContent = '42%';
    grid.prepend(progress);
    setTimeout(() => {
      progress.remove();
      if (failSilently) { const card = doc.createElement('div'); card.textContent = 'Falha Não é possível editar a fala neste vídeo.'; grid.prepend(card); return; }
      addTile(config.modo === 'video' ? 'Novo video' : 'Nova imagem', config.modo === 'video' ? 'play_circle' : 'image');
    }, 30);
  });
  for (const s of scripts) window.eval(s);
  window.FlowActions.setDelay(1);
  windows.push(window);
  store.veoFlowState = {version:1, itens:[{id:'a', status:'pendente'}]};
  return {window, doc, config, log, store, editor, elements};
}

const imagem = {id:'a', tipo:'imagem', flow:{modo:'imagem', proporcao:'9:16', submodo:null}, frame_inicial:''};
const video = {id:'a', tipo:'veo', duracao_s:10, flow:{modo:'video', proporcao:'9:16', submodo:'frames', modelo:'Omni 1.1 Flash', resolucao:'720p'}, frame_inicial:'item:img'};
const status = f => f.store.veoFlowState.itens[0].status;
// O Flow só aceita clique real no botão de gerar: nos testes, o "usuário" clica.
const userClicksGenerate = f => f.doc.querySelector('[aria-label="Iniciar geração"]').click();

test('imagem: configura Imagem 9:16, preenche, NÃO clica em gerar; marca gerado quando o usuário gera', async () => {
  const f = flow();
  const r = await f.window.FlowContent.runStep(imagem, 'Retrato da Luna', f.doc, f.window);
  assert.equal(r.status, 'preenchido');
  assert.equal(r.credits, 0);
  assert.match(r.next, /Clique na seta de gerar/);
  assert.deepEqual({modo:f.config.modo, proporcao:f.config.proporcao}, {modo:'imagem', proporcao:'9:16'});
  assert.equal(f.editor.textContent, 'Retrato da Luna');
  assert.ok(!f.log.includes('gerar'));
  assert.equal(f.doc.querySelector('.cdk-overlay-container').children.length, 0);
  assert.equal(status(f), 'preenchido');
  userClicksGenerate(f);
  assert.equal(await f.window.FlowContent.lastWatch, 'Nova imagem');
  assert.equal(status(f), 'gerado');
  assert.equal(f.store.veoFlowState.itens[0].flow_midia, 'Nova imagem');
});

test('imagem com referência anexa a imagem anterior', async () => {
  const f = flow();
  await f.window.FlowContent.runStep({...imagem, frame_inicial:'item:ref'}, '1º frame', f.doc, f.window);
  assert.ok(f.log.includes('elemento:Woman standing in studio'));
  assert.ok(!f.log.includes('gerar'));
});

test('imagem com custo mostra os créditos e também espera o clique do usuário', async () => {
  const f = flow({credits:{imagem:5, video:10}});
  const r = await f.window.FlowContent.runStep(imagem, 'Retrato', f.doc, f.window);
  assert.equal(r.status, 'preenchido');
  assert.equal(r.credits, 5);
  assert.match(r.next, /5 créditos/);
  assert.ok(!f.log.includes('gerar'));
});

test('vídeo: Vídeo → Frames, Omni 720p 10s, frame inicial da imagem mais recente, preenche e NÃO gera', async () => {
  const f = flow();
  const r = await f.window.FlowContent.runStep(video, 'Luna abre a porta', f.doc, f.window);
  assert.equal(r.status, 'preenchido');
  assert.equal(r.credits, 15);
  assert.deepEqual({...f.config}, {modo:'video', submodo:'frames', proporcao:'9:16', modelo:'Omni 1.1 Flash', resolucao:'720p', duracao:'10s'});
  assert.ok(f.log.includes('frame-inicial'));
  assert.ok(!f.log.includes('gerar'));
  assert.equal(f.editor.textContent, 'Luna abre a porta');
});

test('vídeo seguinte: abre o vídeo anterior PELO NOME gravado, captura o último frame, sobe no Início e espera o Concordo', async () => {
  const f = flow({videos: 2});
  // 'Video 2' é o mais recente, mas o item de origem registrou 'Video 1' (ex.: um envio entrou no meio).
  f.store.veoFlowState.itens.push({id:'v1', status:'gerado', flow_midia:'Video 1'});
  const notices = [];
  f.window.chrome.runtime = {sendMessage: async m => { notices.push(m.text); f.doc.querySelector('[role="dialog"] button:last-child')?.click(); }};
  const r = await f.window.FlowContent.runStep({...video, frame_inicial:'ultimo_frame:v1'}, 'Ela diz Siga-nos', f.doc, f.window);
  assert.equal(r.status, 'preenchido');
  const order = ['abriu:Video 1', 'frame:00:08:00 / 00:08:00', 'voltar', 'radio:9:16', 'upload:v1_last.png', 'concordo(usuario)', 'selecionou:v1_last.png'];
  assert.deepEqual(f.log.filter(l => order.includes(l)), order);
  assert.ok(f.log.indexOf('modelo:Omni 1.1 Flash') < f.log.indexOf('upload:v1_last.png'));
  assert.match(notices[0], /Concordo/);
  assert.ok(!f.log.includes('gerar'));
  assert.equal(f.editor.textContent, 'Ela diz Siga-nos');
  assert.equal(f.window.location.pathname, '/project/x');
});

test('sem nome gravado, o vídeo seguinte usa o vídeo mais recente', async () => {
  const f = flow({videos: 2, rights:false});
  await f.window.FlowContent.runStep({...video, frame_inicial:'ultimo_frame:v1'}, 'p', f.doc, f.window);
  assert.ok(f.log.includes('abriu:Video 2'));
});

test('acompanhamento: vídeo novo após o clique do usuário vira gerado; card "Falha" do Flow vira erro e mantém preenchido', async () => {
  const ok = flow({videos: 1});
  await ok.window.FlowContent.runStep(video, 'p', ok.doc, ok.window);
  userClicksGenerate(ok);
  assert.equal(await ok.window.FlowContent.lastWatch, 'Novo video');
  assert.equal(status(ok), 'gerado');
  const falha = flow({videos: 1, failSilently: true});
  const notices = [];
  falha.window.chrome.runtime = {sendMessage: async m => notices.push(m.text)};
  await falha.window.FlowContent.runStep(video, 'p', falha.doc, falha.window);
  userClicksGenerate(falha);
  await assert.rejects(falha.window.FlowContent.lastWatch, /geração falhou/);
  assert.equal(status(falha), 'preenchido');
  assert.match(notices.at(-1), /Falha/);
});

const genjutsu = {id:'a', tipo:'genjutsu', modo:'motion', duracao_s:10, anexos:{imagem_ancora:'', video_fonte:'trend_mudo.mp4'},
  flow:{modo:'video', proporcao:'9:16', submodo:'elementos', modelo:'Omni 1.1 Flash', resolucao:'720p'}, frame_inicial:''};

test('genjutsu: Elementos + Omni, sobe o vídeo fonte (espera Enviando e o Concordo), anexa a personagem e lê o custo real', async () => {
  const f = flow();
  const notices = [];
  f.window.chrome.runtime = {sendMessage: async m => { notices.push(m.text); f.doc.querySelector('[role="dialog"] button:last-child').click(); }};
  await assert.rejects(f.window.FlowContent.runStep(genjutsu, 'p', f.doc, f.window), /vídeo fonte/);
  const video = new f.window.File(['mp4'], 'trend_mudo.mp4', {type:'video/mp4'});
  const r = await f.window.FlowContent.runStep(genjutsu, 'Recrie com a Luna. Sem fala', f.doc, f.window, {video});
  assert.equal(r.status, 'preenchido');
  assert.equal(r.credits, 20);  // 15 + vídeo de referência, como no Flow real
  assert.deepEqual({modo:f.config.modo, submodo:f.config.submodo, modelo:f.config.modelo, resolucao:f.config.resolucao}, {modo:'video', submodo:'elementos', modelo:'Omni 1.1 Flash', resolucao:'720p'});
  assert.deepEqual(f.elements, [{name:'trend_mudo', video:true}, {name:'Woman standing in studio', video:false}]);
  assert.match(notices[0], /Concordo/);
  assert.ok(!f.log.includes('gerar'));
  assert.equal(f.editor.textContent, 'Recrie com a Luna. Sem fala');
  assert.equal(status(f), 'preenchido');
});

test('genjutsu usa a imagem âncora pelo nome quando ela existe; senão, a mais recente', async () => {
  const comAncora = flow({rights:false, images:['Imagem recente', 'luna_ref.png']});
  const video = new comAncora.window.File(['mp4'], 'trend_mudo.mp4', {type:'video/mp4'});
  const item = {...genjutsu, anexos:{...genjutsu.anexos, imagem_ancora:String.raw`C:\fotos\luna_ref.png`}};
  await comAncora.window.FlowContent.runStep(item, 'p', comAncora.doc, comAncora.window, {video});
  assert.equal(comAncora.elements[1].name, 'luna_ref.png');
  const semAncora = flow({rights:false, images:['Imagem recente', 'outra.png']});
  await semAncora.window.FlowContent.runStep(item, 'p', semAncora.doc, semAncora.window, {video: new semAncora.window.File(['mp4'], 'trend_mudo.mp4', {type:'video/mp4'})});
  assert.equal(semAncora.elements[1].name, 'Imagem recente');
});

test('arquivo que já está no projeto com o mesmo nome é reaproveitado, sem reenviar', async () => {
  const f = flow({rights:false});
  const video = new f.window.File(['mp4'], 'Woman walking toward camera.mp4', {type:'video/mp4'});
  await f.window.FlowContent.runStep(genjutsu, 'p', f.doc, f.window, {video});
  assert.ok(!f.log.some(l => l.startsWith('upload:')));
  assert.deepEqual(f.elements[0], {name:'Woman walking toward camera', video:true});
});

// Download pedido ao service worker: o teste faz o papel dele e devolve o caminho final no disco.
function fakeBackground(f) {
  const downloads = [];
  f.window.chrome.runtime = {sendMessage: async m => {
    if (m.type !== 'DOWNLOAD') return undefined;
    downloads.push(m);
    return {ok:true, path:`Downloads/${m.filename}`};
  }};
  return downloads;
}

test('bug 1: ao detectar o vídeo gerado, baixa o MP4 para Downloads/veo3/<persona>/<item>.mp4 e registra o caminho', async () => {
  const f = flow({videos: 1, rights:false});
  f.store.veoFlowState.persona_id = 'maya';
  const downloads = fakeBackground(f);
  await f.window.FlowContent.runStep(video, 'p', f.doc, f.window);
  userClicksGenerate(f);
  assert.equal(await f.window.FlowContent.lastWatch, 'Novo video');
  const result = await f.window.FlowContent.lastCollect;
  assert.equal(result.ok, true);
  assert.deepEqual({...downloads[0]}, {type:'DOWNLOAD', url:'https://flow.google.com/asb/video-Novo%20video', filename:'veo3/maya/a.mp4'});
  const item = f.store.veoFlowState.itens[0];
  assert.equal(item.status, 'gerado');
  assert.equal(item.video_path, 'Downloads/veo3/maya/a.mp4');
  assert.equal(item.download_erro, null);
});

test('bug 2: captura o último frame do vídeo gerado, salva <item>_last.png e o usa no Início do próximo item', async () => {
  const f = flow({videos: 1, rights:false});
  f.store.veoFlowState.persona_id = 'maya';
  const downloads = fakeBackground(f);
  await f.window.FlowContent.runStep(video, 'p', f.doc, f.window);
  userClicksGenerate(f);
  await f.window.FlowContent.lastCollect;
  assert.ok(f.log.includes('abriu:Novo video'));
  assert.ok(f.log.includes('frame:00:08:00 / 00:08:00'));
  assert.equal(f.window.location.pathname, '/project/x');  // voltou ao projeto
  assert.equal(downloads[1].filename, 'veo3/maya/a_last.png');
  assert.match(downloads[1].url, /^data:image\/png;base64,/);
  assert.equal(f.store.veoFlowState.itens[0].ultimo_frame, 'Downloads/veo3/maya/a_last.png');
  assert.equal(f.store.veoFlowFrames.a.name, 'a_last.png');
  f.log.length = 0;
  const next = {...video, id:'b', frame_inicial:''};
  f.store.veoFlowState.itens.push({id:'b', status:'pendente'});
  const startFrame = new f.window.File(['png'], 'a_last.png', {type:'image/png'});
  const r = await f.window.FlowContent.runStep(next, 'continua', f.doc, f.window, {startFrame});
  assert.equal(r.status, 'preenchido');
  assert.ok(f.log.includes('upload:a_last.png'));
  assert.ok(f.log.includes('selecionou:a_last.png'));
  assert.ok(!f.log.some(l => l.startsWith('abriu:')));
  assert.ok(!f.log.includes('gerar'));
});

test('download que falha não impede o último frame, avisa e o "Baixar vídeo atual" refaz pelo nome gravado', async () => {
  const f = flow({videos: 1, rights:false});
  const notices = [];
  f.window.chrome.runtime = {sendMessage: async m => m.type === 'DOWNLOAD'
    ? (m.filename.endsWith('.mp4') ? {ok:false, error:'SERVER_FORBIDDEN'} : {ok:true, path:m.filename})
    : notices.push(m.text)};
  await f.window.FlowContent.runStep(video, 'p', f.doc, f.window);
  userClicksGenerate(f);
  const result = await f.window.FlowContent.lastCollect;
  assert.equal(result.ok, false);
  assert.equal(f.store.veoFlowState.itens[0].download_erro, 'SERVER_FORBIDDEN');
  assert.equal(f.store.veoFlowState.itens[0].ultimo_frame, 'veo3/sem_persona/a_last.png');
  assert.match(notices.at(-1), /Baixar vídeo atual/);
  f.window.chrome.runtime = {sendMessage: async m => m.type === 'DOWNLOAD' ? {ok:true, path:m.filename} : undefined};
  const again = await f.window.FlowContent.collectById('a', f.doc);
  assert.equal(again.ok, true);
  assert.equal(f.store.veoFlowState.itens[0].video_path, 'veo3/sem_persona/a.mp4');
});

test('fila sem flow (padrão Vídeo → Frames): não força a duração do item', async () => {
  const f = flow({rights:false});
  const r = await f.window.FlowContent.runStep({id:'a', tipo:'veo', duracao_s:6, flow:{modo:'video', proporcao:'9:16', submodo:'frames'}, flow_padrao:true, frame_inicial:''}, 'p', f.doc, f.window);
  assert.equal(r.status, 'preenchido');
  assert.equal(f.config.duracao, '8s');  // ficou o que o Flow já tinha
});
