import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const strip = source => source.replace(/^import .*$/gm, '').replace(/^export /gm, '');
// popup.js é módulo ES com top-level await: junta queue/prompt/popup num script async para o jsdom.
const bundle = `(async () => {\n${strip(read('src/queue.js'))}\n${strip(read('src/prompt.js'))}\n${strip(read('src/popup.js'))}\n})().then(() => { window.__ready = true; }, e => { window.__error = e; });`;
const maya = JSON.parse(read('../data/exemplos/fila.maya.json'));

async function popup(state, {tabUrl = 'https://flow.google.com/project/x', response = {ok:true, next:'pronto'}, fetchMock = async () => { throw new Error('offline'); }} = {}) {
  const html = read('popup.html').replace(/<script[^>]*><\/script>/, '').replace(/<link[^>]*>/, '');
  const {window} = new JSDOM(html, {url:'https://ext.test/popup.html', runScripts:'outside-only'});
  const store = {veoFlowState: structuredClone(state)};
  const sent = [];
  window.fetch = fetchMock;
  window.setInterval = () => 0;
  window.chrome = {
    storage: {local: {get: async key => ({[key]: store[key]}), set: async obj => Object.assign(store, structuredClone(obj))}, onChanged: {addListener() {}}},
    runtime: {onMessage: {addListener() {}}},
    tabs: {query: async () => [{id: 1, url: tabUrl}], sendMessage: async (_id, message) => { sent.push(message); return typeof response === 'function' ? response(message, store) : response; }}
  };
  window.eval(bundle);
  for (let i = 0; i < 50 && !window.__ready && !window.__error; i++) await new Promise(r => setTimeout(r, 5));
  if (window.__error) throw window.__error;
  const $ = s => window.document.querySelector(s);
  const click = async s => { $(s).click(); await new Promise(r => setTimeout(r, 20)); };
  return {window, $, click, store, sent};
}

const fresh = () => ({version:1, persona_id:'maya', persona:null, itens:structuredClone(maya.itens)});
const ids = maya.itens.map(item => item.id);
// O content script real grava 'preenchido' no storage; aqui o "Flow" faz o mesmo.
const flowFills = (message, store) => {
  store.veoFlowState.itens = store.veoFlowState.itens.map(i => i.id === message.item.id ? {...i, status:'preenchido'} : i);
  return {ok:true, next:'pronto'};
};

test('bug 3 (popup): depois de preencher o 1º item, o botão não reenvia o 1º como se fosse o próximo; mostra o item atual e o motivo', async () => {
  const p = await popup(fresh(), {response: flowFills});
  assert.match(p.$('#current-item').textContent, /Item atual: 01/);
  await p.click('#fill-next');
  assert.equal(p.sent.length, 1);
  assert.equal(p.sent[0].type, 'RUN_STEP');  // fila sem flow no Flow: passo completo, não só o texto
  assert.equal(p.sent[0].item.flow_padrao, true);
  assert.equal(p.sent[0].item.id, ids[0]);
  assert.equal(p.store.veoFlowState.itens[0].status, 'preenchido');
  assert.equal(p.$('#fill-next').textContent, 'Preencher de novo');
  assert.match(p.$('#current-reason').textContent, /clique em gerar/);
  // Gerado → o botão espera a aprovação, sem avançar.
  p.store.veoFlowState.itens[0] = {...p.store.veoFlowState.itens[0], status:'gerado', flow_midia:'Novo video', ultimo_frame:`Downloads/veo3/maya/${ids[0]}_last.png`};
  const q = await popup(p.store.veoFlowState, {response: flowFills});
  assert.equal(q.$('#fill-next').disabled, true);
  assert.match(q.$('#current-reason').textContent, /aprove ou rejeite/);
  // Aprovar libera o 2º, que sai com o último frame do 1º no Início.
  [...q.window.document.querySelectorAll('.queue-item')][0].querySelector('button:nth-child(1)').click();
  await new Promise(r => setTimeout(r, 20));
  assert.equal(q.store.veoFlowState.itens[0].status, 'aprovado');
  assert.match(q.$('#current-item').textContent, /Item atual: 02/);
  await q.click('#fill-next');
  assert.equal(q.sent.at(-1).item.id, ids[1]);
  assert.equal(q.sent.at(-1).startFrameKey, ids[0]);
});

test('rejeitado: "Regenerar este" reusa o mesmo item com o prompt corrigido e o mesmo frame', async () => {
  const state = fresh();
  state.itens[0] = {...state.itens[0], status:'aprovado', ultimo_frame:'x_last.png'};
  state.itens[1] = {...state.itens[1], status:'rejeitado', prompt_correcao:'Prompt corrigido', qa:{verdict:'rejeitado', motivos:['mão deformada']}};
  const p = await popup(state);
  assert.equal(p.$('#fill-next').textContent, 'Regenerar este');
  assert.match(p.$('#current-reason').textContent, /mão deformada/);
  await p.click('#fill-next');
  assert.deepEqual([p.sent[0].item.id, p.sent[0].prompt, p.sent[0].startFrameKey], [ids[1], 'Prompt corrigido', ids[0]]);
});

test('motivos da QA no formato do schema aparecem como "t s · tipo · descricao", com o corte sugerido', async () => {
  const state = fresh();
  state.itens[0] = {...state.itens[0], status:'rejeitado', corte_sugerido:{inicio:0, fim:2.4},
    qa:{verdict:'rejeitado', motivos:[{t:2.5, tipo:'objeto_duplicado', descricao:'duas canecas'}, 'mão deformada']}};
  const p = await popup(state);
  const lines = [...p.window.document.querySelectorAll('.queue-item')][0].querySelectorAll('.attachments li');
  const texts = [...lines].map(li => li.textContent);
  assert.ok(texts.includes('2.5 s · objeto_duplicado · duas canecas'), texts.join(' | '));
  assert.ok(texts.includes('mão deformada'));
  assert.ok(texts.includes('Corte sugerido pela QA: 0 s–2.4 s'));
  assert.match(p.$('#current-reason').textContent, /2\.5 s · objeto_duplicado · duas canecas; mão deformada/);
});

test('importar veredito aplica ao item e "Baixar vídeo atual" pede o COLLECT ao Flow', async () => {
  const state = fresh();
  state.itens[0] = {...state.itens[0], status:'gerado', flow_midia:'Novo video'};
  const p = await popup(state, {response: () => ({ok:true, video_path:'a.mp4', ultimo_frame:'a_last.png'})});
  const json = JSON.stringify({item_id:ids[0], verdict:'aprovado', motivos:[], frame_continuacao:null, prompt_correcao:null});
  const file = new p.window.File([json], `${ids[0]}.verdict.json`);
  file.text = async () => json;  // jsdom não implementa Blob.text(); o Chrome sim
  const input = p.$('#verdict-file');
  Object.defineProperty(input, 'files', {value:[file]});
  input.dispatchEvent(new p.window.Event('change'));
  await new Promise(r => setTimeout(r, 30));
  assert.equal(p.store.veoFlowState.itens[0].status, 'aprovado');
  assert.match(p.$('#feedback').textContent, /Veredito aplicado/);
  const baixar = [...p.window.document.querySelectorAll('.queue-item')][0].querySelectorAll('button');
  [...baixar].find(b => b.textContent === 'Baixar vídeo atual').click();
  await new Promise(r => setTimeout(r, 30));
  assert.deepEqual({...p.sent.at(-1)}, {type:'COLLECT', item_id:ids[0]});
  assert.match(p.$('#feedback').textContent, /a\.mp4/);
});

test('popup mostra onde o MP4 foi salvo e um aviso claro quando caiu fora da pasta ou falhou', async () => {
  const state = fresh();
  state.itens[0] = {...state.itens[0], status:'gerado', flow_midia:'Novo video', video_path:String.raw`C:\Downloads\058446ca.mp4`, download_aviso:'O Chrome salvou fora de Downloads/veo3/maya/x.mp4'};
  state.itens[1] = {...state.itens[1], status:'gerado', flow_midia:'Outro', download_erro:'SERVER_FORBIDDEN'};
  const p = await popup(state);
  const [first, second] = [...p.window.document.querySelectorAll('.queue-item')].map(li => li.textContent);
  assert.match(first, /MP4 salvo em: C:\\Downloads\\058446ca\.mp4/);
  assert.match(first, /⚠ O Chrome salvou fora de Downloads\/veo3/);
  assert.match(second, /⚠ MP4 NÃO baixado: SERVER_FORBIDDEN/);
});

test('servidor conectado aplica automaticamente veredito ao item gerado', async () => {
  const state = fresh();
  state.itens[0] = {...state.itens[0], status:'gerado'};
  const verdict = {item_id:ids[0], verdict:'aprovado', motivos:[], frame_continuacao:null, corte_sugerido:null, prompt_correcao:null};
  const calls = [];
  const fetchMock = async url => {
    calls.push(url);
    const body = url.endsWith('/saude') ? {ok:true} : url.includes('/vereditos?') ? [{item_id:ids[0], mtime:123}] : verdict;
    return {ok:true, json:async () => body};
  };
  const p = await popup(state, {fetchMock});
  for (let i = 0; i < 30 && p.store.veoFlowState.itens[0].status !== 'aprovado'; i++) await new Promise(r => setTimeout(r, 5));
  assert.equal(p.$('#server-status').textContent, 'Servidor local: conectado');
  assert.equal(p.store.veoFlowState.itens[0].status, 'aprovado');
  assert.equal(p.store.veoFlowState.itens[0].qa_verdict_mtime, 123);
  assert.equal(calls.length, 3);
});

test('servidor desconectado mantém importação manual como fallback', async () => {
  const state = fresh();
  state.itens[0] = {...state.itens[0], status:'gerado'};
  const p = await popup(state);
  await new Promise(r => setTimeout(r, 5));
  assert.equal(p.$('#server-status').textContent, 'Servidor local: desconectado');
  let opened = false;
  p.$('#verdict-file').click = () => { opened = true; };
  await p.click('#import-verdict-button');
  assert.equal(opened, true);
});

test('popup mostra "aguardando render…" enquanto o Flow ainda renderiza o vídeo do item', async () => {
  const state = fresh();
  state.itens[0] = {...state.itens[0], status:'preenchido', render:'aguardando'};
  const p = await popup(state);
  assert.match(p.window.document.querySelector('.queue-item').textContent, /aguardando render/);
});
