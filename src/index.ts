const ONES = [
  "",
  "bir",
  "iki",
  "üç",
  "dörd",
  "beş",
  "altı",
  "yeddi",
  "səkkiz",
  "doqquz",
] as const;

const TENS = [
  "",
  "on",
  "iyirmi",
  "otuz",
  "qırx",
  "əlli",
  "altmış",
  "yetmiş",
  "səksən",
  "doxsan",
] as const;

const SCALES = ["", "min", "milyon", "milyard", "trilyon", "kvadrilyon"] as const;

const ZERO = "sıfır";
const NEGATIVE = "mənfi";
const MAJOR_UNIT = "manat";
const MINOR_UNIT = "qəpik";

export interface NumberToWordsOptions {
  capitalize?: boolean;
}

export interface ManatToWordsOptions extends NumberToWordsOptions {
  alwaysShowMinor?: boolean;
}

type NumericInput = number | string | bigint;

interface ParsedAmount {
  negative: boolean;
  whole: bigint;
  minor: number;
}

function convertGroup(group: number): string[] {
  const words: string[] = [];

  const hundreds = Math.floor(group / 100);
  const tens = Math.floor((group % 100) / 10);
  const ones = group % 10;

  if (hundreds > 0) {
    if (hundreds > 1) words.push(ONES[hundreds]!);
    words.push("yüz");
  }
  if (tens > 0) words.push(TENS[tens]!);
  if (ones > 0) words.push(ONES[ones]!);

  return words;
}

function convertWhole(value: bigint): string {
  if (value === 0n) return ZERO;

  // Split into 3-digit groups, lowest first
  const groups: number[] = [];
  let rest = value;
  while (rest > 0n) {
    groups.push(Number(rest % 1000n));
    rest /= 1000n;
  }

  if (groups.length > SCALES.length) throw new RangeError("Number too large");

  const words: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const group = groups[i]!;
    if (group === 0) continue;

    // instead of "bir min" - only "min"
    if (group === 1 && i === 1) {
      words.push("min");
      continue;
    }

    words.push(...convertGroup(group));
    if (i > 0) words.push(SCALES[i]!);
  }

  return words.join(" ");
}

function parse(input: NumericInput, allowFraction: boolean): ParsedAmount {
  let raw: string;

  if (typeof input === "bigint") {
    raw = input.toString();
  } else if (typeof input === "number") {
    if (!Number.isFinite(input)) throw new RangeError("Invalid number");
    if (Number.isInteger(input) && !Number.isSafeInteger(input)) {
      throw new RangeError("Invalid number");
    }

    raw = String(input);
    // For example: 1e21 
    if (raw.includes("e") || raw.includes("E")) {
      throw new RangeError("Invalid number");
    }
  } else {
    raw = input.trim();
  }

  const negative = raw.startsWith("-");
  if (negative || raw.startsWith("+")) raw = raw.slice(1);

  const [integerPart = "", fractionPart = ""] = raw.split(".");
  if (!/^\d+$/.test(integerPart) || (fractionPart !== "" && !/^\d+$/.test(fractionPart))) {
    throw new TypeError("Wrong format");
  }

  let whole = BigInt(integerPart);
  let minor = 0;

  if (fractionPart !== "") {
    if (!allowFraction) throw new RangeError("Fraction not supported");

    // Round to 2 decimal places
    const padded = (fractionPart + "000").slice(0, 3);
    minor = Number(padded.slice(0, 2));
    if (Number(padded[2]) >= 5) {
      minor += 1;
      if (minor === 100) {
        minor = 0;
        whole += 1n;
      }
    }
  }

  return { negative, whole, minor };
}

export function numberToWords(
  value: NumericInput,
  options: NumberToWordsOptions = {},
): string {
  const { negative, whole } = parse(value, false);

  let result = convertWhole(whole);
  if (negative && whole !== 0n) result = `${NEGATIVE} ${result}`;

  if (options.capitalize && result !== "") {
    result = result.charAt(0).toLocaleUpperCase("az") + result.slice(1);
  }
  return result;
}

export function manatToWords(
  value: NumericInput,
  options: ManatToWordsOptions = {},
): string {
  const { negative, whole, minor } = parse(value, true);

  const showMinor = minor > 0 || options.alwaysShowMinor === true;
  const showMajor = whole > 0n || options.alwaysShowMinor === true || minor === 0;

  const parts: string[] = [];
  if (showMajor) parts.push(`${convertWhole(whole)} ${MAJOR_UNIT}`);
  if (showMinor) parts.push(`${convertWhole(BigInt(minor))} ${MINOR_UNIT}`);

  let result = parts.join(" ");
  if (negative && (whole > 0n || minor > 0)) {
    result = `${NEGATIVE} ${result}`;
  }

  if (options.capitalize && result !== "") {
    result = result.charAt(0).toLocaleUpperCase("az") + result.slice(1);
  }
  return result;
}