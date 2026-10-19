import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const script = readFileSync(new URL('../src/background.js', import.meta.url), 'utf8');

function load({finalPath = String.raw`C:\Users\u\Downloads\veo3\maya\a.mp4`} = {}) {
  const listeners = [];
  const naming = [];
  const calls = [];
  let state = 'in_progress';
  const downloads = {
    download: async options => { calls.push(options); return 7; },
    search: async ({id}) => [{id, state, filename:finalPath, error: state === 'interrupted' ? 'SERVER_FORBIDDEN' : undefined}],
    onChanged: {addListener: l => listeners.push(l), removeListener: l => listeners.splice(listeners.indexOf(l), 1)},
    onDeterminingFilename: {addListener: l => naming.push(l), removeListener: l => naming.splice(naming.indexOf(l), 1), hasListener: l => naming.includes(l)}
  };
  const messages = [];
  const chrome = {downloads, runtime:{id:'flowcopiloto', onMessage:{addListener: l => messages.push(l)}}};
  const context = vm.createContext({chrome, setTimeout, clearTimeout, AbortController});
  vm.runInContext(script, context);
  const finish = next => { state = next; listeners.forEach(l => l({id:7, state:{current:next}})); };
  return {context, calls, finish, listeners, messages, naming};
}

test('background: baixa sem perguntar, sobrescreve e devolve o caminho final no disco', async () => {
  const b = load();
  const pending = b.context.FlowBackground.download({url:'https://flow.google.com/asb/x', filename:'veo3/maya/a.mp4'});
  await new Promise(r => setTimeout(r, 5));
  b.finish('complete');
  assert.deepEqual({...await pending}, {ok:true, path:String.raw`C:\Users\u\Downloads\veo3\maya\a.mp4`});
  assert.deepEqual({...b.calls[0]}, {url:'https://flow.google.com/asb/x', filename:'veo3/maya/a.mp4', conflictAction:'overwrite', saveAs:false});
  assert.equal(b.listeners.length, 0);
});

test('background: download interrompido vira erro; nome/endereço fora do padrão são recusados', async () => {
  const b = load();
  const pending = b.context.FlowBackground.download({url:'https://flow.google.com/asb/x', filename:'veo3/maya/a.mp4'});
  await new Promise(r => setTimeout(r, 5));
  b.finish('interrupted');
  await assert.rejects(pending, /SERVER_FORBIDDEN/);
  await assert.rejects(b.context.FlowBackground.download({url:'https://x/y', filename:'../../evil.exe'}), /nome de arquivo/);
  await assert.rejects(b.context.FlowBackground.download({url:'javascript:alert(1)', filename:'veo3/maya/a.mp4'}), /endereço/);
  // Mensagem DOWNLOAD responde de forma assíncrona; outras mensagens são ignoradas.
  assert.equal(b.messages[0]({type:'FLOW_NOTICE'}, {}, () => {}), false);
  const responses = [];
  assert.equal(b.messages[0]({type:'DOWNLOAD', url:'x', filename:'y'}, {}, r => responses.push(r)), true);
  await new Promise(r => setTimeout(r, 5));
  assert.equal(responses[0].ok, false);
});

// Flow real (2026-10-18): o MP4 foi parar em Downloads/058446ca-….mp4 e o frame em "transferir.png", baixados pela
// própria extensão (histórico do Chrome: by_ext_name "Flow Copiloto"). Outra extensão instalada (CocoCut) escuta
// onDeterminingFilename e chama suggest() sem nome; com isso o Chrome ignora o filename de downloads.download.
test('background: com outra extensão em onDeterminingFilename, sugere o nome veo3/<persona>/<item> só para os próprios downloads', async () => {
  const b = load();
  const pending = b.context.FlowBackground.download({url:'https://flow.google.com/asb/x', filename:'veo3/maya/a.mp4'});
  assert.equal(b.naming.length, 1);
  const ours = [], others = [];
  b.naming[0]({id:7, url:'https://flow.google.com/asb/x', byExtensionId:'flowcopiloto', filename:'058446ca.mp4'}, s => ours.push(s));
  b.naming[0]({id:8, url:'https://flow.google.com/asb/x', byExtensionId:'outra', filename:'z.mp4'}, s => others.push(s));
  assert.deepEqual({...ours[0]}, {filename:'veo3/maya/a.mp4', conflictAction:'overwrite'});
  assert.deepEqual(others, [undefined]);
  await new Promise(r => setTimeout(r, 5));
  b.finish('complete');
  await pending;
  assert.equal(b.naming.length, 0);  // não fica interferindo nos downloads das outras extensões
});

test('background: se o Chrome salvar fora de veo3/<persona>/, devolve o caminho real com aviso claro', async () => {
  const b = load({finalPath:String.raw`C:\Users\u\Downloads\058446ca-597d.mp4`});
  const pending = b.context.FlowBackground.download({url:'https://flow.google.com/asb/x', filename:'veo3/maya/a.mp4'});
  await new Promise(r => setTimeout(r, 5));
  b.finish('complete');
  const result = await pending;
  assert.equal(result.ok, true);
  assert.equal(result.path, String.raw`C:\Users\u\Downloads\058446ca-597d.mp4`);
  assert.match(result.aviso, /fora de Downloads\/veo3\/maya\/a\.mp4/);
  assert.match(result.aviso, /outra extensão/);
});

test('background: último frame do servidor local espera o MP4 novo (404) e devolve o PNG; preto e offline viram erro', async () => {
  const b = load();
  const urls = [];
  let replies = [{status:404, json:{erro:'ainda não'}}, {status:200, json:{path:'C:/D/veo3/maya/a_last.png', data:'data:image/png;base64,AA'}}];
  const fetchFn = async (url, options) => { urls.push([url, options.method]); const r = replies.shift(); return {status:r.status, json: async () => r.json}; };
  const ok = await b.context.FlowBackground.ultimoFrame({persona:'maya', item_id:'a', depois:1234.5, intervalo_ms:1}, fetchFn);
  assert.deepEqual({...ok}, {ok:true, path:'C:/D/veo3/maya/a_last.png', data:'data:image/png;base64,AA'});
  assert.deepEqual(urls.map(u => u[0]), ['http://127.0.0.1:8765/ultimo-frame/maya/a?depois=1234', 'http://127.0.0.1:8765/ultimo-frame/maya/a?depois=1234']);
  replies = [{status:422, json:{erro:'quase todo preto', preto:true}}];
  const black = await b.context.FlowBackground.ultimoFrame({persona:'maya', item_id:'a'}, fetchFn);
  assert.equal(black.ok, false);
  assert.equal(black.preto, true);
  const offline = await b.context.FlowBackground.ultimoFrame({persona:'maya', item_id:'a'}, async () => { throw new Error('Failed to fetch'); });
  assert.equal(offline.offline, true);
  assert.equal((await b.context.FlowBackground.ultimoFrame({persona:'../x', item_id:'a'}, fetchFn)).ok, false);
  replies = [{status:200, json:{anterior:'C:/D/veo3/maya/a.v1.mp4'}}];
  const v = await b.context.FlowBackground.versionar({persona:'maya', item_id:'a'}, fetchFn);
  assert.deepEqual({...v}, {ok:true, anterior:'C:/D/veo3/maya/a.v1.mp4'});
  assert.deepEqual(urls.at(-1), ['http://127.0.0.1:8765/versionar', 'POST']);
});
