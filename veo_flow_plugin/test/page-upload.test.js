import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const script = readFileSync(new URL('../src/page-upload.js', import.meta.url), 'utf8');

test('page-upload: só intercepta o input de arquivo quando armado, e uma única vez', async () => {
  const {window} = new JSDOM('', {url:'https://flow.google.com/project/x', runScripts:'outside-only'});
  // jsdom não tem DataTransfer nem FileList gravável: stub mínimo do que o Chrome oferece.
  window.DataTransfer = class { constructor() { this.list = []; this.items = {add: f => this.list.push(f)}; } get files() { return this.list; } };
  window.eval(script);
  const nativeClicks = [];
  const input = () => {
    const el = window.document.createElement('input');
    el.type = 'file';
    Object.defineProperty(el, 'files', {writable:true, value:null});
    el.addEventListener('click', () => nativeClicks.push('nativo'));
    return el;
  };
  const used = [];
  window.addEventListener('message', e => { if (e.data?.type === 'upload-used') used.push(e.data.name); });

  input().click();  // desarmado: comportamento original
  assert.equal(nativeClicks.length, 1);

  const file = new window.File(['jpg'], 'ultimo_frame_v1.jpg', {type:'image/jpeg'});
  window.dispatchEvent(new window.MessageEvent('message', {data:{source:'flow-copiloto', type:'arm-upload', file}, origin:'https://flow.google.com', source:window}));
  const armedInput = input();
  let changed = 0;
  armedInput.addEventListener('change', () => changed++);
  armedInput.click();
  assert.equal(nativeClicks.length, 1, 'não abriu a janela de arquivos');
  assert.equal(armedInput.files[0].name, 'ultimo_frame_v1.jpg');
  assert.equal(changed, 1);
  await new Promise(r => setTimeout(r, 10));
  assert.deepEqual(used, ['ultimo_frame_v1.jpg']);

  input().click();  // desarmou depois do uso
  assert.equal(nativeClicks.length, 2);

  // mensagem de outra origem é ignorada
  window.dispatchEvent(new window.MessageEvent('message', {data:{source:'flow-copiloto', type:'arm-upload', file}, origin:'https://evil.example', source:window}));
  input().click();
  assert.equal(nativeClicks.length, 3);
});
