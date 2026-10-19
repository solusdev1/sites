// Service worker: só ele tem chrome.downloads. O content script pede {type:'DOWNLOAD', url, filename} e recebe
// o caminho final no disco (Downloads/veo3/<persona>/<item>.mp4 ou _last.png).
const TIMEOUT_MS = 5 * 60 * 1000;

// Outra extensão que escuta onDeterminingFilename (ex.: CocoCut) e chama suggest() sem nome faz o Chrome ignorar o
// filename de downloads.download: no Flow real o MP4 caiu em Downloads/<uuid>.mp4. Enquanto há download nosso em
// andamento, sugerimos o nome de novo; downloads de outras extensões seguem com o nome que o Chrome escolher.
const pending = new Map();  // url → filename
function suggestName(item, suggest) {
  const filename = item.byExtensionId === chrome.runtime.id && (pending.get(item.url) || pending.get(item.finalUrl));
  if (filename) suggest({filename, conflictAction:'overwrite'});
  else suggest();
}

const sameFile = (path, filename) => path.replace(/\\/g, '/').endsWith(`/${filename}`);

async function download({url, filename}, downloads = chrome.downloads) {
  if (typeof url !== 'string' || !/^(https:|data:image\/)/.test(url)) throw new Error('endereço de download inválido');
  if (typeof filename !== 'string' || !/^veo3\/[\w.-]+\/[\w.-]+\.(mp4|png)$/.test(filename)) throw new Error('nome de arquivo inválido');
  pending.set(url, filename);
  if (!downloads.onDeterminingFilename.hasListener(suggestName)) downloads.onDeterminingFilename.addListener(suggestName);
  const done = () => {
    pending.delete(url);
    if (!pending.size) downloads.onDeterminingFilename.removeListener(suggestName);
  };
  let id;
  try { id = await downloads.download({url, filename, conflictAction:'overwrite', saveAs:false}); }
  catch (error) { done(); throw error; }
  return new Promise((resolve, reject) => {
    const finish = (fn, value) => { clearTimeout(timer); downloads.onChanged.removeListener(listener); done(); fn(value); };
    const check = async () => {
      const [item] = await downloads.search({id});
      if (item?.state === 'complete') {
        const path = item.filename || filename;
        const result = {ok:true, path};
        if (item.filename && !sameFile(item.filename, filename))
          result.aviso = `O Chrome salvou fora de Downloads/${filename}: ${path}. Provavelmente outra extensão de downloads trocou o nome; desative-a ou mova o arquivo para a pasta veo3.`;
        finish(resolve, result);
      }
      else if (item?.state === 'interrupted') finish(reject, new Error(`download interrompido (${item.error || 'sem motivo'})`));
    };
    const listener = delta => { if (delta.id === id && delta.state) check(); };
    const timer = setTimeout(() => finish(reject, new Error('download não terminou em 5 minutos')), TIMEOUT_MS);
    downloads.onChanged.addListener(listener);
    check();
  });
}

// Servidor local (python -m veo_pipeline servir): só o service worker tem host_permissions para 127.0.0.1:8765.
const SERVER = 'http://127.0.0.1:8765';
const ID = /^[A-Za-z0-9_-]+$/;
async function server(path, {method = 'GET', body, timeout = 3000} = {}, fetchFn = fetch) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetchFn(`${SERVER}${path}`, {method, signal:controller.signal,
      ...(body ? {headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)} : {})});
    return {status:response.status, json:await response.json().catch(() => ({}))};
  } finally { clearTimeout(timer); }
}

// Guarda o MP4 anterior como <item>.vN.mp4 antes de baixar o novo (sem servidor: o download sobrescreve).
async function versionar({persona, item_id}, fetchFn = fetch) {
  if (!ID.test(persona || '') || !ID.test(item_id || '')) return {ok:false, error:'persona ou item inválido'};
  try {
    const {status, json} = await server('/versionar', {method:'POST', body:{persona, item_id}}, fetchFn);
    return status === 200 ? {ok:true, anterior:json.anterior || null} : {ok:false, error:json.erro || `HTTP ${status}`};
  } catch (error) { return {ok:false, offline:true, error:error.message}; }
}

// Último frame extraído pelo servidor (ffmpeg) do MP4 gravado depois de `depois` (ms). 404 = ainda não: espera.
async function ultimoFrame({persona, item_id, depois = 0, espera_ms = 45000, intervalo_ms = 1500}, fetchFn = fetch) {
  if (!ID.test(persona || '') || !ID.test(item_id || '')) return {ok:false, error:'persona ou item inválido'};
  const end = Date.now() + espera_ms;
  for (;;) {
    let reply;
    try { reply = await server(`/ultimo-frame/${persona}/${item_id}?depois=${Math.floor(Number(depois) || 0)}`, {timeout:20000}, fetchFn); }
    catch (error) { return {ok:false, offline:true, error:error.message}; }
    const {status, json} = reply;
    if (status === 200 && typeof json.data === 'string') return {ok:true, path:json.path, data:json.data};
    if (status === 422) return {ok:false, preto:!!json.preto, error:json.erro, erro:json.erro};
    if (status !== 404 || Date.now() > end) return {ok:false, error:json.erro || `HTTP ${status}`};
    await new Promise(resolve => setTimeout(resolve, intervalo_ms));
  }
}

globalThis.FlowBackground = {download, versionar, ultimoFrame};
if (globalThis.chrome?.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    const handler = {DOWNLOAD:download, VERSIONAR:versionar, ULTIMO_FRAME:ultimoFrame}[message?.type];
    if (!handler) return false;
    handler(message).then(sendResponse, error => sendResponse({ok:false, error:error.message}));
    return true;
  });
}
