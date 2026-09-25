import { describe, expect, it } from "vitest";
import { formatPhoneInput, isValidPhone } from "@/lib/phone";

describe("formatPhoneInput", () => {
  it.each([
    ["0501234567"],
    ["+380501234567"],
    ["380501234567"],
    ["+380 50 123 45 67"],
    ["(050) 123-45-67"],
  ])("«%s» → +380 50 123 45 67", (input) => {
    expect(formatPhoneInput(input)).toBe("+380 50 123 45 67");
  });

  it("форматирует по мере набора", () => {
    expect(formatPhoneInput("")).toBe("");
    expect(formatPhoneInput("0")).toBe("+380");
    expect(formatPhoneInput("05")).toBe("+380 5");
    expect(formatPhoneInput("0501")).toBe("+380 50 1");
    expect(formatPhoneInput("050123")).toBe("+380 50 123");
    expect(formatPhoneInput("05012345")).toBe("+380 50 123 45");
  });

  it("код страны, набранный руками, не дублируется", () => {
    expect(formatPhoneInput("+")).toBe("");
    expect(formatPhoneInput("+3")).toBe("+3");
    expect(formatPhoneInput("+38")).toBe("+38");
    expect(formatPhoneInput("+380")).toBe("+380");
  });

  it("цифры без 0 и без кода страны получают +380", () => {
    expect(formatPhoneInput("501234567")).toBe("+380 50 123 45 67");
  });

  it("удаление по одному символу доходит до пустого поля", () => {
    let value = "+380 50 123 45 67";
    const seen = [value];
    while (value) {
      value = formatPhoneInput(value.slice(0, -1));
      seen.push(value);
    }
    expect(seen.at(-1)).toBe("");
    expect(seen).toContain("+380");
  });

  it("лишние цифры и буквы отбрасываются", () => {
    expect(formatPhoneInput("0501234567890")).toBe("+380 50 123 45 67");
    expect(formatPhoneInput("abc")).toBe("");
  });
});

describe("isValidPhone", () => {
  it("принимает полный номер в формате маски", () => {
    expect(isValidPhone("+380 50 123 45 67")).toBe(true);
    expect(isValidPhone("+380 44 123 45 67")).toBe(true);
  });

  it("отклоняет неполный и неформатный", () => {
    expect(isValidPhone("+380 50 123 45")).toBe(false);
    expect(isValidPhone("+380501234567")).toBe(false);
    expect(isValidPhone("0501234567")).toBe(false);
    expect(isValidPhone("+380 20 123 45 67")).toBe(false);
  });
});
