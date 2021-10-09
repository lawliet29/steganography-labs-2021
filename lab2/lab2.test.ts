import Jimp from 'jimp'
import {TextEncoder, TextDecoder} from 'util'
import {imageLSBEmbed, imageLSBExtract, imageBlockEmbed, imageBlockExtract} from './lab2'

const longMessage =
  'Lorem nisi eiusmod cillum labore sunt anim occaecat. Do non velit cupidatat excepteur incididunt. Laborum amet sint irure reprehenderit culpa pariatur sunt culpa amet eu veniam exercitation sit. Lorem in elit culpa adipisicing enim velit et dolore voluptate laborum commodo. Laboris Lorem mollit dolore ad. Aliquip sunt mollit deserunt ut magna anim enim ipsum. In non eiusmod culpa velit laboris sit fugiat Lorem enim officia cillum tempor incididunt culpa. Ad incididunt est ut sint velit. Officia…aborum esse qui labore nisi sit adipisicing amet adipisicing mollit. Mollit ea eu ex nostrud culpa sint. Do esse cillum elit in. Excepteur minim ea adipisicing et adipisicing ut cupidatat laborum enim do excepteur. Lorem veniam irure cillum ullamco nostrud sit enim sint et officia. Ex dolor consectetur cillum anim laborum sint sint voluptate. Adipisicing in officia culpa do est nisi laborum. Ut consectetur cupidatat eiusmod eu eiusmod nostrud occaecat. Non Lorem tempor laboris id sunt sint do.'

describe('lab2', () => {
  it('should work with hello world and 1 bit per byte', async () => {
    const message = 'Hello, world!'
    const container = await Jimp.read('lab2/container.png')

    const textEncoder = new TextEncoder()
    const messageAsUtf8 = textEncoder.encode(message)

    const modifiedContainer = imageLSBEmbed(container, messageAsUtf8)

    const extractedMessageAsUtf8 = imageLSBExtract(modifiedContainer, messageAsUtf8.byteLength)
    const textDecoder = new TextDecoder()
    const decodedExtractedMessage = textDecoder.decode(extractedMessageAsUtf8)

    expect(decodedExtractedMessage).toEqual(message)
  })

  test.each([[1], [2], [3], [4], [5], [6], [7]])('should embed using LSB', async bitsPerByte => {
    const container = await Jimp.read('lab2/container.png')

    const message = longMessage.repeat(50)

    const textEncoder = new TextEncoder()
    const messageAsUtf8 = textEncoder.encode(message)

    const modifiedContainer = imageLSBEmbed(container, messageAsUtf8, bitsPerByte as any)

    const extractedMessageAsUtf8 = imageLSBExtract(
      modifiedContainer,
      messageAsUtf8.byteLength,
      bitsPerByte as any,
    )
    const textDecoder = new TextDecoder()
    const decodedExtractedMessage = textDecoder.decode(extractedMessageAsUtf8)

    expect(decodedExtractedMessage).toEqual(message)

    await modifiedContainer.writeAsync(`lab2/output/bikeLsb${bitsPerByte}.bmp`)
  })

  it('should work with block encoding hello world', async () => {
    const message = 'Hello, world!'
    const container = await Jimp.read('lab1/bike.bmp')

    const textEncoder = new TextEncoder()
    const messageAsUtf8 = textEncoder.encode(message)

    const config = {
      width: 3,
      height: 7,
    }

    const modifiedContainer = imageBlockEmbed(container, messageAsUtf8, config)

    const extractedMessageAsUtf8 = imageBlockExtract(modifiedContainer, config, messageAsUtf8.byteLength)
    const textDecoder = new TextDecoder()
    const decodedExtractedMessage = textDecoder.decode(extractedMessageAsUtf8)

    expect(decodedExtractedMessage).toEqual(message)
  })
})
