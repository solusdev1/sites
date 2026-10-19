export function buildPrompt(item, persona) {
  if (item.prompt_final?.trim()) return item.prompt_final.trim();
  if (!persona?.bloco_fixo?.trim()) throw new Error('Importe persona.json para montar um prompt sem prompt_final.');
  return [
    persona.bloco_fixo.trim(),
    item.cena?.trim() && `Cena: ${item.cena.trim()}`,
    item.camera?.trim() && `Câmera: ${item.camera.trim()}`,
    item.fala?.trim() && `Fala: ${item.fala.trim()}`
  ].filter(Boolean).join('\n\n').replace(/\n\n(Câmera|Fala):/g, '\n$1:');
}

// Na regeneração de um item rejeitado, a correção da QA substitui o prompt.
export function promptFor(item, persona) {
  if (item.status === 'rejeitado' && item.prompt_correcao?.trim()) return item.prompt_correcao.trim();
  return buildPrompt(item, persona);
}

export function requiredAttachments(item) {
  if (item.flow) {
    if (item.tipo === 'genjutsu') return ['Vídeo fonte: escolha no popup (sem áudio, até 10s)', 'Personagem: imagem âncora ou a mais recente do projeto (automático)'];
    const frame = item.frame_inicial || '';
    if (frame.startsWith('ultimo_frame:')) return ['Frame inicial: último frame do vídeo anterior (capturado e enviado automaticamente)'];
    if (frame.startsWith('item:')) return [item.tipo === 'imagem' ? 'Referência: imagem anterior da sequência (automático)' : 'Frame inicial: imagem anterior da sequência (automático)'];
    return [];
  }
  const attachments = [];
  const anchor = item.anexos?.imagem_ancora?.trim();
  const source = item.anexos?.video_fonte?.trim();
  if (anchor) attachments.push(`Imagem âncora: ${anchor}`);
  else attachments.push('Imagem âncora: anexe a referência da persona');
  if (item.tipo === 'genjutsu' || source)
    attachments.push(source ? `Vídeo fonte: ${source}` : 'Vídeo fonte: anexe seu clipe');
  return attachments;
}
