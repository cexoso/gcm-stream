import { expect } from 'chai'
import { add } from '../src/a'
import '../index'
describe('example', () => {
  it('add', () => {
    expect(add(1, 2)).eq(3)
  })
})
