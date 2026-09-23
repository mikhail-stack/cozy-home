// Стабильный числовой seed из строки — используется, чтобы у одного и
// того же товара картинка не менялась при каждом рендере.
export function hashStringToNumber(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 1000;
  }
  return hash;
}
