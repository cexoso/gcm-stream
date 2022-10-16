import { Decrypt } from '../src/decrypt'
import { expect } from 'chai'
import { createReadableStream } from './utils'

describe.only('decrypt', () => {
  describe('初始化逻辑', () => {
    describe('初始化必须指定 key', () => {
      it('base64', () => {
        const decrypt = new Decrypt({
          key: Buffer.from([
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
          ]).toString('base64'),
          iv: Buffer.from([0, 0, 0, 0]),
          cipherGCMTypes: 'aes-128-gcm',
        })
        expect(decrypt.getKey().toString('hex')).eq(
          '000102030405060708090a0b0c0d0e0f'
        )
      })
      it('buffer', () => {
        const decrypt = new Decrypt({
          key: Buffer.from([
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
          ]),
          iv: Buffer.from([0, 0, 0, 0]),
          cipherGCMTypes: 'aes-128-gcm',
        })
        expect(decrypt.getKey().toString('hex')).eq(
          '000102030405060708090a0b0c0d0e0f'
        )
      })
    })
    describe('可以指定 macLength', () => {
      it('可以指定 macLength', () => {
        const decrypt = new Decrypt({
          key: Buffer.from([
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
          ]).toString('base64'),
          iv: Buffer.from([0, 0, 0, 0]),
          cipherGCMTypes: 'aes-128-gcm',
          macLength: 20,
        })
        expect(decrypt).has.property('macLength', 20)
      })
    })
    describe('流式解密', () => {
      describe('获取 iv', () => {
        const getDecrypt = () => {
          const key = Buffer.from(
            'UZ/1c0zuAqURlFKd0/7+TtXP4aFPugihjem1Efiz2ew=',
            'base64'
          )
          const decrypt = new Decrypt({
            key,
          })
          return decrypt
        }
        const targetIV = Buffer.from([
          0x30, 0x1b, 0xa9, 0x16, 0xd4, 0xc3, 0x9d, 0x59, 0x37, 0x0d, 0x27,
          0xea,
        ])
        it('能够正确的获取到 iv, 一次就把 iv 信息带到', (done) => {
          const decrypt = getDecrypt()
          const decryptedContent = Buffer.from([
            0x30, 0x1b, 0xa9, 0x16, 0xd4, 0xc3, 0x9d, 0x59, 0x37, 0x0d, 0x27,
            0xea, 0x53, 0x83, 0x76, 0x3c, 0x5b, 0x05, 0xd0, 0xf9, 0x5d, 0xae,
            0x40, 0x4d, 0x0e, 0x9e, 0x70, 0xfe, 0x13,
          ])

          // 一次全部读取
          const stream = createReadableStream([decryptedContent])

          let de$ = stream.pipe(decrypt)
          de$.on('data', () => {})
          de$.on('end', () => {
            const ivBuffer = decrypt.getIV()
            expect(ivBuffer.toString('hex')).eq(targetIV.toString('hex'))
            done()
          })
        })
        it('多次返回', (done) => {
          const decrypt = getDecrypt()
          const stream = createReadableStream([
            Buffer.from([0x30, 0x1b, 0xa9, 0x16, 0xd4]),
            Buffer.from([0xc3, 0x9d, 0x59, 0x37, 0x0d]),
            Buffer.from([
              0x27, 0xea, 0x53, 0x83, 0x76, 0x3c, 0x5b, 0x05, 0xd0, 0xf9, 0x5d,
              0xae, 0x40, 0x4d, 0x0e, 0x9e, 0x70, 0xfe, 0x13,
            ]),
          ])

          let de$ = stream.pipe(decrypt)
          de$.on('data', () => {})
          de$.on('end', () => {
            const ivBuffer = decrypt.getIV()
            expect(ivBuffer.toString('hex')).eq(targetIV.toString('hex'))
            done()
          })
        })
        it('指定 iv 的方式', (done) => {
          const key = Buffer.from(
            'UZ/1c0zuAqURlFKd0/7+TtXP4aFPugihjem1Efiz2ew=',
            'base64'
          )
          const decrypt = new Decrypt({
            key,
            iv: targetIV,
          })
          const stream = createReadableStream([
            Buffer.from([
              0x53, 0x83, 0x76, 0x3c, 0x5b, 0x05, 0xd0, 0xf9, 0x5d, 0xae, 0x40,
              0x4d, 0x0e, 0x9e, 0x70, 0xfe, 0x13,
            ]),
          ])

          let de$ = stream.pipe(decrypt)
          de$.on('data', () => {})
          de$.on('end', () => {
            const ivBuffer = decrypt.getIV()
            expect(ivBuffer.toString('hex')).eq(targetIV.toString('hex'))
            done()
          })
        })
      })
    })

    it.skip('能够正确的获取到 iv', (done) => {
      const key = Buffer.from(
        'UZ/1c0zuAqURlFKd0/7+TtXP4aFPugihjem1Efiz2ew=',
        'base64'
      )
      const decrypt = new Decrypt({
        key,
      })
      const decryptedContent = Buffer.from([
        0x30, 0x1b, 0xa9, 0x16, 0xd4, 0xc3, 0x9d, 0x59, 0x37, 0x0d, 0x27, 0xea,
        0x53, 0x83, 0x76, 0x3c, 0x5b, 0x05, 0xd0, 0xf9, 0x5d, 0xae, 0x40, 0x4d,
        0x0e, 0x9e, 0x70, 0xfe, 0x13,
      ])

      // 一次全部读取
      const stream = createReadableStream([decryptedContent])

      let buffer = Buffer.from([])
      let de$ = stream.pipe(decrypt)
      de$.on('data', (d: Buffer) => {
        buffer = Buffer.concat([buffer, d])
      })
      de$.on('end', () => {
        done()
      })
    })
  })
})
