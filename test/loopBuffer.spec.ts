import { expect } from 'chai'
import { LoopBuffer } from '../src/loopBuffer'
import { Buffer } from 'buffer'

describe('loopBuffer', () => {
  it('loopBuffer size', () => {
    const loopBuffer = new LoopBuffer()
    expect(loopBuffer.size).eq(0)
    loopBuffer.push(Buffer.from([1, 2, 3]))
    expect(loopBuffer.size).eq(3)
    loopBuffer.push(Buffer.from([4, 5]))
    expect(loopBuffer.size).eq(5)
  })
  it('可以取出 buffer 来使用', () => {
    const loopBuffer = new LoopBuffer()
    loopBuffer.push(Buffer.from([1, 2, 3]))
    loopBuffer.push(Buffer.from([4, 5]))
    expect(loopBuffer.mutableGetBufferBySize(2).toString('hex')).eq(
      Buffer.from([1, 2]).toString('hex')
    )
    expect(loopBuffer.size).eq(3)
    expect(loopBuffer.mutableGetBufferBySize(1).toString('hex')).eq(
      Buffer.from([3]).toString('hex')
    )
    expect(loopBuffer.size).eq(2)
  })
  it('跨 buffer 取', () => {
    const loopBuffer = new LoopBuffer()
    loopBuffer.push(Buffer.from([1, 2]))
    loopBuffer.push(Buffer.from([3, 4]))
    loopBuffer.push(Buffer.from([5, 6]))
    expect(loopBuffer.mutableGetBufferBySize(3).toString('hex')).eq(
      Buffer.from([1, 2, 3]).toString('hex')
    )
    expect(loopBuffer.size).eq(3)
    expect(loopBuffer.mutableGetBufferBySize(2).toString('hex')).eq(
      Buffer.from([4, 5]).toString('hex')
    )
    expect(loopBuffer.size).eq(1)
  })
})
