export function trimString(input: string) {
  return input.trim().replace(/\s+/g, ' ');
}

export default trimString;