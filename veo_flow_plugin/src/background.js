// Service worker: só ele tem chrome.downloads. O content script pede {type:'DOWNLOAD', url, filename} e recebe
// o caminho final no disco (Downloads/veo3/<persona>/<item>.mp4 ou _last.png).
const TIMEOUT_MS = 5 * 60 * 1000;

async function download({url, filename}, downloads = chrome.downloads) {
  if (typeof url !== 'string' || !/^(https:|data:image\/)/.test(url)) throw new Error('endereço de download inválido');
  if (typeof filename !== 'string' || !/^veo3\/[\w.-]+\/[\w.-]+\.(mp4|png)$/.test(filename)) throw new Error('nome de arquivo inválido');
  const id = await downloads.download({url, filename, conflictAction:'overwrite', saveAs:false});
  return new Promise((resolve, reject) => {
    const finish = (fn, value) => { clearTimeout(timer); downloads.onChanged.removeListener(listener); fn(value); };
    const check = async () => {
      const [item] = await downloads.search({id});
      if (item?.state === 'complete') finish(resolve, {ok:true, path:item.filename || filename});
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
