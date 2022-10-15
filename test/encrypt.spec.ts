import { Encrypt } from '../src/encrypt'
import { expect } from 'chai'
import { createReadableStream } from './utils'

describe('encrypt', () => {
  describe('初始化逻辑', () => {
    describe('指定 Key 情况', () => {
      it('指定 base64 编码的 key', () => {
        const encrypt = new Encrypt({
          key: Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]).toString('base64'),
          cipherGCMTypes: 'aes-128-gcm',
        })
        expect(encrypt.getKey().toString('hex')).eq('000102030405060708090a0b0c0d0e0f')
      })
      it('直接指定 buffer', () => {
        const encrypt = new Encrypt({
          key: Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]),
          cipherGCMTypes: 'aes-128-gcm',
        })
        expect(encrypt.getKey().toString('hex')).eq('000102030405060708090a0b0c0d0e0f')
      })
    })
    describe('指定 iv 情况', () => {
      it('指定 base64 编码的 iv', () => {
        const encrypt = new Encrypt({
          iv: Buffer.from([0, 1, 2]).toString('base64'),
        })
        expect(encrypt.getIV().toString('hex')).eq('000102')
      })
      it('直接指定 buffer', () => {
        const encrypt = new Encrypt({
          iv: Buffer.from([0, 1, 2]),
        })
        expect(encrypt.getIV().toString('hex')).eq('000102')
      })
    })
    describe('在不指定 Key 的情况下会根据指定的 GCM 加密方式自动生成一个 Key', () => {
      it('默认情况', () => {
        expect(new Encrypt().getKey()).lengthOf(32, '默认使用 aes-256-gcm, 对应 key 长度为 32')
        expect(new Encrypt({ cipherGCMTypes: 'aes-256-gcm' }).getKey()).lengthOf(32)
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
    describe('不指定 iv 的情况下会随机 iv', () => {
      it('默认情况', () => {
        expect(new Encrypt().getIV()).lengthOf(12, '默认随机 12 位 iv')
        expect(new Encrypt({ ivLength: 20 }).getIV()).lengthOf(20)
      })
    })
  })
  describe('流式加密', () => {
    // 为了保证可测试性，需要指定 key 和初始化向量
    const key = Buffer.from('UZ/1c0zuAqURlFKd0/7+TtXP4aFPugihjem1Efiz2ew=', 'base64')
    const iv = Buffer.from('MBupFtTDnVk3DSfq', 'base64')
    it('指定 key 情况下流式加密', (done) => {
      const encrypt = new Encrypt({
        iv,
        key,
      })
      const stream = createReadableStream([Buffer.from([0])])
      let en$ = stream.pipe(encrypt)

      let buffer = Buffer.from([])
      en$.on('data', (d: Buffer) => {
        buffer = Buffer.concat([buffer, d])
      })
      // 校验码 authTag 是
      // <Buffer 83 76 3c 5b 05 d0 f9 5d ae 40 4d 0e 9e 70 fe 13>
      // 密文是
      // <Buffer 53>
      // iv 是
      // <Buffer 30 1b a9 16 d4 c3 9d 59 37 0d 27 ea>
      en$.on('end', () => {
        const target = Buffer.from([
          0x30, 0x1b, 0xa9, 0x16, 0xd4, 0xc3, 0x9d, 0x59, 0x37, 0x0d, 0x27, 0xea, 0x53, 0x83, 0x76, 0x3c, 0x5b, 0x05,
          0xd0, 0xf9, 0x5d, 0xae, 0x40, 0x4d, 0x0e, 0x9e, 0x70, 0xfe, 0x13,
        ])
        expect(buffer.toString('hex')).eq(target.toString('hex'))
        done()
      })
    })
  })
})
