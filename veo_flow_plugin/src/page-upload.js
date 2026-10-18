// Roda no mundo da página (manifest "world": "MAIN"), só em flow.google.com.
// O Flow abre o seletor de arquivos com input.click() no próprio JS; o content script (mundo isolado) não
// consegue interceptar isso. Aqui, só quando "armado" pela extensão, o próximo input[type=file] recebe o
// arquivo enviado via postMessage em vez de abrir a janela do sistema. Depois de um uso, desarma.
(function () {
  const SOURCE = 'flow-copiloto';
  const originalClick = HTMLInputElement.prototype.click;
  let pending = null;

  HTMLInputElement.prototype.click = function () {
    if (this.type !== 'file' || !pending) return originalClick.call(this);
    const file = pending;
    pending = null;
    const transfer = new DataTransfer();
    transfer.items.add(file);
    this.files = transfer.files;
    this.dispatchEvent(new Event('change', {bubbles:true}));
    window.postMessage({source:SOURCE, type:'upload-used', name:file.name}, location.origin);
  };

  window.addEventListener('message', event => {
    if (event.source !== window || event.origin !== location.origin) return;
    const data = event.data;
    if (data?.source !== SOURCE || data.type !== 'arm-upload' || !(data.file instanceof File)) return;
    pending = data.file;
    setTimeout(() => { if (pending === data.file) pending = null; }, 10000);  // não fica armado à toa
  });
})();
