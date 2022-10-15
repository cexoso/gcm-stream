import { Transform } from 'stream'
import { randomBytes } from 'crypto'

type CipherGCMTypes = 'aes-128-gcm' | 'aes-192-gcm' | 'aes-256-gcm'

interface Options {
  macLength?: number
  ivLength?: number
  key?: Buffer[] | string
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
    const { macLength, ivLength, cipherGCMTypes } = options
    if (macLength) {
      this.macLength = macLength
    }
    if (ivLength) {
      this.ivLength = ivLength
    }
    if (cipherGCMTypes) {
      this.cipherGCMTypes = cipherGCMTypes
    }
    this.key = this.createKey(this.getKeyLength(this.cipherGCMTypes))
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
  private createKey(keyLength: number) {
    return randomBytes(keyLength)
  }
  public getKey() {
    return this.key
  }
}
