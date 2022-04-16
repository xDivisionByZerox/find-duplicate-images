export interface IFindMetadata {
  filePathes: string[];
  subDirectorys: string[];
  totalBytes: number;
}

export type FindResult = IFindMetadata & {
  duplicates: string[][];
};
