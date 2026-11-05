import bytes from 'bytes';



type Unit = 'b' | 'gb' | 'kb' | 'mb' | 'pb' | 'tb' | 'B' | 'GB' | 'KB' | 'MB' | 'PB' | 'TB';
type ValueType = `${number}${Unit}`

export default function toBytes(val: ValueType) {
  return Number(bytes(val));
}