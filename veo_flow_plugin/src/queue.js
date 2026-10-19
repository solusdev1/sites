// Máquina de estados por item: pendente → preenchido → gerado → (aprovado | rejeitado). Rejeitado volta a
// preenchido ("Regenerar este"). Descartado tira o item da sequência. Voltar a pendente é sempre permitido.
export const STATUSES = Object.freeze(['pendente', 'preenchido', 'gerado', 'aprovado', 'rejeitado', 'descartado']);
const TRANSITIONS = {
  pendente: ['preenchido', 'gerado', 'descartado'],
  preenchido: ['preenchido', 'gerado', 'descartado'],
  gerado: ['preenchido', 'aprovado', 'rejeitado', 'descartado'],
  aprovado: ['rejeitado', 'descartado'],
  rejeitado: ['preenchido', 'aprovado', 'descartado'],
  descartado: []
};
const DONE = ['aprovado', 'descartado'];
const MODES = [null, 'motion', 'swap_produto', 'restyle'];
const RATIOS = ['16:9', '4:3', '1:1', '3:4', '9:16'];
const FRAME = /^(|item:\S+|ultimo_frame:\S+)$/;

function fail(path, description) { throw new Error(`${path}: ${description}`); }
function object(value, path) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(path, 'deve ser um objeto');
}
function string(value, path, allowEmpty = true) {
  if (typeof value !== 'string' || (!allowEmpty && !value.trim())) fail(path, 'deve ser texto não vazio');
}

export function validatePersona(persona) {
  object(persona, 'persona');
  if (persona.version !== 1) fail('persona.version', 'deve ser 1');
  for (const field of ['id','nome','arquetipo','bloco_fixo','negative_prompt','estilo'])
    string(persona[field], `persona.${field}`, field !== 'id' && field !== 'bloco_fixo');
  if (!Array.isArray(persona.looks)) fail('persona.looks', 'deve ser uma lista');
  persona.looks.forEach((look, index) => {
    object(look, `persona.looks[${index}]`);
    string(look.id, `persona.looks[${index}].id`, false);
    string(look.descricao, `persona.looks[${index}].descricao`);
  });
  object(persona.voz, 'persona.voz');
  object(persona.character_sheet, 'persona.character_sheet');
  return persona;
}

function validateItem(item, index) {
  const path = `itens[${index}]`;
  object(item, path);
  string(item.id, `${path}.id`, false);
  if (!['veo','genjutsu','imagem'].includes(item.tipo)) fail(`${path}.tipo`, 'deve ser veo, genjutsu ou imagem');
  if (!MODES.includes(item.modo) || (item.tipo !== 'genjutsu' && item.modo !== null) || (item.tipo === 'genjutsu' && item.modo === null))
    fail(`${path}.modo`, 'incompatível com tipo');
  for (const field of ['look_id','cena','hook','fala','camera','prompt_final','negative_prompt','legenda'])
    string(item[field], `${path}.${field}`, field !== 'look_id');
  if (!Number.isFinite(item.duracao_s) || item.duracao_s < 0 || (item.tipo !== 'imagem' && item.duracao_s === 0)) fail(`${path}.duracao_s`, 'deve ser positivo');
  object(item.anexos, `${path}.anexos`);
  string(item.anexos.imagem_ancora, `${path}.anexos.imagem_ancora`);
  string(item.anexos.video_fonte, `${path}.anexos.video_fonte`);
  if (!Array.isArray(item.hashtags) || item.hashtags.some(tag => typeof tag !== 'string')) fail(`${path}.hashtags`, 'deve ser lista de textos');
  if (!STATUSES.includes(item.status)) fail(`${path}.status`, 'status inválido');
  if (item.flow !== undefined) {
    object(item.flow, `${path}.flow`);
    if (!['imagem','video'].includes(item.flow.modo)) fail(`${path}.flow.modo`, 'deve ser imagem ou video');
    if (!RATIOS.includes(item.flow.proporcao)) fail(`${path}.flow.proporcao`, 'proporção inválida');
    if (![null,'frames','elementos'].includes(item.flow.submodo)) fail(`${path}.flow.submodo`, 'submodo inválido');
    if (item.flow.modelo !== undefined) string(item.flow.modelo, `${path}.flow.modelo`, false);
    if (item.flow.resolucao !== undefined && !['360p','720p','1080p'].includes(item.flow.resolucao)) fail(`${path}.flow.resolucao`, 'resolução inválida');
    if (typeof item.frame_inicial !== 'string' || !FRAME.test(item.frame_inicial)) fail(`${path}.frame_inicial`, 'formato inválido');
  }
}

export function validateQueue(queue) {
  object(queue, 'fila');
  if (queue.version !== 1) fail('fila.version', 'deve ser 1');
  string(queue.persona_id, 'fila.persona_id', false);
  string(queue.gerado_em, 'fila.gerado_em', false);
  if (Number.isNaN(Date.parse(queue.gerado_em))) fail('fila.gerado_em', 'deve ser data ISO');
  if (!Array.isArray(queue.itens)) fail('fila.itens', 'deve ser uma lista');
  queue.itens.forEach((item, index) => {
    validateItem(item, index);
  });
  return queue;
}

export function parseQueue(text) {
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('JSON inválido. Escolha um arquivo fila.json válido.'); }
  return validateQueue(data);
}

export function parsePersona(text) {
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('JSON inválido. Escolha um arquivo persona.json válido.'); }
  return validatePersona(data);
}

export function emptyState() { return {version:1, persona_id:null, persona:null, itens:[]}; }

export function mergeQueue(state, queue, persona = state.persona) {
  validateQueue(queue);
  if (persona) validatePersona(persona);
  if (state.persona_id && state.persona_id !== queue.persona_id) throw new Error('A fila pertence a outra persona. Exporte e limpe o estado antes de trocar.');
  if (persona && persona.id !== queue.persona_id) throw new Error('O id da persona não corresponde ao da fila.');
  const known = new Set(state.itens.map(item => item.id));
  const addedItems = queue.itens.filter(item => {
    if (known.has(item.id)) return false;
    known.add(item.id);
    return true;
  });
  return {
    state: {...state, version:1, persona_id:queue.persona_id, persona:persona || null, itens:[...state.itens, ...addedItems]},
    added: addedItems.length,
    skipped: queue.itens.length - addedItems.length
  };
}

export function setPersona(state, persona) {
  validatePersona(persona);
  if (state.persona_id && state.persona_id !== persona.id) throw new Error('A persona não corresponde à fila importada.');
  return {...state, persona_id:persona.id, persona};
}

export function nextPending(state) { return state.itens.find(item => item.status === 'pendente') || null; }

const origin = (state, item) => {
  const id = item.frame_inicial?.split(':')[1];
  return id ? state.itens.find(other => other.id === id) || null : null;
};
const basename = path => String(path || '').split(/[\\/]/).pop();
// A QA pode indicar um frame de continuação diferente do último frame que a extensão salvou.
export const needsChosenFrame = source => !!source?.frame_continuacao && basename(source.frame_continuacao) !== `${source.id}_last.png` && !source.frame_indicado;

// De qual item vem o frame inicial deste: ultimo_frame:X → X; sem frame_inicial, um vídeo continua o anterior
// aprovado da fila. item:X (imagem de referência) é tratado no Flow, não aqui. Genjutsu e imagem não encadeiam.
function frameOrigin(state, item) {
  const frame = item.frame_inicial || '';
  if (frame.startsWith('ultimo_frame:')) return origin(state, item);
  if (frame || item.tipo !== 'veo') return null;
  const index = state.itens.findIndex(other => other.id === item.id);  // o popup passa cópias do item
  const previous = state.itens.slice(0, Math.max(index, 0)).filter(other => other.status !== 'descartado').at(-1);
  return previous && previous.tipo !== 'imagem' && previous.status === 'aprovado' && (previous.ultimo_frame || previous.frame_indicado) ? previous : null;
}

// Chave do frame salvo em chrome.storage (veoFlowFrames): o último frame capturado ou o indicado.
export function startFrameSource(state, item) {
  const source = frameOrigin(state, item);
  if (!source) return null;
  return source.frame_indicado ? {item_id:source.id, key:`${source.id}:indicado`, indicado:true} : {item_id:source.id, key:source.id, indicado:false};
}

const label = item => `"${item.hook || item.id}"`;

// Item atual = o primeiro que ainda não foi aprovado nem descartado. "Próximo" só avança quando ele é aprovado.
export function nextStep(state) {
  const item = state.itens.find(other => !DONE.includes(other.status));
  if (!item) return {item:null, blockedBy:null, action:'fim', reason:'Fila concluída: todos os itens foram aprovados ou descartados.'};
  const source = origin(state, item) || frameOrigin(state, item);
  if (source && source !== item && !DONE.includes(source.status))
    return {item, blockedBy:source, action:'bloqueado', reason:`Antes, gere e aprove ${label(source)} (status: ${source.status}).`};
  if (['pendente', 'rejeitado'].includes(item.status) && needsChosenFrame(source))
    return {item, blockedBy:null, action:'escolher_frame', reason:`A QA indicou outro frame para continuar ${label(source)} (${basename(source.frame_continuacao)}). Escolha esse arquivo em "Usar outro frame" desse item.`};
  switch (item.status) {
    case 'pendente': return {item, blockedBy:null, action:'preencher', reason:''};
    case 'preenchido': return {item, blockedBy:null, action:'aguardar', reason:`${label(item)} está preenchido: clique em gerar no Flow; a extensão marca "gerado", baixa o vídeo e salva o último frame.`};
    case 'gerado': return {item, blockedBy:null, action:'revisar', reason:`${label(item)} foi gerado: aprove ou rejeite (ou importe o veredito da QA) para avançar.`};
    default: {
      const motivos = item.qa?.motivos?.length ? ` Motivos: ${item.qa.motivos.map(formatMotivo).join('; ')}.` : '';
      return {item, blockedBy:null, action:'regenerar', reason:`${label(item)} foi rejeitado.${motivos} Use "Regenerar este" (mesmo prompt${item.prompt_correcao ? ' corrigido pela QA' : ''} e mesmo frame inicial).`};
    }
  }
}

export function markStatus(state, id, status) {
  if (!STATUSES.includes(status)) throw new Error('Status inválido.');
  const current = state.itens.find(item => item.id === id);
  if (!current) throw new Error(`Item ${id} não encontrado.`);
  if (status !== 'pendente' && !TRANSITIONS[current.status]?.includes(status)) throw new Error(`Transição inválida: ${current.status} → ${status}.`);
  return {...state, itens:state.itens.map(item => item.id === id ? {...item, status} : item)};
}

export function updateItem(state, id, fields) {
  if (!state.itens.some(item => item.id === id)) throw new Error(`Item ${id} não encontrado.`);
  return {...state, itens:state.itens.map(item => item.id === id ? {...item, ...fields} : item)};
}

// Veredito do analisador de QA (<item_id>.verdict.json), formato de schemas/verdict.schema.json.
const MOTIVO_TIPOS = ['objeto_duplicado', 'rosto', 'maos', 'cenario', 'continuidade', 'fisica', 'outro'];
// Motivo da QA para exibir: {t, tipo, descricao} → "t s · tipo · descricao"; texto (formato antigo) fica como está.
export const formatMotivo = motivo => typeof motivo === 'string' ? motivo : `${motivo.t} s · ${motivo.tipo} · ${motivo.descricao}`;
export function validateVerdict(verdict) {
  object(verdict, 'veredito');
  string(verdict.item_id, 'veredito.item_id', false);
  if (!['aprovado', 'rejeitado'].includes(verdict.verdict)) fail('veredito.verdict', 'deve ser aprovado ou rejeitado');
  if (!Array.isArray(verdict.motivos)) fail('veredito.motivos', 'deve ser uma lista');
  verdict.motivos.forEach((motivo, index) => {
    if (typeof motivo === 'string') return;  // formato antigo (só texto), aceito por compatibilidade
    const path = `veredito.motivos[${index}]`;
    object(motivo, path);
    if (!Number.isFinite(motivo.t) || motivo.t < 0) fail(`${path}.t`, 'deve ser número ≥ 0');
    if (!MOTIVO_TIPOS.includes(motivo.tipo)) fail(`${path}.tipo`, `deve ser ${MOTIVO_TIPOS.join(', ')}`);
    string(motivo.descricao, `${path}.descricao`, false);
  });
  for (const field of ['frame_continuacao', 'prompt_correcao'])
    if (verdict[field] !== undefined && verdict[field] !== null) string(verdict[field], `veredito.${field}`, false);
  const corte = verdict.corte_sugerido;
  if (corte !== undefined && corte !== null) {
    object(corte, 'veredito.corte_sugerido');
    if (!Number.isFinite(corte.inicio) || corte.inicio < 0) fail('veredito.corte_sugerido.inicio', 'deve ser número ≥ 0');
    if (!Number.isFinite(corte.fim) || corte.fim <= 0) fail('veredito.corte_sugerido.fim', 'deve ser número > 0');
  }
  return verdict;
}

export function parseVerdict(text) {
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('JSON inválido. Escolha um arquivo <item_id>.verdict.json válido.'); }
  return validateVerdict(data);
}

export function applyVerdict(state, verdict) {
  validateVerdict(verdict);
  const item = state.itens.find(other => other.id === verdict.item_id);
  if (!item) throw new Error(`Item ${verdict.item_id} não encontrado.`);
  if (!['gerado', 'aprovado', 'rejeitado'].includes(item.status)) throw new Error(`O item ${verdict.item_id} ainda não foi gerado (status: ${item.status}).`);
  const next = item.status === verdict.verdict ? state : markStatus(state, item.id, verdict.verdict);
  const fields = {qa:{verdict:verdict.verdict, motivos:verdict.motivos}, prompt_correcao:verdict.prompt_correcao ?? null, corte_sugerido:verdict.corte_sugerido ?? null, frame_continuacao:verdict.frame_continuacao ?? null};
  if (fields.frame_continuacao !== (item.frame_continuacao ?? null)) fields.frame_indicado = null;  // frame novo: o usuário escolhe o arquivo de novo
  return updateItem(next, item.id, fields);
}
