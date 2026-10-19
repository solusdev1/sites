import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mergeQueue, emptyState, markStatus, nextStep, parseVerdict, applyVerdict, formatMotivo } from '../src/queue.js';

// Mesma fixture que o pytest valida contra schemas/verdict.schema.json: se o contrato mudar, os dois lados quebram.
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const verdictText = read('../../tests/fixtures/verdict.exemplo.json');
const maya = JSON.parse(read('../../data/exemplos/fila.maya.json'));
const persona = JSON.parse(read('../../data/personas/maya.json'));

const generated = id => {
  const state = mergeQueue(emptyState(), maya, persona).state;
  return markStatus(markStatus(state, id, 'preenchido'), id, 'gerado');
};

test('contrato: o veredito da QA em Python (motivos objeto, corte_sugerido) passa por parseVerdict/applyVerdict', () => {
  const verdict = parseVerdict(verdictText);
  assert.equal(verdict.item_id, maya.itens[0].id);
  const state = applyVerdict(generated(verdict.item_id), verdict);
  const item = state.itens[0];
  assert.equal(item.status, 'rejeitado');
  assert.deepEqual(item.qa.motivos, verdict.motivos);
  assert.deepEqual(item.corte_sugerido, verdict.corte_sugerido);
  assert.equal(item.prompt_correcao, verdict.prompt_correcao);
  assert.match(nextStep(state).reason, /2\.5 s · objeto_duplicado · aparecem duas canecas na mesa; 6 s · maos · /);
});

test('contrato: motivos em texto seguem aceitos; objeto malformado e corte inválido são recusados', () => {
  const base = JSON.parse(verdictText);
  assert.equal(formatMotivo('rosto mudou'), 'rosto mudou');
  const legado = applyVerdict(generated(base.item_id), {...base, motivos:['rosto mudou'], corte_sugerido:undefined});
  assert.deepEqual(legado.itens[0].qa.motivos, ['rosto mudou']);
  assert.equal(legado.itens[0].corte_sugerido, null);
  const parse = data => parseVerdict(JSON.stringify(data));
  assert.throws(() => parse({...base, motivos:[{t:1, tipo:'olhos', descricao:'x'}]}), /motivos\[0\]\.tipo/);
  assert.throws(() => parse({...base, motivos:[{t:-1, tipo:'rosto', descricao:'x'}]}), /motivos\[0\]\.t/);
  assert.throws(() => parse({...base, motivos:[{t:1, tipo:'rosto', descricao:''}]}), /motivos\[0\]\.descricao/);
  assert.throws(() => parse({...base, motivos:[42]}), /motivos\[0\]/);
  assert.throws(() => parse({...base, corte_sugerido:{inicio:0, fim:0}}), /corte_sugerido\.fim/);
  assert.throws(() => parse({...base, corte_sugerido:'0-2'}), /corte_sugerido/);
});
