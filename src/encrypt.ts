import { Transform } from 'stream'
import { randomBytes } from 'crypto'

type CipherGCMTypes = 'aes-128-gcm' | 'aes-192-gcm' | 'aes-256-gcm'

interface Options {
  macLength?: number
  /**
   * @description: 指定的 key, 可以是 Buffer，也可以是 base64 编码的 string
   */
  key?: Buffer | string
  /**
   * @description: iv 参数可以指定初始化向量，非必要情况，可以不传，程序会自己生成 iv
   */
  iv?: Buffer
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
  private key: Buffer
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
    this.key = this.createKey(this.getKeyLength(this.cipherGCMTypes), key)
    // console.log(this.macLength)
    // console.log(this.ivLength)
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
  /**
   * @param keyLength buffer key 的长度，单位是 bytes,必须跟加密算法长度对应
   * 即 aes-128-gcm 算法是一次加密 128 位
   * 128(bits) / 8 = 16(bytes) keyLength 应该是 16 位
   */
  private createKey(keyLength: number, specialkey: Buffer | string | undefined) {
    if (specialkey !== undefined) {
      if (typeof specialkey === 'string') {
        return Buffer.from(specialkey, 'base64')
      }
      return specialkey
    }
    return randomBytes(keyLength)
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
}
