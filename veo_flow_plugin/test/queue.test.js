import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseQueue, validatePersona, validateQueue, mergeQueue, nextPending, nextStep, markStatus, emptyState } from '../src/queue.js';
import { buildPrompt, requiredAttachments } from '../src/prompt.js';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/fila.exemplo.json', import.meta.url), 'utf8'));
const persona = { version: 1, id: 'luna', nome: 'Luna', arquetipo: 'relatable', bloco_fixo: 'Luna tem cabelo castanho.', looks: [{id:'look1', descricao:'jaqueta'}], negative_prompt:'different face', estilo:'vertical', voz:{}, character_sheet:{} };

test('parseia a fila contratada e rejeita JSON ou item inválido', () => {
  assert.equal(parseQueue(JSON.stringify(fixture)).itens.length, 2);
  assert.throws(() => parseQueue('{'), /JSON inválido/);
  assert.throws(() => parseQueue(JSON.stringify({...fixture, version: 2})), /version/);
  assert.throws(() => parseQueue(JSON.stringify({...fixture, itens:[{...fixture.itens[0], tipo:'outro'}]})), /tipo/);
  assert.equal(parseQueue(JSON.stringify({...fixture, itens:[fixture.itens[0], fixture.itens[0]]})).itens.length, 2);
});

test('valida persona e não mistura filas de personagens', () => {
  assert.equal(validatePersona(persona).id, 'luna');
  assert.throws(() => validatePersona({...persona, bloco_fixo:''}), /bloco_fixo/);
  assert.throws(() => mergeQueue(emptyState(), {...fixture, persona_id:'outra'} , persona), /persona/i);
});

test('importação deduplica por id, preserva status e seleciona o próximo pendente', () => {
  const first = mergeQueue(emptyState(), fixture);
  assert.equal(first.added, 2);
  const filled = markStatus(first.state, 'luna-001', 'preenchido');
  const again = mergeQueue(filled, fixture);
  assert.equal(again.added, 0);
  assert.equal(again.state.itens[0].status, 'preenchido');
  assert.equal(mergeQueue(emptyState(), {...fixture, itens:[fixture.itens[0], fixture.itens[0]]}).skipped, 1);
  assert.equal(nextPending(again.state).id, 'luna-002');
  assert.equal(markStatus(again.state, 'luna-002', 'gerado').itens[1].status, 'gerado');
  assert.throws(() => markStatus(again.state, 'missing', 'gerado'), /não encontrado/);
});

test('usa prompt_final pronto e monta fallback mínimo com persona', () => {
  assert.equal(buildPrompt(fixture.itens[0], null), fixture.itens[0].prompt_final);
  assert.equal(buildPrompt(fixture.itens[1], persona), 'Luna tem cabelo castanho.\n\nCena: Luna repete uma dança gravada pela equipe.\nCâmera: Idêntica ao vídeo fonte.');
  assert.throws(() => buildPrompt(fixture.itens[1], null), /persona/i);
  assert.deepEqual(requiredAttachments(fixture.itens[0]), ['Imagem âncora: luna.png']);
  assert.deepEqual(requiredAttachments(fixture.itens[1]), ['Imagem âncora: luna.png', 'Vídeo fonte: danca_propria.mp4']);
});

test('sequência: aceita imagem e nextStep só libera um item depois que a origem foi gerada', () => {
  const base = {modo:null, look_id:'look1', cena:'', hook:'h', fala:'', camera:'', prompt_final:'p', negative_prompt:'', anexos:{imagem_ancora:'', video_fonte:''}, legenda:'', hashtags:[], status:'pendente', sequencia_id:'s'};
  const queue = {version:1, persona_id:'luna', gerado_em:'2026-10-18T00:00:00+00:00', itens:[
    {...base, id:'ref', tipo:'imagem', duracao_s:0, flow:{modo:'imagem', proporcao:'9:16', submodo:null}, frame_inicial:'', ordem:0},
    {...base, id:'v1', tipo:'veo', duracao_s:8, flow:{modo:'video', proporcao:'9:16', submodo:'frames'}, frame_inicial:'item:ref', ordem:1},
    {...base, id:'v2', tipo:'veo', duracao_s:8, flow:{modo:'video', proporcao:'9:16', submodo:'frames'}, frame_inicial:'ultimo_frame:v1', ordem:2}
  ]};
  let state = mergeQueue(emptyState(), validateQueue(queue)).state;
  assert.equal(nextStep(state).item.id, 'ref');
  state = markStatus(state, 'ref', 'preenchido');
  assert.deepEqual([nextStep(state).item.id, nextStep(state).blockedBy.id], ['v1', 'ref']);
  state = markStatus(state, 'ref', 'gerado');
  assert.equal(nextStep(state).blockedBy, null);
  state = markStatus(state, 'v1', 'preenchido');
  assert.equal(nextStep(state).item.id, 'v2');
  assert.equal(nextStep(state).blockedBy.id, 'v1');
  assert.throws(() => validateQueue({...queue, itens:[{...queue.itens[1], frame_inicial:'qualquer'}]}), /frame_inicial/);
  assert.throws(() => validateQueue({...queue, itens:[{...queue.itens[1], duracao_s:0}]}), /duracao_s/);
});
