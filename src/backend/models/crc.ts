export class CRC {

  private readonly $table: number[];

  constructor() {
    this.$table = this.generateTable();
  }

  private generateTable() {
    const crcTable = [];
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
      }
      crcTable[i] = c;
    }
    return crcTable;
  }

  generate(str: string): number {
    let crc = 0 ^ (-1);

    for (let i = 0; i < str.length; i++) {
      crc = (crc >>> 8) ^ this.$table[(crc ^ str.charCodeAt(i)) & 0xFF]!;
    }

    return (crc ^ (-1)) >>> 0;
  };

}