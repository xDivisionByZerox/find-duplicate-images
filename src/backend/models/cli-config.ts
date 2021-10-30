import { IDuplicateFileFinderConstructor } from './duplication-finder';
import { IResultHandlerConstructor } from './result-handler';

function isObject<T extends Record<string, any>>(value: unknown): value is Partial<T> {
  return (
    typeof value === 'object'
    && value !== undefined
  );
}

export class FindConfig implements Required<IResultHandlerConstructor>, Required<IDuplicateFileFinderConstructor> {

  pathToCheck: string;
  outputDir: string;
  jsFileName: string;
  htmlFileName: string;
  recursive: boolean;

  constructor(params: FindConfig) {
    this.htmlFileName = params.htmlFileName;
    this.jsFileName = params.jsFileName;
    this.outputDir = params.outputDir;
    this.pathToCheck = params.pathToCheck;
    this.recursive = params.recursive ?? true;
  }

  static hasConfig = (value: unknown): value is FindConfig => (
    isObject<FindConfig>(value)
    && typeof value.htmlFileName === 'string'
    && typeof value.jsFileName === 'string'
    && typeof value.outputDir === 'string'
    && typeof value.pathToCheck === 'string'
    && (
      value.recursive === undefined
      || typeof value.recursive === 'boolean'
    )
  )

}

export class DeleteConfig {

  path: string;

  constructor(params: DeleteConfig) {
    this.path = params.path;
  }

  static hasConfig = (value: unknown): value is DeleteConfig => (
    isObject<DeleteConfig>(value)
    && typeof value.path === 'string'
  )
}
