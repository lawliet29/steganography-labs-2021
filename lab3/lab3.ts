import Jimp from 'jimp'
import {readBufferBitByBit, byteToBitArray, bitArrayToByte, ByteAsBitArray} from '../lab2/lab2'

type KJBOptions = {
  /** Мощность встраивания - коэффициент пропорциональности модификации синей компоненты */
  lambda: number
  /** Количество пикселей на кресте, в оригинальном алгоритме используется 2 */
  crossPixelCount: number
  /**
   * Т.к. извлечение носит вероятностный характер, для сообщения рекомендуется использовать
   * помехоустойчивое кодирование; чтобы не заморачиваться с реализацией кодирования по Хэммингу,
   * можно просто сообщение продублировать несколько раз и для каждого бита выбрать медиану.
   */
  multiplicity: number
}

function* duplicate<T>(container: Iterable<T>, times: number): IterableIterator<T> {
  for (let i = 0; i < times; i++) {
    yield* container
  }
}

/**
 * Вспомогательная функция для реализации многократного встраивания. По переданному сообщению message
 * возвращает буфер, содержащий это же сообщение, продублированное multiplicity раз.
 */
export function multiply(message: ArrayBuffer, multiplicity: number) {
  return new Uint8Array(duplicate(new Uint8Array(message), multiplicity))
}

/**
 * Вспомогательная функция для реализации извлечения по многократному встраиванию. По переданному буферу
 * message и кратности multiplicity возвращает буфер длиной message.length / multiplicity, в котором
 * каждый бит сообщения выбирается усреднением соответствующих бит в многократно продублированном сообщении.
 */
export function demultiply(message: Uint8Array, multiplicity: number) {
  const byteLength = message.length / multiplicity
  const bitLength = byteLength * 8
  const bitCountArray: (0 | 1)[] = []
  let bitIndex = 0

  for (const bit of readBufferBitByBit(message)) {
    const messageBitIndex = bitIndex % bitLength
    if (typeof bitCountArray[messageBitIndex] !== 'number') {
      bitCountArray[messageBitIndex] = 0
    }

    if (bit) {
      bitCountArray[messageBitIndex]++
    }

    bitIndex++
  }

  const byteArray: number[] = []
  for (let byteIndex = 0; byteIndex < byteLength; byteIndex++) {
    const offset = byteIndex * 8
    const slice = bitCountArray.slice(offset, offset + 8)
    const bitArray = slice.map(bitCount => Math.round(bitCount / multiplicity)) as ByteAsBitArray
    byteArray.push(bitArrayToByte(bitArray))
  }

  return Uint8Array.from(byteArray)
}

export function kjbEmbed(
  container: Jimp,
  message: ArrayBuffer,
  {lambda = 0.1, crossPixelCount = 2, multiplicity = 1}: Partial<KJBOptions> = {},
) {
  const modifiedContainer = container.clone()

  const messageBitIterator = readBufferBitByBit(message)
  // т.к. для встраивания и извлечения необходимы значения соседних пикселей на кресте, чтобы не разбираться
  // можно на самом изображении сделать искусственный отступ сверху, снизу, слева и справа
  for (let row = crossPixelCount; row < modifiedContainer.getHeight() - crossPixelCount; row++) {
    for (let column = crossPixelCount; column < modifiedContainer.getWidth() - crossPixelCount; column++) {
      const {value, done} = messageBitIterator.next()
      if (done) {
        // TODO: код к заданию 2 тут
        return modifiedContainer
      }

      const {r, g, b, a} = Jimp.intToRGBA(container.getPixelColor(column, row))

      // TODO: код к заданию 1 тут:
      // Не забывайте, что модифицированное значение B не может быть меньше 0 или больше 255
      let modifiedB = b

      modifiedContainer.setPixelColor(Jimp.rgbaToInt(r, g, modifiedB, a), column, row)
    }
  }

  return modifiedContainer
}

export function kjbExtract(
  container: Jimp,
  byteLength: number,
  {crossPixelCount = 2, multiplicity = 1}: Partial<KJBOptions> = {},
) {
  const byteArray: number[] = []
  let currentByte = 0
  let currentByteBitOffset = 7

  for (let row = crossPixelCount; row < container.getHeight() - crossPixelCount; row++) {
    for (let column = crossPixelCount; column < container.getWidth() - crossPixelCount; column++) {
      const {b: blueActual} = Jimp.intToRGBA(container.getPixelColor(column, row))
      // TODO: код к заданию 1 тут:
      let blueEstimated = 0
      const estimatedBit = blueActual > blueEstimated ? 1 : 0

      const mask = estimatedBit << currentByteBitOffset
      currentByte |= mask
      if (currentByteBitOffset === 0) {
        byteArray.push(currentByte)
        currentByteBitOffset = 7
        currentByte = 0
        if (byteArray.length === byteLength) {
          // TODO: код к заданию 2 тут:
          return Uint8Array.from(byteArray)
        }
      } else {
        currentByteBitOffset--
      }
    }
  }

  return Uint8Array.from(byteArray)
}
