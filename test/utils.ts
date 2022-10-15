import { Readable } from 'stream'

class ReadableStream extends Readable {
  private i = 0
  constructor(private bufferList: Buffer[]) {
    super()
  }
  _read() {
    if (this.i === this.bufferList.length) {
      this.push(null)
      return
    }
    const buffer = this.bufferList[this.i]
    this.push(buffer)
    this.i += 1
  }
}
/**
 * @description createReadableStream 会返回一个可读的流，这个流会依次的返回 bufferlist 中的元素
 */
export const createReadableStream = (bufferList: Buffer[]) => new ReadableStream(bufferList)
