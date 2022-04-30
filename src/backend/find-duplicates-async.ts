import { createHash } from 'crypto';
import { readdir, readFile, stat } from 'fs/promises';
import { join, normalize } from 'path';
import { FindResult, IFindMetadata } from '../shared/find-result';

type FindRecursiveResult = IFindMetadata & {
  hashMap: Map<string, string[]>;
};

export async function findDuplicates(directoyPath: string, recursive: boolean): Promise<FindResult> {
  const { hashMap, ...result } = await findDuplicatesRecursive(directoyPath, recursive);
  const duplicates = [...hashMap.values()].filter((elem) => elem.length > 1);

  return {
    ...result,
    duplicates,
  };
}

async function findDuplicatesRecursive(directoyPath: string, recursive: boolean): Promise<FindRecursiveResult> {
  // [hash, filePathes]
  const hashMap = new Map<string, string[]>();
  const filePathes: string[] = [];
  const subDirectorys: string[] = [];
  let totalBytes = 0;

  const directoryOutput = await readdir(directoyPath);
  const promises = directoryOutput.map(async (fileName) => {
    const fullPath = normalize(join(directoyPath, fileName));
    const stats = await stat(fullPath);

    if (stats.isFile()) {
      filePathes.push(fullPath);
      totalBytes = totalBytes + stats.size;
      const hash = await getFileContentHash(fullPath);
      mergeArrayValueMap(hashMap, hash, fullPath);
    } else if (stats.isDirectory()) {
      subDirectorys.push(fullPath);
    }
  });

  await Promise.allSettled(promises);

  if (recursive) {
    // copy `subDirectorys` to not override it while mapping
    const subDirectoryPromises = [...subDirectorys].map(async (subDir) => {
      const result = await findDuplicatesRecursive(subDir, recursive);
      subDirectorys.push(...result.subDirectorys);
      filePathes.push(...result.filePathes);
      totalBytes = totalBytes + result.totalBytes;
      for (const [hash, pathes] of result.hashMap.entries()) {
        for (const path of pathes) {
          mergeArrayValueMap(hashMap, hash, path);
        }
      }
    });
    await Promise.allSettled(subDirectoryPromises);
  }

  return {
    filePathes,
    subDirectorys,
    totalBytes,
    hashMap,
  };
}

function mergeArrayValueMap(map: Map<string, string[]>, key: string, value: string) {
  const existing = map.get(key);
  if (existing !== undefined) {
    existing.push(value);
  } else {
    map.set(key, [value]);
  }
}

async function getFileContentHash(filePath: string): Promise<string> {
  const buffer = await readFile(filePath);
  const hash = createHash('sha256')
    .update(buffer)
    .digest('hex');

  return hash;
}

