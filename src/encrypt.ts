import { Transform } from 'stream'
import { randomBytes, createCipheriv, CipherGCM } from 'crypto'

type CipherGCMTypes = 'aes-128-gcm' | 'aes-192-gcm' | 'aes-256-gcm'
type TransformCallback = (error?: Error | null, data?: any) => void

interface Options {
  macLength?: number
  /**
   * @description: 指定的 key, 可以是 Buffer，也可以是 base64 编码的 string
   */
  key?: Buffer | string
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

export class Encrypt extends Transform {
  // GCM 默认最后的校验位是 16 位
  private macLength = 16
  // GCM 默认初始化向量长度是 12 位
  private ivLength = 12
  private iv: Buffer
  private key: Buffer
  cipher: CipherGCM
  private cipherGCMTypes: CipherGCMTypes = 'aes-256-gcm'

  constructor(options: Options = {}) {
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
    this.key = this.create(this.getKeyLength(this.cipherGCMTypes), key)
    this.iv = this.create(this.ivLength, iv)
    this.cipher = createCipheriv(this.cipherGCMTypes, this.key, this.iv, {
      authTagLength: this.macLength,
    })
  }
  public _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback): void {
    console.log(chunk, encoding, callback)
  }
  public _flush(callback: TransformCallback): void {
    callback
  }
  private getKeyLength(cipherGCMTypes: CipherGCMTypes) {
    if (cipherGCMTypes === 'aes-256-gcm') {
      return 32
    }
    if (cipherGCMTypes === 'aes-192-gcm') {
      return 24
    }
    if (cipherGCMTypes === 'aes-128-gcm') {
      return 16
    }
    throw new Error(`unknow cipherGCMTypes: ${cipherGCMTypes}`)
  }
  private create(length: number, specialValue: Buffer | string | undefined) {
    if (specialValue !== undefined) {
      if (typeof specialValue === 'string') {
        return Buffer.from(specialValue, 'base64')
      }
      return specialValue
    }
    return randomBytes(length)
  }
  public getKey() {
    return this.key
  }
  /**
   * @description 获取 base64 编程后的 key
   */
  public getKeyBase64() {
    return this.key.toString('base64')
  }
  public getIV() {
    return this.iv
  }
}
