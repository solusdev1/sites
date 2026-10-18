export const STATUSES = Object.freeze(['pendente', 'preenchido', 'gerado', 'descartado']);
const MODES = [null, 'motion', 'swap_produto', 'restyle'];

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
  if (!['veo','genjutsu'].includes(item.tipo)) fail(`${path}.tipo`, 'deve ser veo ou genjutsu');
  if (!MODES.includes(item.modo) || (item.tipo === 'veo' && item.modo !== null) || (item.tipo === 'genjutsu' && item.modo === null))
    fail(`${path}.modo`, 'incompatível com tipo');
  for (const field of ['look_id','cena','hook','fala','camera','prompt_final','negative_prompt','legenda'])
    string(item[field], `${path}.${field}`, field !== 'look_id');
  if (!Number.isFinite(item.duracao_s) || item.duracao_s <= 0) fail(`${path}.duracao_s`, 'deve ser positivo');
  object(item.anexos, `${path}.anexos`);
  string(item.anexos.imagem_ancora, `${path}.anexos.imagem_ancora`);
  string(item.anexos.video_fonte, `${path}.anexos.video_fonte`);
  if (!Array.isArray(item.hashtags) || item.hashtags.some(tag => typeof tag !== 'string')) fail(`${path}.hashtags`, 'deve ser lista de textos');
  if (!STATUSES.includes(item.status)) fail(`${path}.status`, 'status inválido');
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

export function markStatus(state, id, status) {
  if (!STATUSES.includes(status)) throw new Error('Status inválido.');
  if (!state.itens.some(item => item.id === id)) throw new Error(`Item ${id} não encontrado.`);
  return {...state, itens:state.itens.map(item => item.id === id ? {...item, status} : item)};
}
