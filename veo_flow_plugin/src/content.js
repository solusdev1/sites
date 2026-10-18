(function (global) {
  function setPrompt(field, prompt, win) {
    field.focus();
    if (field.matches('textarea, input')) {
      const prototype = field.matches('textarea') ? win.HTMLTextAreaElement.prototype : win.HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
      if (setter) setter.call(field, prompt);
      else field.value = prompt;
    } else {
      field.textContent = prompt;
    }
    const inputEvent = typeof win.InputEvent === 'function'
      ? new win.InputEvent('input', {bubbles:true, inputType:'insertText', data:prompt})
      : new win.Event('input', {bubbles:true});
    field.dispatchEvent(inputEvent);
    field.dispatchEvent(new win.Event('change', {bubbles:true}));
  }

  function fillPrompt(prompt, doc = document, win = doc.defaultView) {
    if (typeof prompt !== 'string' || !prompt.trim()) return {ok:false, error:'O prompt está vazio.'};
    const field = global.FlowFieldSelection.findPromptField(doc, win);
    if (!field) return {ok:false, error:'Campo de prompt não encontrado nesta página. Abra o editor do Flow ou Gemini e tente novamente.'};
    try {
      setPrompt(field, prompt, win);
      return {ok:true};
    } catch (error) {
      return {ok:false, error:`Não foi possível preencher o campo de prompt: ${error.message}`};
    }
  }

  global.FlowContent = {fillPrompt};
  if (global.chrome?.runtime?.onMessage) {
    global.chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message?.type !== 'FILL_PROMPT') return false;
      sendResponse(fillPrompt(message.prompt));
      return false;
    });
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = global.FlowContent;
})(globalThis);
