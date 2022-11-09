import { Decrypt } from '../src/decrypt'
import { Encrypt } from '../src/encrypt'
import { expect } from 'chai'
import { createReadableStream } from './utils'

describe('decrypt', () => {
  const key = Buffer.from(
    'UZ/1c0zuAqURlFKd0/7+TtXP4aFPugihjem1Efiz2ew=',
    'base64'
  )
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
        const targetIV = Buffer.from([
          0x30, 0x1b, 0xa9, 0x16, 0xd4, 0xc3, 0x9d, 0x59, 0x37, 0x0d, 0x27,
          0xea,
        ])
        it('能够正确的获取到 iv, 一次就把 iv 信息带到', (done) => {
          const decrypt = new Decrypt({ key })
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
          const decrypt = new Decrypt({ key })
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
        it('加密时指定 IV，并不自动带上 IV，解密是指定 IV 解密', (done) => {
          const encrypt = new Encrypt({ key, iv: targetIV, withoutIV: true })
          const decrypt = new Decrypt({ key, iv: targetIV })
          const stream = createReadableStream([Buffer.from([0x00])])

          let de$ = stream.pipe(encrypt).pipe(decrypt)
          let buffer = Buffer.from([])
          de$.on('data', (d: Buffer) => {
            buffer = Buffer.concat([buffer, d])
          })
          de$.on('end', () => {
            const target = Buffer.from([0])
            expect(buffer.toString('hex')).eq(target.toString('hex'))
            done()
          })
        })
        it('指定 iv 的方式', (done) => {
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

    describe('使用流式 IV 解密', () => {
      it('多次返回 iv 能正常解码', (done) => {
        const decrypt = new Decrypt({ key })
        const stream = createReadableStream([
          Buffer.from([0x30, 0x1b, 0xa9, 0x16, 0xd4]),
          Buffer.from([0xc3, 0x9d, 0x59, 0x37, 0x0d]),
          Buffer.from([
            0x27, 0xea, 0x53, 0x83, 0x76, 0x3c, 0x5b, 0x05, 0xd0, 0xf9, 0x5d,
            0xae, 0x40, 0x4d, 0x0e, 0x9e, 0x70, 0xfe, 0x13,
          ]),
        ])

        let buffer = Buffer.from([])
        let de$ = stream.pipe(decrypt)
        de$.on('data', (d: Buffer) => {
          buffer = Buffer.concat([buffer, d])
        })
        de$.on('end', () => {
          const target = Buffer.from([0])
          expect(buffer.toString('hex')).eq(
            target.toString('hex'),
            '能够正确解码得到结果'
          )
          done()
        })
      })
      it('authtag 校验码错误，解码不成功', (done) => {
        const decrypt = new Decrypt({ key })
        const stream = createReadableStream([
          Buffer.from([0x30, 0x1b, 0xa9, 0x16, 0xd4]),
          Buffer.from([0xc3, 0x9d, 0x59, 0x37, 0x0d]),
          Buffer.from([
            0x27, 0xea, 0x53, 0x83, 0x76, 0x3c, 0x5b, 0x05, 0xd0, 0xf9, 0x5d,
            0xae, 0x40, 0x4d, 0x0e, 0x9e, 0x70, 0xfe, 0x23,
          ]),
        ])

        let buffer = Buffer.from([])
        let de$ = stream.pipe(decrypt)
        de$.on('data', (d: Buffer) => {
          buffer = Buffer.concat([buffer, d])
        })
        let hasError = false
        de$.on('error', (error) => {
          hasError = true
          const target = Buffer.from([0])
          expect(buffer.toString('hex')).eq(
            target.toString('hex'),
            '校验码不正确依然可以正确的解码出内容'
          )
          expect(error.message).match(
            /Unsupported state or unable to authenticate data/,
            '因为校验码不正确会得到一个错误'
          )
        })
        de$.on('end', () => {
          expect(hasError).eq(true)
          // 报错了也必须完成
          done()
        })
      })

      it('解密一段比较长的内容', (done) => {
        const decrypt = new Decrypt({ key })
        // 模拟一个 iv 密文 校验位穿插的情况
        const stream = createReadableStream([
          // IV
          Buffer.from([0x30, 0x1b, 0xa9, 0x16, 0xd4, 0xc3, 0x9d, 0x59, 0x37]),
          Buffer.from([
            0x0d, 0x27, 0xea,
            // content
            0x53, 0xea, 0x32,
          ]),
          Buffer.from([0xda, 0xde, 0xe0, 0x8d, 0xb5, 0x86, 0x00, 0xc7]),
          Buffer.from([
            0x85, 0xe1, 0x01, 0xa6, 0x61, 0xf2, 0x76, 0xc7, 0x8d, 0x7a,
            // mac
            0xc2, 0xe0, 0x7d,
          ]),
          Buffer.from([
            0xce, 0x7a, 0x17, 0x43, 0x6b, 0x7d, 0x34, 0xa4, 0x15, 0xe3, 0xe7,
            0x4d, 0xfc,
          ]),
        ])

        let buffer = Buffer.from([])
        let de$ = stream.pipe(decrypt)
        de$.on('data', (d: Buffer) => {
          buffer = Buffer.concat([buffer, d])
        })
        de$.on('end', () => {
          const target = Buffer.from([
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
            19, 20,
          ])
          expect(buffer.toString('hex')).eq(target.toString('hex'))
          done()
        })
      })
    })
  })
})
