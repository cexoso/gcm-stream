import { Transform } from 'stream'
import { createDecipheriv, DecipherGCM } from 'crypto'

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
  decipher: DecipherGCM
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

    this.decipher = createDecipheriv(this.cipherGCMTypes, this.key, this.iv)
  }
  public _transform(chunk: any, _: BufferEncoding, callback: TransformCallback): void {
    // if (this.isFirst) {
    //   this.push(this.getIV())
    //   this.isFirst = false
    // }
    // this.push(this.cipher.update(chunk))
    // callback()
  }
  public _flush(callback: TransformCallback): void {
    // this.cipher.final()
    // const authTag = this.cipher.getAuthTag()
    // this.push(authTag)
    // this.push(null)
    // callback()
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
}
