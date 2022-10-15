import { Encrypt } from '../src/encrypt'
import { expect } from 'chai'
import crypto from 'crypto'
import { createReadableStream } from './utils'

describe('encrypt', () => {
  describe('初始化逻辑', () => {
    describe('指定 Key 情况', () => {
      it('指定 base64 编码的 key', () => {
        const encrypt = new Encrypt({
          key: Buffer.from([0, 1, 2]).toString('base64'),
        })
        expect(encrypt.getKey().toString('hex')).eq('000102')
      })
      it('直接指定 buffer', () => {
        const encrypt = new Encrypt({
          key: Buffer.from([0, 1, 2]),
        })
        expect(encrypt.getKey().toString('hex')).eq('000102')
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
  describe.skip('流式加密', () => {
    // 为了保证可测试性，需要指定 key 和初始化向量
    const key = Buffer.from('UZ/1c0zuAqURlFKd0/7+TtXP4aFPugihjem1Efiz2ew=', 'base64')
    const iv = Buffer.from('9zyJk6Jd91cXf4K+j2YOu4YnY7g5TlbUqON4tscsCLo=', 'base64')
    it('指定 key 情况下流式加密', () => {
      const encrypt = new Encrypt({
        iv,
        key,
      })
      const stream = createReadableStream([Buffer.from([0])])
      let en$ = stream.pipe(encrypt)
      // en$.on('data', (d: Buffer) => {
      //   console.log(d)
      // })
    })
  })
  it.skip('stream transform', () => {
    const key = Buffer.from('UZ/1c0zuAqURlFKd0/7+TtXP4aFPugihjem1Efiz2ew=', 'base64')
    const iv = Buffer.from('9zyJk6Jd91cXf4K+j2YOu4YnY7g5TlbUqON4tscsCLo=', 'base64')
    const stream = createReadableStream([Buffer.from([0])])
    let encrypt = crypto.createCipheriv('aes-256-gcm', key, iv)
    let en$ = stream.pipe(encrypt)
    en$.on('data', (d: Buffer) => {
      console.log(d)
    })
    en$.on('end', () => {
      console.log(encrypt.getAuthTag())
      console.log('end')
    })
  })
})
