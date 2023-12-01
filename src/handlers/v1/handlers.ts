export function getFileExtension(filename: string): string {
  return filename.substring(filename.lastIndexOf('.') + 1, filename.length) || filename;
}