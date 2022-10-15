import { Encrypt } from '../src/encrypt'
import { expect } from 'chai'
describe('encrypt', () => {
  describe('在不指定 Key 的情况下,Encrypt 会根据指定的 GCM 加密方式自动生成一个 Key', () => {
    it('默认情况', () => {
      const encrypt = new Encrypt()
      expect(encrypt.getKey()).lengthOf(32, '默认使用 aes-256-gcm, 对应 key 长度为 32')
    })
    it('aes-128-gcm', () => {
      const encrypt = new Encrypt({ cipherGCMTypes: 'aes-128-gcm' })
      expect(encrypt.getKey()).lengthOf(16, '128 对应 16 位')
    })
    it('aes-192-gcm', () => {
      const encrypt = new Encrypt({ cipherGCMTypes: 'aes-192-gcm' })
      expect(encrypt.getKey()).lengthOf(24, '182 对应 24 位')
    })
  })
})
