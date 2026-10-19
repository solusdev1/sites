import { emptyState, mergeQueue, parseQueue, parsePersona, setPersona, nextStep, markStatus, updateItem, startFrameSource, needsChosenFrame, parseVerdict, applyVerdict, formatMotivo } from './queue.js';
import { promptFor, requiredAttachments } from './prompt.js';

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
  for (const line of files(item)) {
    const li = document.createElement('li');
    li.textContent = line;
    attachments.append(li);
  }
  const actions = document.createElement('div');
  actions.className = 'item-actions';
  if (['pendente', 'preenchido'].includes(item.status)) actions.append(button('Marcar gerado', () => updateStatus(item.id, 'gerado')));
  if (['gerado', 'rejeitado'].includes(item.status)) actions.append(button('Aprovar', () => updateStatus(item.id, 'aprovado')));
  if (['gerado', 'aprovado'].includes(item.status)) actions.append(button('Rejeitar', () => updateStatus(item.id, 'rejeitado')));
  if (item.flow_midia && item.tipo !== 'imagem') actions.append(button('Baixar vídeo atual', () => collectCurrent(item)));
  if (['gerado', 'aprovado', 'rejeitado'].includes(item.status) && item.tipo !== 'imagem') actions.append(button('Usar outro frame', () => chooseFrameFor(item)));
  if (item.status !== 'descartado') actions.append(button('Descartar', () => updateStatus(item.id, 'descartado')));
  if (item.status !== 'pendente') actions.append(button('Voltar a pendente', () => updateStatus(item.id, 'pendente')));
  content.append(top, meta, attachments, actions);
  row.append(number, content);
  return row;
}

// Caminhos gravados no estado: o que já foi baixado e o frame que continua a sequência.
function files(item) {
  const lines = [];
  if (item.video_path) lines.push(`MP4 salvo em: ${item.video_path}`);
  if (item.download_aviso) lines.push(`⚠ ${item.download_aviso}`);
  else if (!item.video_path && item.download_erro) lines.push(`⚠ MP4 NÃO baixado: ${item.download_erro}. Use "Baixar vídeo atual".`);
  if (item.frame_indicado) lines.push(`Frame de continuação (indicado): ${item.frame_indicado}`);
  else if (item.ultimo_frame) lines.push(`Último frame: ${item.ultimo_frame}`);
  else if (item.frame_erro) lines.push(`Último frame não salvo: ${item.frame_erro}`);
  if (item.qa?.motivos?.length) lines.push(`QA (${item.qa.verdict}):`, ...item.qa.motivos.map(formatMotivo));
  if (item.corte_sugerido) lines.push(`Corte sugerido pela QA: ${item.corte_sugerido.inicio} s–${item.corte_sugerido.fim} s`);
  return lines;
}

function stepLabel(item, action) {
  if (action === 'regenerar') return 'Regenerar este';
  if (action === 'aguardar') return 'Preencher de novo';
  if (action === 'revisar') return 'Aguardando aprovação';
  if (action === 'escolher_frame') return 'Escolher o frame indicado';
  if (action === 'fim') return 'Fila concluída';
  if (!item?.flow) return 'Preencher próximo';
  if (item.tipo === 'genjutsu') return 'Escolher vídeo fonte e preparar genjutsu';
  if (item.tipo === 'imagem') return 'Preparar imagem';
  return item.frame_inicial?.startsWith('ultimo_frame:') ? 'Preparar vídeo a partir do último frame' : 'Preparar vídeo';
}

function render() {
  const pending = state.itens.filter(item => item.status === 'pendente').length;
  const step = nextStep(state);
  const {item: next, action} = step;
  const index = next ? state.itens.indexOf(next) : -1;
  $('#current-item').textContent = next ? `Item atual: ${String(index + 1).padStart(2, '0')} · ${next.hook || next.id} (${next.status})` : (state.itens.length ? 'Sem item atual' : '');
  $('#current-reason').textContent = step.reason || '';
  $('#persona-name').textContent = state.persona?.nome || state.persona_id || 'Sem persona';
  $('#queue-count').textContent = `${state.itens.length} ${state.itens.length === 1 ? 'item' : 'itens'}`;
  $('#pending-count').textContent = `${pending} ${pending === 1 ? 'pendente' : 'pendentes'}`;
  $('#fill-next').disabled = busy || !next || ['revisar', 'fim', 'bloqueado'].includes(action);
  $('#fill-next').textContent = busy ? 'Executando…' : stepLabel(next, action);
  $('#export-state').disabled = state.itens.length === 0 && !state.persona;
  $('#clear-state').disabled = state.itens.length === 0 && !state.persona;
  const list = $('#queue-list');
  list.replaceChildren(...state.itens.map(renderItem));
  list.children[index]?.setAttribute('aria-current', 'step');
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
const FRAMES_KEY = 'veoFlowFrames';

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
    reader.onerror = () => reject(new Error(`Não foi possível ler ${file.name}.`));
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

// Fila sem `flow` (ex.: fila semanal) aberta no Flow: vídeo em Vídeo → Frames 9:16, para encadear pelo último frame.
const DEFAULT_VIDEO_FLOW = Object.freeze({modo:'video', proporcao:'9:16', submodo:'frames'});
function withFlow(item, tab) {
  if (item.flow || item.tipo !== 'veo' || new URL(tab.url).origin !== 'https://flow.google.com') return item;
  return {...item, flow:DEFAULT_VIDEO_FLOW, flow_padrao:true};
}

async function fillNext() {
  const {item: next, action, reason} = nextStep(state);
  if (!next || busy) return;
  if (['bloqueado', 'revisar', 'fim'].includes(action)) { feedback(reason, 'error'); return; }
  if (action === 'escolher_frame') { chooseFrameFor(state.itens.find(needsChosenFrame)); return; }
  if (next.tipo === 'genjutsu' && next.flow && !pendingVideo) { $('#video-file').click(); return; }
  busy = true;
  render();
  try {
    const prompt = promptFor(next, state.persona);
    const tab = await flowTab(next);
    const item = withFlow(next, tab);
    if (item.flow) {
      const source = startFrameSource(state, item);
      if (item.frame_inicial?.startsWith('ultimo_frame:')) feedback('Capturando o último frame do vídeo anterior e enviando para o Início…');
      else if (item.tipo === 'genjutsu') feedback(`Enviando ${pendingVideo.name} e a personagem para o Flow… pode levar um minuto.`);
      const video = item.tipo === 'genjutsu' ? pendingVideo : null;
      pendingVideo = null;
      if (source) feedback(`Enviando o frame de "${state.itens.find(i => i.id === source.item_id)?.hook || source.item_id}" para o Início…`);
      const result = await send(tab, {type:'RUN_STEP', item, prompt, video, startFrameKey:source?.key || null});
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

// "Baixar vídeo atual": refaz o download do MP4 e do último frame na aba do Flow.
async function collectCurrent(item) {
  if (busy) return;
  busy = true;
  render();
  try {
    const tab = await flowTab({...item, flow:item.flow || DEFAULT_VIDEO_FLOW});
    feedback('Baixando o vídeo e capturando o último frame no Flow…');
    const result = await send(tab, {type:'COLLECT', item_id:item.id});
    await reload();
    if (!result?.ok) throw new Error(result?.error || [result?.download_erro, result?.frame_erro].filter(Boolean).join('; ') || 'O Flow não confirmou o download.');
    if (result.download_aviso) feedback(`MP4 salvo em ${result.video_path}, mas ${result.download_aviso}`, 'error');
    else feedback(`MP4 salvo em: ${result.video_path}; último frame: ${result.ultimo_frame}.`);
  } catch (error) { feedback(error.message, 'error'); }
  finally { busy = false; render(); }
}

// "Usar outro frame": o usuário (ou a QA, pelo veredito) indica o frame que continua a sequência.
let frameTarget = null;
function chooseFrameFor(item) {
  if (!item) return;
  frameTarget = item.id;
  $('#frame-file').click();
}

async function useFrame(file) {
  $('#frame-file').value = '';
  const id = frameTarget;
  frameTarget = null;
  if (!file || !id) return;
  try {
    const data = await readDataUrl(file);
    const frames = (await chrome.storage.local.get(FRAMES_KEY))[FRAMES_KEY] || {};
    const kept = Object.entries(frames).filter(([key]) => key !== `${id}:indicado`).slice(-2);  // cota de 10 MB
    await chrome.storage.local.set({[FRAMES_KEY]: Object.fromEntries([...kept, [`${id}:indicado`, {name:file.name, data}]])});
    await save(updateItem(state, id, {frame_indicado:file.name}));
    feedback(`O próximo vídeo vai começar em ${file.name}.`);
  } catch (error) { feedback(error.message, 'error'); }
}

async function importVerdict(file) {
  $('#verdict-file').value = '';
  if (!file) return;
  try {
    const verdict = parseVerdict(await file.text());
    await save(applyVerdict(state, verdict));
    const item = state.itens.find(other => other.id === verdict.item_id);
    const extra = needsChosenFrame(item) ? ` A QA indicou o frame ${verdict.frame_continuacao}: clique em "Escolher o frame indicado" e selecione esse arquivo.` : '';
    feedback(`Veredito aplicado: "${item.hook || item.id}" ${verdict.verdict}.${extra}`, verdict.verdict === 'aprovado' ? 'success' : 'error');
  } catch (error) { feedback(error.message, 'error'); }
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
$('#import-verdict-button').addEventListener('click', () => $('#verdict-file').click());
$('#verdict-file').addEventListener('change', event => importVerdict(event.target.files?.[0]));
$('#frame-file').addEventListener('change', event => useFrame(event.target.files?.[0]));
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
