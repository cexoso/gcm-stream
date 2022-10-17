import { Transform } from 'stream'
import { createDecipheriv, DecipherGCM } from 'crypto'
import { Buffer } from 'buffer'
import { LoopBuffer } from './loopBuffer'

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
  private loopBuffer: LoopBuffer

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
    this.loopBuffer = new LoopBuffer()
    this.chunkBuffer = Buffer.alloc(Math.max(this.ivLength, this.macLength))
  }
  /**
   * @returns 返回值是消耗 newArrivalBuffer 的长度
   */
  private tryCreateDecipher() {
    if (this.iv) {
      // 外部传入 iv 构造 decipher
      this.decipher = createDecipheriv(this.cipherGCMTypes, this.key, this.iv)
      return 0
    }

    const bufferSize = this.loopBuffer.size
    if (bufferSize > this.ivLength) {
      this.iv = this.loopBuffer.mutableGetBufferBySize(this.ivLength)
      this.decipher = createDecipheriv(this.cipherGCMTypes, this.key, this.iv)
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
    this.loopBuffer.push(bufferChunk)
    if (this.decipher === undefined) {
      this.tryCreateDecipher()
    }

    if (this.decipher) {
      const validateSize = this.loopBuffer.size - this.macLength
      if (validateSize > 0) {
        // 要确认一个 buffer 不是 maclength 的
        const encBuffer = this.loopBuffer.mutableGetBufferBySize(validateSize)
        this.push(this.decipher.update(encBuffer))
      }
    }
    callback()
  }
  public _flush(callback: TransformCallback): void {
    const authTag = this.loopBuffer.mutableGetBufferBySize(this.macLength)
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
