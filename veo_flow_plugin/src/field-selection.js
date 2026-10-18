// Isolado da API Chrome: a ordem das estratégias pode ser ajustada se o DOM do Flow mudar.
(function (global) {
  const EDITABLE = 'textarea, input[type="text"], input:not([type]), [contenteditable="true"], [contenteditable=""], [role="textbox"]';
  const PROMPT_LABEL = /prompt|descreva|describe|imaginar|imagine|mensagem|message/i;

  function visible(element, win) {
    if (element.disabled || element.readOnly) return false;
    for (let node = element; node && node.nodeType === 1; node = node.parentElement) {
      if (node.matches('[hidden], [inert], [aria-hidden="true"]')) return false;
      const style = win.getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    }
    return true;
  }

  function area(element) {
    const rect = element.getBoundingClientRect();
    return rect.width * rect.height;
  }

  function label(element) {
    return [element.getAttribute('aria-label'), element.getAttribute('placeholder'), element.getAttribute('data-placeholder')].filter(Boolean).join(' ');
  }

  function findPromptField(doc = document, win = doc.defaultView) {
    const fields = Array.from(doc.querySelectorAll(EDITABLE)).filter(element => visible(element, win));
    // 1. Campo principal textarea/contenteditable explicitamente rotulado como prompt.
    const primary = fields.filter(element => element.matches('textarea, [contenteditable]') && PROMPT_LABEL.test(label(element)));
    if (primary.length) return primary.sort((a,b) => area(b)-area(a))[0];
    // 2. Outro campo editável com aria-label/placeholder de prompt (inclui Gemini).
    const labeled = fields.filter(element => PROMPT_LABEL.test(label(element)));
    if (labeled.length) return labeled.sort((a,b) => area(b)-area(a))[0];
    // 3. Maior campo editável visível.
    return fields.sort((a,b) => area(b)-area(a))[0] || null;
  }

  global.FlowFieldSelection = {findPromptField, visible};
  if (typeof module !== 'undefined' && module.exports) module.exports = global.FlowFieldSelection;
})(globalThis);
