import {helloWorld, typescriptIntro} from './lab0'

describe('lab0', () => {
  it('should print hello world using console.log', () => {
    const originalConsoleLog = console.log
    const mockedConsoleLog = jest.fn()
    console.log = mockedConsoleLog

    helloWorld()

    expect(mockedConsoleLog).toHaveBeenCalledWith('Hello, world!')

    console.log = originalConsoleLog
  })

  it('should execute typescript intro to the end', () => {
    typescriptIntro()
  })
})
