import { Decrypt } from '../src/decrypt'
import { expect } from 'chai'

describe.only('decrypt', () => {
  describe('初始化逻辑', () => {
    describe('初始化必须指定 key', () => {
      it('base64', () => {
        const decrypt = new Decrypt({
          key: Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]).toString('base64'),
          iv: Buffer.from([0, 0, 0, 0]),
          cipherGCMTypes: 'aes-128-gcm',
        })
        expect(decrypt.getKey().toString('hex')).eq('000102030405060708090a0b0c0d0e0f')
      })
      it('buffer', () => {
        const decrypt = new Decrypt({
          key: Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]),
          iv: Buffer.from([0, 0, 0, 0]),
          cipherGCMTypes: 'aes-128-gcm',
        })
        expect(decrypt.getKey().toString('hex')).eq('000102030405060708090a0b0c0d0e0f')
      })
    })
    describe('可以指定 macLength', () => {
      it('可以指定 macLength', () => {
        const decrypt = new Decrypt({
          key: Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]).toString('base64'),
          iv: Buffer.from([0, 0, 0, 0]),
          cipherGCMTypes: 'aes-128-gcm',
          macLength: 20,
        })
        expect(decrypt).has.property('macLength', 20)
      })
    })
  })
})
