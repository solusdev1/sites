import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const selectors = readFileSync(new URL('../src/field-selection.js', import.meta.url), 'utf8');
const content = readFileSync(new URL('../src/content.js', import.meta.url), 'utf8');

function page(html) {
  const dom = new JSDOM(html, {url:'https://labs.google/fx/tools/flow', runScripts:'outside-only'});
  let handler;
  dom.window.chrome = {runtime:{onMessage:{addListener(fn){handler=fn;}}}};
  dom.window.eval(selectors);
  dom.window.eval(content);
  return {window:dom.window, message(payload){return new Promise(resolve => handler(payload, {}, resolve));}};
}

test('prioriza o textarea de prompt visível e emite input/change', async () => {
  const {window, message} = page('<textarea id="hidden" aria-label="Prompt" hidden></textarea><textarea id="search" aria-label="Search"></textarea><textarea id="prompt" aria-label="Video prompt"></textarea>');
  const field = window.document.querySelector('#prompt');
  const events=[];
  field.addEventListener('input', () => events.push('input'));
  field.addEventListener('change', () => events.push('change'));
  assert.equal((await message({type:'FILL_PROMPT', prompt:'Uma cena nova'})).ok, true);
  assert.equal(field.value, 'Uma cena nova');
  assert.equal(window.document.querySelector('#search').value, '');
  assert.deepEqual(events, ['input', 'change']);
});

test('preenche contenteditable identificado por aria-label', async () => {
  const {window, message} = page('<div contenteditable="true" aria-label="Digite seu prompt"></div>');
  const field = window.document.querySelector('[contenteditable]');
  let input = 0;
  field.addEventListener('input', () => input++);
  assert.equal((await message({type:'FILL_PROMPT', prompt:'Luna dança'})).ok, true);
  assert.equal(field.textContent, 'Luna dança');
  assert.equal(input, 1);
});

test('ignora campo em contêiner oculto e aceita placeholder de prompt em input', async () => {
  const {window, message} = page('<section style="display:none"><textarea aria-label="Prompt"></textarea></section><input type="text" placeholder="Escreva o prompt">');
  const field = window.document.querySelector('input');
  Object.defineProperty(field, 'value', {configurable:true, get(){return 'valor rastreado';}, set(){throw new Error('setter próprio não deve ser usado');}});
  const result = await message({type:'FILL_PROMPT', prompt:'Cena de teste'});
  assert.equal(result.ok, true);
  assert.equal(Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').get.call(field), 'Cena de teste');
});

test('usa o maior campo como fallback e informa erro claro quando ausente', async () => {
  const {window, message} = page('<textarea id="small"></textarea><div id="large" contenteditable="true"></div>');
  window.document.querySelector('#small').getBoundingClientRect = () => ({width:100,height:20});
  window.document.querySelector('#large').getBoundingClientRect = () => ({width:500,height:200});
  assert.equal((await message({type:'FILL_PROMPT', prompt:'Teste'})).ok, true);
  assert.equal(window.document.querySelector('#large').textContent, 'Teste');
  const empty = page('<button>Generate</button>');
  const result = await empty.message({type:'FILL_PROMPT', prompt:'Teste'});
  assert.equal(result.ok, false);
  assert.match(result.error, /campo de prompt/i);
});

test('ignora mensagens vazias e nunca aciona Generate', async () => {
  const {window, message} = page('<textarea aria-label="Prompt"></textarea><button id="generate">Generate</button>');
  let clicks=0;
  window.document.querySelector('#generate').addEventListener('click',()=>clicks++);
  const result = await message({type:'FILL_PROMPT', prompt:'  '});
  assert.equal(result.ok, false);
  assert.equal(clicks,0);
  await message({type:'FILL_PROMPT', prompt:'Luna na cozinha'});
  assert.equal(clicks,0);
});

test('reconhece o editor ProseMirror do Flow (flow.google.com) pelo aria-label "O que você quer criar?"', async () => {
  // DOM observado no Flow real em 2026-10-18: busca, título e editor ProseMirror com role=textbox.
  const {window, message} = page('<input class="search-input" aria-label="Pesquisar"><input class="editable-text-input" aria-label="Texto editável"><textarea class="g-recaptcha-response" style="display:none"></textarea><div class="ProseMirror" contenteditable="true" role="textbox" aria-label="O que você quer criar?"><p><br></p></div>');
  const field = window.FlowFieldSelection.findPromptField(window.document);
  assert.equal(field.getAttribute('aria-label'), 'O que você quer criar?');
  assert.equal((await message({type:'FILL_PROMPT', prompt:'Luna chega na kitnet'})).ok, true);
  assert.equal(field.textContent, 'Luna chega na kitnet');
  assert.equal(window.document.querySelector('.search-input').value, '');
});

test('reconhece o editor do modo Estender ("Qual é a próxima etapa?") em vez da busca', async () => {
  const {window, message} = page('<input class="search-input" aria-label="Pesquisar"><div class="ProseMirror" contenteditable="true" role="textbox" aria-label="Qual é a próxima etapa?"><p><br></p></div>');
  assert.equal(window.FlowFieldSelection.findPromptField(window.document).getAttribute('aria-label'), 'Qual é a próxima etapa?');
  assert.equal((await message({type:'FILL_PROMPT', prompt:'Siga-nos'})).ok, true);
  assert.equal(window.document.querySelector('.search-input').value, '');
});
