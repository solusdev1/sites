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

export function requiredAttachments(item) {
  const attachments = [];
  const anchor = item.anexos?.imagem_ancora?.trim();
  const source = item.anexos?.video_fonte?.trim();
  if (anchor) attachments.push(`Imagem âncora: ${anchor}`);
  else attachments.push('Imagem âncora: anexe a referência da persona');
  if (item.tipo === 'genjutsu' || source)
    attachments.push(source ? `Vídeo fonte: ${source}` : 'Vídeo fonte: anexe seu clipe');
  return attachments;
}
