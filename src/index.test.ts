import { describe, expect, it } from "vitest";
import { manatToWords, numberToWords } from "./index.js";

describe("numberToWords", () => {
  it("single digits", () => {
    expect(numberToWords(0)).toBe("sıfır");
    expect(numberToWords(1)).toBe("bir");
    expect(numberToWords(4)).toBe("dörd");
    expect(numberToWords(9)).toBe("doqquz");
  });

  it("tens", () => {
    expect(numberToWords(10)).toBe("on");
    expect(numberToWords(11)).toBe("on bir");
    expect(numberToWords(20)).toBe("iyirmi");
    expect(numberToWords(40)).toBe("qırx");
    expect(numberToWords(99)).toBe("doxsan doqquz");
  });

  // we do not say "bir yüz" or "bir min", but we do say "bir milyon"
  it("hundred and thousand do not take 'bir'", () => {
    expect(numberToWords(100)).toBe("yüz");
    expect(numberToWords(101)).toBe("yüz bir");
    expect(numberToWords(110)).toBe("yüz on");
    expect(numberToWords(200)).toBe("iki yüz");
    expect(numberToWords(999)).toBe("doqquz yüz doxsan doqquz");

    expect(numberToWords(1000)).toBe("min");
    expect(numberToWords(1100)).toBe("min yüz");
    expect(numberToWords(1250)).toBe("min iki yüz əlli");
    expect(numberToWords(2000)).toBe("iki min");
  });

  it("million and bigger", () => {
    expect(numberToWords(1_000_000)).toBe("bir milyon");
    expect(numberToWords(1_000_000_000)).toBe("bir milyard");
    expect(numberToWords(1_001_000)).toBe("bir milyon min");
    expect(numberToWords(2_000_001)).toBe("iki milyon bir");

    // empty groups in the middle must be skipped
    expect(numberToWords(1_000_005)).toBe("bir milyon beş");
    expect(numberToWords(100_000)).toBe("yüz min");
  });

  it("negative numbers", () => {
    expect(numberToWords(-7)).toBe("mənfi yeddi");
    expect(numberToWords(-0)).toBe("sıfır");
  });

  it("string and bigint input", () => {
    expect(numberToWords("42")).toBe("qırx iki");
    expect(numberToWords(1234567890123456n)).toContain("kvadrilyon");
  });

  it("capitalize i -> İ", () => {
    expect(numberToWords(2, { capitalize: true })).toBe("İki");
    expect(numberToWords(20, { capitalize: true })).toBe("İyirmi");
    expect(numberToWords(5, { capitalize: true })).toBe("Beş");
  });

  it("rejects bad input", () => {
    expect(() => numberToWords(1.5)).toThrow(RangeError); // decimals only in manatToWords
    expect(() => numberToWords(Infinity)).toThrow(RangeError);
    expect(() => numberToWords(NaN)).toThrow(RangeError);
    expect(() => numberToWords("abc")).toThrow(TypeError);
  });
});

describe("manatToWords", () => {
  it("whole amount", () => {
    expect(manatToWords(1250)).toBe("min iki yüz əlli manat");
    expect(manatToWords(0)).toBe("sıfır manat");
  });

  it("amount with qepik", () => {
    expect(manatToWords(1250.5)).toBe("min iki yüz əlli manat əlli qəpik");
    expect(manatToWords("1250.05")).toBe("min iki yüz əlli manat beş qəpik");
    expect(manatToWords(0.99)).toBe("doxsan doqquz qəpik");
  });

  it("alwaysShowMinor gives the official format", () => {
    expect(manatToWords(1250, { alwaysShowMinor: true })).toBe("min iki yüz əlli manat sıfır qəpik");
    expect(manatToWords(0, { alwaysShowMinor: true })).toBe("sıfır manat sıfır qəpik");
  });

  // rounds by the third digit, and the manat part can go up too
  it("rounding", () => {
    expect(manatToWords("10.994")).toBe("on manat doxsan doqquz qəpik");
    expect(manatToWords("10.995")).toBe("on bir manat");
    expect(manatToWords("0.999")).toBe("bir manat");
  });

  it("does not lose float precision", () => {
    expect(manatToWords("0.07")).toBe("yeddi qəpik");
    expect(manatToWords("1.10")).toBe("bir manat on qəpik");
  });

  it("negative amount", () => {
    expect(manatToWords(-5.5)).toBe("mənfi beş manat əlli qəpik");
  });
});