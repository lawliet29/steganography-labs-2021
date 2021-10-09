import Jimp from 'jimp'
import {TextEncoder, TextDecoder} from 'util'

/**
 * Функция, которая позволяет итерироваться по произвольному буферу побитово
 */
export function* readBufferBitByBit(input: ArrayBuffer): IterableIterator<0 | 1> {
  for (const byte of new Uint8Array(input)) {
    // В byte находится битовое представление числа в 8 битах, например "0110 1001"
    for (let offset = 7; offset >= 0; offset--) {
      // В mask будут последовательно находитсья числа с единицей в разряде с номером offset:
      // 1000 0000, 0100 0000, 0010 0000 и т.д., до 0000 0001
      const mask = 1 << offset

      // Результат побитового "И" byte и mask будет 0 тогда и только тогда, когда бит
      // в разряде с номером offset в byte был нулём; в противном случае этот бит был 1
      // Например, для offset = 7 mask = 1000 0000, byte & mask = 0000 0000 === 0,
      // а для offset = 6 mask = 0100 0000, byte & mask = 0100 0000 !== 0
      if ((mask & byte) !== 0) {
        yield 1
      } else {
        yield 0
      }
    }
  }
}

export type Bit = 0 | 1
export type ByteAsBitArray = [Bit, Bit, Bit, Bit, Bit, Bit, Bit, Bit]

export function byteToBitArray(byte: number): ByteAsBitArray {
  return Array.from(readBufferBitByBit(Uint8Array.from([byte]))) as ByteAsBitArray
}

export function bitArrayToByte(bitArray: ByteAsBitArray) {
  let byte = 0
  for (let offset = 7; offset >= 0; offset--) {
    const bitIndex = 7 - offset
    const bit = bitArray[bitIndex]
    const mask = 1 << offset
    if (bit) {
      byte |= mask
    }
  }
  return byte
}

export type LSBBitsPerImageByte = 1 | 2 | 3 | 4 | 5 | 6 | 7

export function imageLSBEmbed(
  container: Jimp,
  message: ArrayBuffer,
  bitsPerImageByte: LSBBitsPerImageByte = 1,
): Jimp {
  // создаём копию контейнера, чтобы не модифицировать исходный
  const modifiedContainer = container.clone()

  // ==== пример того, как можно модифицировать цвет какого-то пикселя в Jimp: ====
  // getPixelColor возвращает цвет в виде RGBA по 8 бит на каждую компоненту, т.е. в виде 32-битного числа
  const colorAs32BitNumber = modifiedContainer.getPixelColor(15, 20)
  // чтобы его разложить на отдельные компоненты r, g, b, a можно использовать Jimp.intToRGBA
  const {r, g, b, a} = Jimp.intToRGBA(colorAs32BitNumber)
  // при помощи Jimp.rgbaToInt можно выполнить обратное преобразование с любыми другими значениями r,g,b,a
  // например, тут яркость компоненты R увеличивается на 5 - но она всё равно не должна превышать 255
  const slightlyRedderColorAs32BitNumber = Jimp.rgbaToInt(Math.max(r + 5, 255), g, b, a)
  // при помощи setPixelColor можно обновить цвет пикселя с заданными координатами
  // закомментировано, чтобы не менять контейнер
  // modifiedContainer.setPixelColor(slightlyRedderColorAs32BitNumber, 15, 20)
  // ==== конец примера ====

  const messageBitIterator = readBufferBitByBit(message)

  for (let row = 0; row < modifiedContainer.getHeight(); row++) {
    for (let column = 0; column < modifiedContainer.getWidth(); column++) {
      const pixelColor = Jimp.intToRGBA(container.getPixelColor(column, row))
      let lastIteratorResult: IteratorResult<Bit> = {value: 0, done: false}
      for (const channelName of ['r', 'g', 'b'] as const) {
        const channelByte = pixelColor[channelName]
        const channelByteAsBitArray = byteToBitArray(channelByte) // массив из 8 нулей или единиц по яркости канала, его можно менять
        // channelByteAsBitArray[7] = 0 // <-- переставить последний бит в 0

        // через итератор можно читать биты сообщения
        // next() на итераторе можно вызывать сколько угодно раз, когда итератор закончится, у него в
        // value будет undefined, а в done: true
        lastIteratorResult = messageBitIterator.next()
        const nextBit = lastIteratorResult.value // nextBit тут либо 0, либо 1, либо undefined, что можно трактовать как 0

        // Код к заданиям 2 и 3 тут
        // тут в зависимости от значения (или нескольких значений) nextBit мы должны что-то сделать с channelByteAsBitArray

        const modifiedChannelByte = bitArrayToByte(channelByteAsBitArray) // преобразуем массив бит после изменений обратно в число
        pixelColor[channelName] = modifiedChannelByte // записываем число в соответствующую компоненту pixelColor (r, g или b)
      }
      // внести модифицированный цвет обратно в пиксель контейнера
      const modifiedColor = Jimp.rgbaToInt(pixelColor.r, pixelColor.g, pixelColor.b, pixelColor.a)
      modifiedContainer.setPixelColor(modifiedColor, column, row)

      if (lastIteratorResult.done) {
        // сюда попадём, когда в сообщении больше не останется битов, т.е. если к этому моменту сообщение полностью
        // встроено в контейнер, его можно сразу вернуть
        return modifiedContainer
      }
    }
  }

  if (!messageBitIterator.next().done) {
    // сюда можем попасть, если итерация по координатам пикселя закончилась, а в
    // побитовом итераторе всё ещё остались значения для встраивания
    throw new Error('Сообщение слишком большое, чтобы быть встроенным в этот контейнер')
  }

  // редкий случай, сюда можем попасть, если размер изображения идеально точно подошёл под размер сообщения
  return modifiedContainer
}

export function imageLSBExtract(
  container: Jimp,
  byteLength: number,
  bitsPerImageByte: LSBBitsPerImageByte = 1,
): ArrayBuffer {
  const byteArray: number[] = []

  // тут надо что-то сделать, чтобы извлечь сообщение из контейнера

  // можно, например, сначала использовать восмиэлементный массив из 0 и 1
  const bitArray: ByteAsBitArray = [0, 0, 0, 0, 0, 0, 0, 0]
  for (let bitArrayIndex = 0; bitArrayIndex < 8; bitArrayIndex++) {
    const nextBit: 0 | 1 = 1 // этот бит можно каким-то образом прочитать из контейнера
    bitArray[bitArrayIndex] = nextBit
  }

  // после заполнения восьмиэлементного массива бит его можно сконвертировать в байт
  const byte = bitArrayToByte(bitArray)
  byteArray.push(byte)

  // а ещё нужно извлекать биты из контейнера только до тех пор, пока не будет прочитано byteLength байт

  return Uint8Array.from(byteArray).buffer
}

export function imageBlockEmbed(
  container: Jimp,
  message: ArrayBuffer,
  blockSize: {width: number; height: number},
): Jimp {
  const modifiedContainer = container.clone()

  const messageBitIterator = readBufferBitByBit(message)

  for (let row = 0; row < container.getHeight(); row += blockSize.height) {
    for (let column = 0; column < container.getWidth(); column += blockSize.width) {
      if (
        row + blockSize.height >= container.getHeight() ||
        column + blockSize.width >= container.getWidth()
      ) {
        // пропустить блок, если он не полный (т.е. выходит за ширину или за высоту изображения)
        continue
      }

      let xoredByte = 0
      for (let x = column; x < column + blockSize.width; x++) {
        for (let y = row; y < row + blockSize.height; y++) {
          const color = Jimp.intToRGBA(container.getPixelColor(x, y))
          for (const component of ['r', 'g', 'b'] as const) {
            xoredByte ^= color[component]
          }
        }
      }

      let parityBit = 0
      for (const bit of byteToBitArray(xoredByte)) {
        parityBit ^= bit
      }

      const iteratorResult = messageBitIterator.next()
      if (iteratorResult.done) {
        // сюда попадём, когда в сообщении больше не останется битов, т.е. сообщение полностью
        // встроено в контейнер и можно его вернуть
        return modifiedContainer
      }

      const nextBit = iteratorResult.value // nextBit тут либо 0, либо 1

      // если бит четности совпадает с тем битом, который нужно встроить, можно ничего не делать
      if (parityBit !== nextBit) {
        // иначе надо тут поменять единственный бит любого пикселя этого блока, его можно выбрать случайно
        // Код к заданию 6 тут
      }
    }
  }

  if (!messageBitIterator.next().done) {
    // сюда можем попасть, если итерация по координатам пикселя закончилась, а в
    // побитовом итераторе всё ещё остались значения для встраивания
    throw new Error('Сообщение слишком большое, чтобы быть встроенным в этот контейнер')
  }

  // редкий случай, сюда можем попасть, если размер изображения идеально точно подошёл под размер сообщения
  return modifiedContainer
}

export function imageBlockExtract(
  container: Jimp,
  blockSize: {width: number; height: number},
  length: number,
) {
  const byteArray: number[] = []

  // тут нужно побитово прочитать биты четности, пока не будет получено length байт в массиве
  // Код к заданию 6 тут

  return Uint8Array.from(byteArray).buffer
}
