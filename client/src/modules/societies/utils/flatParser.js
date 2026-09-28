/**
 * Smartly parse flat/room string into wing, floor, and suggested address note
 * Examples:
 * - "A-101" -> { wing: "A", floor: "1" }
 * - "B204" -> { wing: "B", floor: "2" }
 * - "C-1203" -> { wing: "C", floor: "12" }
 * - "Wing B - 302" -> { wing: "B", floor: "3" }
 * - "101" -> { floor: "1" }
 */
export function parseFlatInput(input) {
  if (!input || typeof input !== "string") {
    return { wing: null, floor: null, addressNote: null };
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return { wing: null, floor: null, addressNote: null };
  }

  let wing = null;
  let roomNumStr = null;

  // Pattern 1: Wing prefix e.g. "Wing A-101", "Tower B 204", "A-101", "B204", "C 1205"
  const prefixMatch = trimmed.match(
    /^(?:(?:Wing|Tower|Block|Building)\s+)?([A-Za-z]+)\s*[-_ /]?\s*(\d+)$/i
  );

  // Pattern 2: Suffix wing e.g. "101-A", "101 A", "204B"
  const suffixMatch = trimmed.match(
    /^(\d+)\s*[-_ /]?\s*(?:(?:Wing|Tower|Block|Building)\s+)?([A-Za-z]+)$/i
  );

  // Pattern 3: Pure numbers e.g. "101", "204", "1203"
  const pureNumMatch = trimmed.match(/^(\d+)$/);

  if (prefixMatch) {
    wing = prefixMatch[1].toUpperCase();
    roomNumStr = prefixMatch[2];
  } else if (suffixMatch) {
    wing = suffixMatch[2].toUpperCase();
    roomNumStr = suffixMatch[1];
  } else if (pureNumMatch) {
    roomNumStr = pureNumMatch[1];
  }

  let floor = null;
  if (roomNumStr) {
    const num = parseInt(roomNumStr, 10);
    if (!Number.isNaN(num)) {
      if (roomNumStr.length >= 3) {
        // e.g. 101 -> 1, 204 -> 2, 1203 -> 12
        floor = String(Math.floor(num / 100));
      } else if (roomNumStr.startsWith("0")) {
        // e.g. 01, 02 -> ground floor
        floor = "0";
      } else if (num <= 9) {
        // single digit e.g. 1, 2, 3 -> Floor 0 or 1
        floor = String(num);
      } else {
        // two digit numbers e.g. 12 -> floor 1
        floor = String(Math.floor(num / 10));
      }
    }
  }

  let addressNote = null;
  if (wing && roomNumStr) {
    addressNote = `Wing ${wing}, Flat ${trimmed}`;
  } else if (roomNumStr) {
    addressNote = `Flat ${trimmed}`;
  }

  return { wing, floor, addressNote };
}
