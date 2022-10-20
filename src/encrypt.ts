import { Transform } from 'stream'
import { randomBytes, createCipheriv, CipherGCM } from 'crypto'

type CipherGCMTypes = 'aes-128-gcm' | 'aes-192-gcm' | 'aes-256-gcm'
type TransformCallback = (error?: Error | null, data?: any) => void

interface Options {
  /**
   * @description 不自动带上 IV 头
   */
  withoutIV?: boolean
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
  private withoutIV = false
  private iv: Buffer
  private key: Buffer
  private isFirst = true
  private cipher: CipherGCM
  private cipherGCMTypes: CipherGCMTypes = 'aes-256-gcm'

  constructor(options: Options = {}) {
    super()
    const { macLength, ivLength, cipherGCMTypes, key, iv, withoutIV } = options
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
    this.withoutIV = Boolean(withoutIV)
    this.cipher = createCipheriv(this.cipherGCMTypes, this.key, this.iv, {
      authTagLength: this.macLength,
    })
  }
  public _transform(
    chunk: any,
    _: BufferEncoding,
    callback: TransformCallback
  ): void {
    if (this.isFirst) {
      if (!this.withoutIV) {
        // 现在允许不自动在头部带上 IV 的形式了
        this.push(this.getIV())
      }
      this.isFirst = false
    }
    this.push(this.cipher.update(chunk))
    callback()
  }
  public _flush(callback: TransformCallback): void {
    this.cipher.final()
    const authTag = this.cipher.getAuthTag()
    this.push(authTag)
    this.push(null)
    callback()
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
