import { Transform } from 'stream'
import { createDecipheriv, DecipherGCM } from 'crypto'
import { Buffer } from 'buffer'

type CipherGCMTypes = 'aes-128-gcm' | 'aes-192-gcm' | 'aes-256-gcm'
type TransformCallback = (error?: Error | null, data?: any) => void

interface Options {
  macLength?: number
  /**
   * @description: 指定的 key, 可以是 Buffer，也可以是 base64 编码的 string
   */
  key: Buffer | string
  /**
   * @description: iv 参数可以指定初始化向量，非必要情况，可以不传，程序会自己生成 iv
   */
  iv?: Buffer | string
  /**
   * @description: 指定生成 iv 的长度，默认值为 12 位
   * @default: 12
   */
  ivLength?: number
  cipherGCMTypes?: CipherGCMTypes
}

export class Decrypt extends Transform {
  // GCM 默认最后的校验位是 16 位
  private macLength = 16
  // GCM 默认初始化向量长度是 12 位
  private ivLength = 12
  private iv: Buffer
  private key: Buffer

  // 用于缓冲流数据的块
  private chunkBuffer: Buffer
  private chunkBufferEnd = 0 // 不包含

  private decipher: DecipherGCM
  private cipherGCMTypes: CipherGCMTypes = 'aes-256-gcm'

  constructor(options: Options) {
    super()
    const { macLength, ivLength, cipherGCMTypes, key, iv } = options
    if (macLength) {
      this.macLength = macLength
    }
    if (ivLength) {
      this.ivLength = ivLength
    }
    if (cipherGCMTypes) {
      this.cipherGCMTypes = cipherGCMTypes
    }
    this.key = this.getValue(key)

    if (iv) {
      // 支持从外部传递
      this.iv = this.getValue(iv)
    }
    this.chunkBuffer = Buffer.alloc(Math.max(this.ivLength, this.macLength))
  }
  /**
   * @returns 返回值是消耗 newArrivalBuffer 的长度
   */
  private tryCreateDecipher(newArrivalBuffer: Buffer) {
    if (this.iv) {
      // 外部传入 iv 构造 decipher
      this.decipher = createDecipheriv(this.cipherGCMTypes, this.key, this.iv)
      return 0
    }

    const { chunkBufferEnd } = this

    if (chunkBufferEnd + newArrivalBuffer.length >= this.ivLength) {
      // 密文头部带 iv 的情况，确保收到了所有的 iv buffer
      const ivBuffer = Buffer.alloc(this.ivLength)
      this.chunkBuffer.copy(ivBuffer, 0, 0, chunkBufferEnd)
      let lessSize = this.ivLength - chunkBufferEnd
      newArrivalBuffer.copy(ivBuffer, this.chunkBufferEnd, 0, lessSize)
      this.iv = ivBuffer
      this.decipher = createDecipheriv(this.cipherGCMTypes, this.key, this.iv)
      this.chunkBufferEnd = 0
      return lessSize
    }
    // 目前还无法创建 decipher
    return 0
  }
  public _transform(
    chunk: any,
    _: BufferEncoding,
    callback: TransformCallback
  ): void {
    const bufferChunk = Buffer.from(chunk)
    let digestLength = 0
    if (this.decipher === undefined) {
      digestLength = this.tryCreateDecipher(bufferChunk)
    }

    if (this.decipher) {
      let validLength =
        bufferChunk.length + this.chunkBufferEnd - this.macLength - digestLength
      if (validLength > 0) {
        let start = 0
        const encBuffer = Buffer.allocUnsafe(validLength)
        if (this.chunkBufferEnd > 0) {
          this.chunkBuffer.copy(encBuffer, start, 0, this.chunkBufferEnd)
          start = this.chunkBufferEnd
          validLength -= this.chunkBufferEnd
        }
        bufferChunk.copy(
          encBuffer,
          start,
          digestLength,
          digestLength + validLength
        )
        bufferChunk.copy(
          this.chunkBuffer,
          0,
          digestLength + validLength,
          bufferChunk.length
        )
        this.chunkBufferEnd = bufferChunk.length - digestLength - validLength
        this.push(this.decipher.update(encBuffer))
      }
    } else {
      bufferChunk.copy(this.chunkBuffer, this.chunkBufferEnd, digestLength)
      this.chunkBufferEnd += bufferChunk.length
    }
    callback()
  }
  public _flush(callback: TransformCallback): void {
    const authTag = this.chunkBuffer
    this.decipher.setAuthTag(authTag)
    this.decipher.final()
    this.push(null)
    callback()
  }
  private getValue(value: Buffer | string) {
    if (typeof value === 'string') {
      return Buffer.from(value, 'base64')
    }
    return value
  }
  public getKey() {
    return this.key
  }
  public getIV() {
    return this.iv
  }
}
