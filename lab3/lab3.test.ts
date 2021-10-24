import Jimp from 'jimp'
import {TextEncoder, TextDecoder} from 'util'
import {kjbEmbed, kjbExtract} from './lab3.t'
import hammingDistance from 'hamming-distance'

function roundToPrecision(input: number, places: number) {
  const decimalFactor = 10 ** places
  return Math.round(input * decimalFactor + Number.EPSILON) / decimalFactor
}

describe('lab3', () => {
  it('should work with KJB method', async () => {
    const message = 'Hello, world!'
    const container = await Jimp.read('lab2/container.png')

    const textEncoder = new TextEncoder()
    const messageAsUtf8 = textEncoder.encode(message)

    const modifiedContainer = kjbEmbed(container, messageAsUtf8, {lambda: 0.01})

    const extractedMessageAsUtf8 = kjbExtract(modifiedContainer, messageAsUtf8.byteLength)
    const textDecoder = new TextDecoder()
    const decodedExtractedMessage = textDecoder.decode(extractedMessageAsUtf8)

    const bitDiff = hammingDistance(Buffer.from(messageAsUtf8), Buffer.from(extractedMessageAsUtf8))
    console.log(
      `Сообщение: ${message}, Получено: ${decodedExtractedMessage}, кратность: 1, Расстояние Хэмминга: ${bitDiff}`,
    )

    expect(bitDiff).toBeLessThan(15)

    const graphResults: {lambda: number; hammingDistance: number}[] = []
    for (let lambda = 0.001; lambda < 0.2; lambda = roundToPrecision(lambda + 0.001, 3)) {
      // сюда можно встравить свой код для построения графиков - для заданного lambda получить какое-то значение hammingDistance

      graphResults.push({lambda, hammingDistance: 14})
    }

    // Это можно раскомментировать, чтобы вывести данные для графика в удобоваримой форме
    // Результаты можно скопировать из консоли в Excel и вставить там с разбивкой по колонкам с
    // помощью мастера импорта текста: https://i.stack.imgur.com/QBbyV.png
    /*
    console.log(
      `Таблица для построения графика:\n${graphResults
        .map(({lambda, hammingDistance}) => `${lambda}\t${hammingDistance}`)
        .join('\n')}`,
    )
    */
  })

  it('should implement multiple embedding', async () => {
    const message = 'Hello, world!'
    const container = await Jimp.read('lab2/container.png')

    const textEncoder = new TextEncoder()
    const messageAsUtf8 = textEncoder.encode(message)

    const modifiedContainer = kjbEmbed(container, messageAsUtf8, {lambda: 0.004, multiplicity: 15})

    const extractedMessageAsUtf8 = kjbExtract(modifiedContainer, messageAsUtf8.byteLength, {multiplicity: 15})
    const textDecoder = new TextDecoder()
    const decodedExtractedMessage = textDecoder.decode(extractedMessageAsUtf8)

    const bitDiff = hammingDistance(Buffer.from(messageAsUtf8), Buffer.from(extractedMessageAsUtf8))
    console.log(
      `Сообщение: ${message}, Получено: ${decodedExtractedMessage}, кратность: 15, Расстояние Хэмминга: ${bitDiff}`,
    )

    expect(bitDiff).toBeLessThan(5)
  })

  test.each([[0.0029], [0.003], [0.0035], [0.004], [0.1], [0.5], [0.9]])(
    'should embed using multiple embedding for different lambda values',
    async lambda => {
      const message = 'Hello, world!'
      const container = await Jimp.read('lab2/container.png')

      const textEncoder = new TextEncoder()
      const messageAsUtf8 = textEncoder.encode(message)

      const modifiedContainer = kjbEmbed(container, messageAsUtf8, {lambda, multiplicity: 100})

      const extractedMessageAsUtf8 = kjbExtract(modifiedContainer, messageAsUtf8.byteLength, {
        multiplicity: 100,
      })
      const textDecoder = new TextDecoder()
      const decodedExtractedMessage = textDecoder.decode(extractedMessageAsUtf8)
      await modifiedContainer.writeAsync(`lab3/output/catKjb${lambda}.bmp`)

      const bitDiff = hammingDistance(Buffer.from(messageAsUtf8), Buffer.from(extractedMessageAsUtf8))
      console.log(
        `lambda: ${lambda}, Сообщение: ${message}, Получено: ${decodedExtractedMessage}, Расстояние Хэмминга: ${bitDiff}`,
      )

      expect(bitDiff).toBeLessThan(37)
    },
  )
})
