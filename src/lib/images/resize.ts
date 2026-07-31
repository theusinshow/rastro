/** Lado maior depois de encolher. */
export const MAX_EDGE_PX = 2000

/** Qualidade do JPEG reencodado. 0,82 é o joelho da curva tamanho/artefato. */
const JPEG_QUALITY = 0.82

/**
 * Dimensões de destino, preservando proporção e **sem ampliar**.
 *
 * Função pura separada da casca que desenha: o `canvas` não existe no ambiente
 * de teste, e é esta conta — não o desenho — que tem regra para errar.
 */
export function targetDimensions(
  width: number,
  height: number,
): { width: number; height: number } {
  const longest = Math.max(width, height)
  if (longest <= MAX_EDGE_PX) return { width, height }

  const scale = MAX_EDGE_PX / longest
  return {
    // `Math.max(1, …)`: uma faixa muito estreita arredondaria para zero, e um
    // canvas de altura zero não desenha nada.
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

/**
 * Encolhe e reencoda para JPEG. **Só funciona no navegador.**
 *
 * Reencodar DESTRÓI o EXIF — por isso quem chama precisa ter lido o EXIF do
 * arquivo original ANTES. A ordem não é preferência, é obrigação: depois daqui a
 * coordenada e a data não existem mais no arquivo.
 */
export async function resizeToJpeg(
  file: File,
): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file)
  const target = targetDimensions(bitmap.width, bitmap.height)

  const canvas = document.createElement('canvas')
  canvas.width = target.width
  canvas.height = target.height

  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    throw new Error('canvas indisponível')
  }

  context.drawImage(bitmap, 0, 0, target.width, target.height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
  )
  if (!blob) throw new Error('não foi possível gerar a imagem')

  return { blob, width: target.width, height: target.height }
}
