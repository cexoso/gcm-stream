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
  it('长 buffer 取用', () => {
    const decryptedContent = Buffer.from([
      0x30, 0x1b, 0xa9, 0x16, 0xd4, 0xc3, 0x9d, 0x59, 0x37, 0x0d, 0x27, 0xea,
      0x53, 0x83, 0x76, 0x3c, 0x5b, 0x05, 0xd0, 0xf9, 0x5d, 0xae, 0x40, 0x4d,
      0x0e, 0x9e, 0x70, 0xfe, 0x13,
    ])
    const loopBuffer = new LoopBuffer()
    loopBuffer.push(decryptedContent)
    expect(loopBuffer.mutableGetBufferBySize(12).toString('hex')).eq(
      Buffer.from([
        0x30, 0x1b, 0xa9, 0x16, 0xd4, 0xc3, 0x9d, 0x59, 0x37, 0x0d, 0x27, 0xea,
      ]).toString('hex')
    )
    expect(loopBuffer.mutableGetBufferBySize(1).toString('hex')).eq(
      Buffer.from([0x53]).toString('hex')
    )
  })
})
