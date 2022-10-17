# aes-gcm

这是一个流式 GCM 加解密的库。零依赖，有单元测试用例。

# install

```
npm i gcm-stream
```

# 使用

```typescript
import { Encrypt, Decrypt } from 'gcm-stream'

const key = crypto.randomBytes(32)
const iv = crypto.randomBytes(16)
const encrypt = new Encrypt({ key, iv })
const decrypt = new Decrypt({ key })

const readStream = fs.createReadStream('test')
readStream.pipe(encrypt).pipe(decrypt).pipe(fs.createWriteStream('test.dec'))
```

## const encrypt = Encrypt(options)

支持的参数
| name | 作用 | 是否必填 |
|-------------- | -------------- | -------------- |
| key | 密钥，用于加解密 | 否，如果不传内部会随机, 可以通过 encrypt.getKey 或者 encrypt.getKeyBase64 获取
| iv | 初始化向量| 否，如果不传内部会随机, 可以通过 encrypt.getIV |
| ivLength | 初始化向量随机的长度, 默认 12 bytes, 当不传递 iv 时用于自动生成 iv| 否|
| cipherGCMTypes | gcm 加密类型| 否,默认 aes-256-gcm|
| macLength | 校验码的长度| 否,默认 16 bytes|

## const encrypt = Encrypt(options)

支持的参数
| name | 作用 | 是否必填 |
|-------------- | -------------- | -------------- |
| key | 密钥，用于加解密 | 否，如果不传内部会随机, 可以通过 encrypt.getKey
| iv | 初始化向量| 否，如果不传内部会随机, 会自动从密文数据中头部读取 |
| ivLength | 初始化向量随机的长度, 默认 12 bytes 用于描述 iv 占用了多少位 bytes| 否|
| cipherGCMTypes | gcm 加密类型| 否,默认 aes-256-gcm|
| macLength | 校验码的长度| 否,默认 16 bytes|

 注意: 加密解密的 key 要一样, iv 长度和 mac 的长度也很重要，如果约定不是使用 iv 12bytes、macLength 16bytes 的情况下，需要主动的声明长度.


# 背景

这个库解决的问题是，我需要从 COS（一个文件存储系统） 上下载加密后的密文，经过解密后再将原文传递给用户。在这个过程中，我需要考虑大文件的问题，如果一个文件很大，有 40-50M 情况的话，我不能等待所有的文件内容都下载完成后，才开始解密。因为此时用户是收不到一个字节的，这可能会导致用户的浏览器认识服务器没有影响主动超时挂掉连接。

解决的办法是，一边从 COS 上下载内容，一边解密出原文，一边传输原文给用户。

我在 github 和 npm 上查找了解决方案，但未能如愿找到好的库。一个我尝试找到的库是
[aes-gcm-stream](https://github.com/mattsurabian/aes-gcm-stream)。但我在阅读原码的时候发现，这个库存在两个问题。

1. 不支持 typescript，这个库最近的更新时间已经是 8 年前了，当时 typescript 并不火。

2. 这个库并不是真正的流式的，我在阅读了它的源码时发现，它只是对外暴露了流式的处理接口，但是真正处理的逻辑并不是流式的。它会一起收集上游的数据，直到上游输出结束后才开始解密处理。这不仅让解密的输出置后，还会因为保留所有的数据，而让内存占用达到一个 `O(n)` 级别，其中 n 表示密文的长度。

为此我特地写了这个库。

# 原理

这个库是怎么支持流式的？

## GCM 加密数据构成

GCM 加密算法数据的构成是，开着为一段初始化向量 iv（也作 nonce）。初始化 GCM 加密需要密钥(key)和初始化向量(iv)，其中 iv 是可以公开的，所以 GCM 中可以将 iv 放在密文前传输。iv 的长度一般是 12 bytes，但也可以自定义长度。

在 iv 后跟随着的就是密文，密文的长度不确定，与原文相关。

在密文的后面跟随着的是校验码(MAC)，在 nodejs 中是 authTag，校验码的作用是检查数据包是否被串改。一旦密文被串改，在解码时就会因为校验码校验不通过而报错。 MAC 的长度一般是 16 bytes，但也可以自定义长度。

## 如何做到流式加解密

先说一个前提，本身 GCM 密文就是可以支持到流式加解密的。我所需要做的是处理数据结构。

1.数据加密

数据加密比较简单，先将 iv 输出到流，再将流式的加密原文，一边得到密文一边输出到流，当所有的原文都加密结束后，拿到 authTag，再将 authTag 输出到流。即可完成流式加密。

2.数据解密

数据解密比加密复杂一些，首先持续的获取流式数据，当数据的长度达到 iv 的长度时，将 iv 获取出来，就可以开始解密了。之后仍然要流式的获取到数据，之后除尾部 mac length 之外的数据取出，用于解密。当流完成时，再将最后的 mac length 长度的数据取出，用于检验，完成全部的流式解密过程。

# 注意

目前加密没有支持不往密文前添加 IV 的形式，我仅完成了当前我的需求。欢迎 PR，或者告诉我。
