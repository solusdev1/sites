import { emptyState, mergeQueue, parseQueue, parsePersona, setPersona, nextStep, markStatus } from './queue.js';
import { buildPrompt, requiredAttachments } from './prompt.js';

const STORAGE_KEY = 'veoFlowState';
const $ = selector => document.querySelector(selector);
let state = emptyState();
let busy = false;

function feedback(message, kind = 'success') {
  const element = $('#feedback');
  element.textContent = message;
  element.dataset.kind = kind;
}

async function save(next) {
  await chrome.storage.local.set({[STORAGE_KEY]: next});
  state = next;
  render();
}

function button(label, onClick) {
  const element = document.createElement('button');
  element.type = 'button';
  element.textContent = label;
  element.addEventListener('click', onClick);
  return element;
}

function renderItem(item, index) {
  const row = document.createElement('li');
  row.className = 'queue-item';
  const number = document.createElement('span');
  number.className = 'queue-index';
  number.textContent = String(index + 1).padStart(2, '0');
  const content = document.createElement('div');
  content.className = 'queue-content';
  const top = document.createElement('div');
  top.className = 'item-top';
  const title = document.createElement('h3');
  title.className = 'item-title';
  title.textContent = item.hook || item.cena || item.id;
  title.title = title.textContent;
  const status = document.createElement('span');
  status.className = 'status';
  status.dataset.status = item.status;
  status.textContent = item.status;
  top.append(title, status);
  const meta = document.createElement('p');
  meta.className = 'item-meta';
  const kind = item.tipo === 'imagem' ? 'Imagem' : item.tipo === 'genjutsu' ? `Genjutsu / ${item.modo}` : 'Veo';
  meta.textContent = item.tipo === 'imagem' ? `${kind} · ${item.flow?.proporcao || ''} · ${item.look_id}` : `${kind} · ${item.duracao_s}s · ${item.look_id}`;
  const attachments = document.createElement('ul');
  attachments.className = 'attachments';
  for (const attachment of requiredAttachments(item)) {
    const li = document.createElement('li');
    li.textContent = attachment;
    attachments.append(li);
  }
  const actions = document.createElement('div');
  actions.className = 'item-actions';
  if (item.status !== 'gerado') actions.append(button('Marcar gerado', () => updateStatus(item.id, 'gerado')));
  if (item.status !== 'descartado') actions.append(button('Descartar', () => updateStatus(item.id, 'descartado')));
  if (item.status !== 'pendente') actions.append(button('Voltar a pendente', () => updateStatus(item.id, 'pendente')));
  content.append(top, meta, attachments, actions);
  row.append(number, content);
  return row;
}

function stepLabel(item) {
  if (!item?.flow) return 'Preencher próximo';
  if (item.tipo === 'genjutsu') return 'Escolher vídeo fonte e preparar genjutsu';
  if (item.tipo === 'imagem') return 'Preparar imagem';
  return item.frame_inicial?.startsWith('ultimo_frame:') ? 'Preparar vídeo a partir do último frame' : 'Preparar vídeo';
}

function render() {
  const pending = state.itens.filter(item => item.status === 'pendente').length;
  const {item: next} = nextStep(state);
  $('#persona-name').textContent = state.persona?.nome || state.persona_id || 'Sem persona';
  $('#queue-count').textContent = `${state.itens.length} ${state.itens.length === 1 ? 'item' : 'itens'}`;
  $('#pending-count').textContent = `${pending} ${pending === 1 ? 'pendente' : 'pendentes'}`;
  $('#fill-next').disabled = busy || pending === 0;
  $('#fill-next').textContent = busy ? 'Executando…' : stepLabel(next);
  $('#export-state').disabled = state.itens.length === 0 && !state.persona;
  $('#clear-state').disabled = state.itens.length === 0 && !state.persona;
  const list = $('#queue-list');
  list.replaceChildren(...state.itens.map(renderItem));
  $('#empty-state').hidden = state.itens.length > 0;
}

async function updateStatus(id, status) {
  try { await save(markStatus(state, id, status)); feedback(`Item marcado como ${status}.`); }
  catch (error) { feedback(error.message, 'error'); }
}

async function importQueue(file) {
  if (!file) return;
  try {
    const queue = parseQueue(await file.text());
    const embeddedPersona = queue.persona ? parsePersona(JSON.stringify(queue.persona)) : state.persona;
    const result = mergeQueue(state, queue, embeddedPersona);
    await save(result.state);
    feedback(`${result.added} novo(s) item(ns) importado(s); ${result.skipped} duplicado(s) ignorado(s).`);
  } catch (error) { feedback(error.message, 'error'); }
  $('#queue-file').value = '';
}

async function importPersona(file) {
  if (!file) return;
  try {
    const persona = parsePersona(await file.text());
    await save(setPersona(state, persona));
    feedback(`Persona ${persona.nome} importada.`);
  } catch (error) { feedback(error.message, 'error'); }
  $('#persona-file').value = '';
}

function supportedTab(url, item) {
  try {
    const parsed = new URL(url);
    if (item?.flow) return parsed.origin === 'https://flow.google.com';
    return (parsed.origin === 'https://labs.google' && parsed.pathname.startsWith('/fx/tools/flow')) || parsed.origin === 'https://flow.google.com' || parsed.origin === 'https://gemini.google.com';
  } catch { return false; }
}

async function flowTab(item) {
  const [tab] = await chrome.tabs.query({active:true, currentWindow:true});
  if (!tab?.id || !supportedTab(tab.url, item))
    throw new Error(item?.flow ? 'Abra um projeto em flow.google.com antes de executar.' : 'Abra uma aba do Google Flow ou Gemini antes de preencher.');
  return tab;
}

async function send(tab, message) {
  try { return await chrome.tabs.sendMessage(tab.id, message); }
  catch { throw new Error('Não foi possível acessar o editor. Recarregue a aba do Flow ou Gemini e tente novamente.'); }
}

const MAX_SOURCE_S = 10.5;

function videoDuration(file) {
  return new Promise(resolve => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    const done = value => { URL.revokeObjectURL(url); resolve(value); };
    video.preload = 'metadata';
    video.onloadedmetadata = () => done(video.duration);
    video.onerror = () => done(null);
    video.src = url;
  });
}

function readDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Não foi possível ler o vídeo fonte.'));
    reader.readAsDataURL(file);
  });
}

// Genjutsu: o vídeo fonte vem do computador do usuário (a extensão não lê arquivos sozinha).
async function chooseSource(file) {
  $('#video-file').value = '';
  if (!file) return;
  const duration = await videoDuration(file);
  if (duration && duration > MAX_SOURCE_S) {
    feedback(`O vídeo tem ${duration.toFixed(1)}s; o Flow aceita até 10s. Use "python -m veo_pipeline genjutsu ... --preparar-fonte" (corta e tira o áudio).`, 'error');
    return;
  }
  pendingVideo = {name:file.name, type:file.type, data: await readDataUrl(file)};
  fillNext();
}

let pendingVideo = null;

async function fillNext() {
  const {item, blockedBy} = nextStep(state);
  if (!item || busy) return;
  if (blockedBy) { feedback(`Antes, gere e confira "${blockedBy.hook}" (status: ${blockedBy.status}).`, 'error'); return; }
  if (item.tipo === 'genjutsu' && item.flow && !pendingVideo) { $('#video-file').click(); return; }
  busy = true;
  render();
  try {
    const prompt = buildPrompt(item, state.persona);
    const tab = await flowTab(item);
    if (item.flow) {
      if (item.frame_inicial?.startsWith('ultimo_frame:')) feedback('Capturando o último frame do vídeo anterior e enviando para o Início…');
      else if (item.tipo === 'genjutsu') feedback(`Enviando ${pendingVideo.name} e a personagem para o Flow… pode levar um minuto.`);
      const video = item.tipo === 'genjutsu' ? pendingVideo : null;
      pendingVideo = null;
      const result = await send(tab, {type:'RUN_STEP', item, prompt, video});
      if (!result?.ok) throw new Error(result?.error || 'O Flow não confirmou o passo.');
      await reload();
      feedback(result.next);
      return;
    }
    const result = await send(tab, {type:'FILL_PROMPT', prompt});
    if (!result?.ok) throw new Error(result?.error || 'O editor não confirmou o preenchimento.');
    await save(markStatus(state, item.id, 'preenchido'));
    feedback(`Prompt ${item.id} preenchido. Anexe os arquivos e clique em Generate na página.`);
  } catch (error) { feedback(error.message, 'error'); }
  finally { busy = false; render(); }
}

async function reload() {
  const stored = (await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY];
  if (stored?.version === 1 && Array.isArray(stored.itens)) state = stored;
  render();
}

function exportState() {
  const payload = {...state, gerado_em:new Date().toISOString()};
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'fila_estado.json';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  feedback('Estado exportado. Guarde o arquivo para restaurar a fila depois.');
}

async function clearState() {
  if (!window.confirm('Apagar a fila e a persona salvas neste navegador? Exporte o estado antes, se quiser guardar o histórico.')) return;
  try { await save(emptyState()); feedback('Fila limpa.'); }
  catch (error) { feedback(error.message, 'error'); }
}

$('#import-queue-button').addEventListener('click', () => $('#queue-file').click());
$('#import-persona-button').addEventListener('click', () => $('#persona-file').click());
$('#queue-file').addEventListener('change', event => importQueue(event.target.files?.[0]));
$('#persona-file').addEventListener('change', event => importPersona(event.target.files?.[0]));
$('#fill-next').addEventListener('click', fillNext);
$('#video-file').addEventListener('change', event => chooseSource(event.target.files?.[0]));
$('#export-state').addEventListener('click', exportState);
$('#clear-state').addEventListener('click', clearState);
chrome.runtime.onMessage.addListener(message => { if (message?.type === 'FLOW_NOTICE') feedback(message.text, message.kind || 'error'); });
chrome.storage.onChanged.addListener((changes, area) => { if (area === 'local' && changes[STORAGE_KEY] && !busy) reload(); });

try {
  const stored = (await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY];
  if (stored?.version === 1 && Array.isArray(stored.itens)) state = stored;
  render();
} catch (error) {
  render();
  feedback(`Não foi possível ler o armazenamento local: ${error.message}`, 'error');
}
