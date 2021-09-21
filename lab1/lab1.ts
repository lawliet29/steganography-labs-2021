import fs from 'fs'
import Jimp from 'jimp'

// если .format === 'jpg', у объекта есть дополнительное числовое свойство quality
// если .format === 'png', дополнительных свойств нет
export type ConversionOptions =
  | {format: 'jpg'; quality: 99 | 90 | 75 | 50}
  | {format: 'png'}
  | {format: 'deflate'}

export type CompressionInfo = {
  size: number
  compressedSize: number
  compressionRatio: number
}

export async function convert(filename: string, options: ConversionOptions): Promise<CompressionInfo> {
  // пример загрузки изображения, конвертации в буфер и оценки размера
  const bikeBmp = await Jimp.read(filename)

  const bmpBuffer = await bikeBmp.getBufferAsync(Jimp.MIME_BMP)
  const bmpSize = bmpBuffer.byteLength

  const jpeg95Buffer = await bikeBmp.quality(95).getBufferAsync(Jimp.MIME_JPEG)
  const jpeg95Size = jpeg95Buffer.byteLength

  // пример объекта, который нужно вернуть из этой функции:
  const compressionInfo: CompressionInfo = {
    size: bmpSize,
    compressedSize: jpeg95Size,
    compressionRatio: jpeg95Size / bmpSize,
  }

  if (options.format === 'jpg') {
    const {quality} = options
    // TODO: исходный код к заданию 2 здесь, можно использовать число quality
    throw new Error('Конвертация в JPG не реализована!')
  } else if (options.format === 'png') {
    // TODO: исходный код к заданию 2 здесь
    throw new Error('Конвертация в PNG не реализована!')
  } else {
    // TODO: исходный код к заданию 2 здесь
    // тут необходимо использовать функцию zlib.deflate+utils.promisify или zlib.deflateSync
    throw new Error('Конвертация в Deflate не реализована!')
  }
}

export async function pngAndDeflate(filename: string): Promise<CompressionInfo> {
  // TODO: исходный код к заданию 4 здесь
  throw new Error('Конвертация PNG+Deflate не реализована!')
}
