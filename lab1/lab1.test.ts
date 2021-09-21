import {convert, pngAndDeflate, ConversionOptions} from './lab1'

jest.setTimeout(30000)
const filename = 'lab1/bike.bmp'

describe('lab1', () => {
  test.each`
    name         | options                         | expectedRatio
    ${'png'}     | ${{format: 'png'}}              | ${0.6393}
    ${'deflate'} | ${{format: 'deflate'}}          | ${0.8445}
    ${'jpg99'}   | ${{format: 'jpg', quality: 99}} | ${0.3895}
    ${'jpg90'}   | ${{format: 'jpg', quality: 90}} | ${0.1204}
    ${'jpg75'}   | ${{format: 'jpg', quality: 75}} | ${0.0671}
    ${'jpg50'}   | ${{format: 'jpg', quality: 50}} | ${0.0436}
  `(
    'converts to $name',
    async ({
      name,
      options,
      expectedRatio,
    }: {
      name: string
      options: ConversionOptions
      expectedRatio: number
    }) => {
      const result = await convert(filename, options)
      expect(result.compressionRatio).toBeCloseTo(expectedRatio, 2)
      console.log(`${name} степень сжатия: ${result.compressionRatio}`)
    },
  )

  it('converts with PNG+Deflate', async () => {
    const result = await pngAndDeflate(filename)

    expect(result.compressionRatio).toBeCloseTo(0.64, 2)
    console.log(`степень сжатия PNG+Deflate: ${result.compressionRatio}`)
  })
})
