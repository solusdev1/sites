import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mergeQueue, emptyState, markStatus, nextStep, startFrameSource, parseVerdict, applyVerdict } from '../src/queue.js';
import { promptFor } from '../src/prompt.js';

// Fila real que o usuário importou no Flow (Maya): itens 'veo' sem o campo `flow`.
const maya = JSON.parse(readFileSync(new URL('../../data/exemplos/fila.maya.json', import.meta.url), 'utf8'));
const ids = maya.itens.map(item => item.id);
const load = () => mergeQueue(emptyState(), maya).state;

test('bug 3: "próximo" não avança enquanto o item atual não for aprovado e diz o motivo', () => {
  let state = load();
  assert.deepEqual([nextStep(state).item.id, nextStep(state).action], [ids[0], 'preencher']);
  state = markStatus(state, ids[0], 'preenchido');
  assert.deepEqual([nextStep(state).item.id, nextStep(state).action], [ids[0], 'aguardar']);
  assert.match(nextStep(state).reason, /gerar/);
  state = markStatus(state, ids[0], 'gerado');
  assert.deepEqual([nextStep(state).item.id, nextStep(state).action], [ids[0], 'revisar']);
  assert.match(nextStep(state).reason, /aprove|rejeite/i);
  state = markStatus(state, ids[0], 'rejeitado');
  assert.deepEqual([nextStep(state).item.id, nextStep(state).action], [ids[0], 'regenerar']);
  state = markStatus(state, ids[0], 'preenchido');  // "Regenerar este"
  state = markStatus(state, ids[0], 'gerado');
  state = markStatus(state, ids[0], 'aprovado');
  assert.deepEqual([nextStep(state).item.id, nextStep(state).action], [ids[1], 'preencher']);
  assert.throws(() => markStatus(state, ids[1], 'aprovado'), /pendente → aprovado/);
  state = markStatus(state, ids[1], 'descartado');
  assert.equal(nextStep(state).item.id, ids[2]);
});

test('fila concluída: sem item atual e com motivo', () => {
  let state = load();
  for (const id of ids) state = markStatus(markStatus(markStatus(state, id, 'preenchido'), id, 'gerado'), id, 'aprovado');
  assert.deepEqual([nextStep(state).item, nextStep(state).action], [null, 'fim']);
});

test('bug 2: o próximo vídeo parte do último frame do anterior aprovado; o frame indicado (usuário/QA) tem prioridade', () => {
  let state = load();
  assert.equal(startFrameSource(state, state.itens[0]), null);
  state = markStatus(markStatus(markStatus(state, ids[0], 'preenchido'), ids[0], 'gerado'), ids[0], 'aprovado');
  state = {...state, itens: state.itens.map(i => i.id === ids[0] ? {...i, ultimo_frame:`C:/Downloads/veo3/maya/${ids[0]}_last.png`} : i)};
  assert.deepEqual(startFrameSource(state, state.itens[1]), {item_id: ids[0], key: ids[0], indicado:false});
  state = {...state, itens: state.itens.map(i => i.id === ids[0] ? {...i, frame_indicado:'outro.png'} : i)};
  assert.deepEqual(startFrameSource(state, state.itens[1]), {item_id: ids[0], key: `${ids[0]}:indicado`, indicado:true});
  // Sequência explícita: ultimo_frame:X sempre usa X; item:X (imagem) não é último frame.
  const seq = {...state, itens:[...state.itens, {id:'v9', tipo:'veo', status:'pendente', frame_inicial:`ultimo_frame:${ids[0]}`}, {id:'v10', tipo:'veo', status:'pendente', frame_inicial:'item:ref'}]};
  assert.equal(startFrameSource(seq, seq.itens.at(-2)).item_id, ids[0]);
  assert.equal(startFrameSource(seq, seq.itens.at(-1)), null);
});

test('veredito de QA: valida o formato, muda o status e guarda prompt_correcao/frame para a regeneração', () => {
  let state = load();
  state = markStatus(markStatus(state, ids[0], 'preenchido'), ids[0], 'gerado');
  const verdict = parseVerdict(JSON.stringify({item_id: ids[0], verdict:'rejeitado', motivos:['rosto mudou'], frame_continuacao:null, prompt_correcao:'Maya com o mesmo rosto da referência.'}));
  state = applyVerdict(state, verdict);
  const item = state.itens[0];
  assert.equal(item.status, 'rejeitado');
  assert.deepEqual(item.qa.motivos, ['rosto mudou']);
  assert.equal(nextStep(state).action, 'regenerar');
  assert.match(nextStep(state).reason, /rosto mudou/);
  assert.equal(promptFor(item, null), 'Maya com o mesmo rosto da referência.');
  assert.equal(promptFor({...item, status:'pendente', prompt_correcao:null}, null), item.prompt_final);
  const ok = applyVerdict(markStatus(markStatus(state, ids[0], 'preenchido'), ids[0], 'gerado'),
    {item_id: ids[0], verdict:'aprovado', motivos:[], frame_continuacao:'D:/qa/frame_7s.png', prompt_correcao:null});
  assert.equal(ok.itens[0].status, 'aprovado');
  assert.equal(ok.itens[0].frame_continuacao, 'D:/qa/frame_7s.png');
  assert.equal(nextStep(ok).item.id, ids[1]);
  assert.throws(() => parseVerdict('{'), /JSON inválido/);
  assert.throws(() => parseVerdict(JSON.stringify({item_id: ids[0], verdict:'talvez', motivos:[]})), /verdict/);
  assert.throws(() => applyVerdict(load(), {item_id: ids[0], verdict:'aprovado', motivos:[], frame_continuacao:null, prompt_correcao:null}), /ainda não foi gerado/);
  assert.throws(() => applyVerdict(load(), {item_id:'x', verdict:'aprovado', motivos:[], frame_continuacao:null, prompt_correcao:null}), /não encontrado/);
});
