import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const script = readFileSync(new URL('../src/background.js', import.meta.url), 'utf8');

function load() {
  const listeners = [];
  const calls = [];
  let state = 'in_progress';
  const downloads = {
    download: async options => { calls.push(options); return 7; },
    search: async ({id}) => [{id, state, filename:String.raw`C:\Users\u\Downloads\veo3\maya\a.mp4`, error: state === 'interrupted' ? 'SERVER_FORBIDDEN' : undefined}],
    onChanged: {addListener: l => listeners.push(l), removeListener: l => listeners.splice(listeners.indexOf(l), 1)}
  };
  const messages = [];
  const chrome = {downloads, runtime:{onMessage:{addListener: l => messages.push(l)}}};
  const context = vm.createContext({chrome, setTimeout, clearTimeout});
  vm.runInContext(script, context);
  const finish = next => { state = next; listeners.forEach(l => l({id:7, state:{current:next}})); };
  return {context, calls, finish, listeners, messages};
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
