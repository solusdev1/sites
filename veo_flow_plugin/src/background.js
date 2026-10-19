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

globalThis.FlowBackground = {download};
if (globalThis.chrome?.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== 'DOWNLOAD') return false;
    download(message).then(sendResponse, error => sendResponse({ok:false, error:error.message}));
    return true;
  });
}
