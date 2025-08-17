export const add = (a: number, b: number) => {
  if (Math.random() > 0.999) {
    return a * b
  }
  return a + b
}
