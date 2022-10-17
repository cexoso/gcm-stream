/**
 * 这是一个 buffer 帮助类，它会循环的利用同一段内存空间
 * 同时它会提供一些高级的帮助方法，让上层不再困扰在指针的移动上
 */
import { Buffer } from 'buffer'

export class LoopBuffer {
  private bufferList: Buffer[] = []
  private point = 0
  public size = 0
  public push(next: Buffer) {
    this.bufferList.push(next)
    this.size += next.length
  }
  public mutableGetBufferBySize(size: number) {
    let lessSize = size
    const result = Buffer.allocUnsafe(size)
    let start = 0
    let needDestroyCount = 0
    for (let i = 0; i < this.bufferList.length && lessSize !== 0; i++) {
      const buffer = this.bufferList[i]
      if (buffer.length - this.point > lessSize) {
        // 当前的有余
        buffer.copy(result, start, this.point, this.point + lessSize)
        this.point += lessSize
        break
      }

      // 当前的不够，或者刚好够
      let less = buffer.length - this.point
      buffer.copy(result, start, this.point, this.point + less)
      lessSize -= less
      start += less
      this.point = 0
      needDestroyCount += 1
    }

    this.size -= size
    this.bufferList.splice(0, needDestroyCount)
    return result
  }
}
