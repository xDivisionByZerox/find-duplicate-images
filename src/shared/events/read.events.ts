import { ProgressFinishEvent, ProgressStartEvent } from './base.events';

export enum EReadProgressEventType {
  START = 0,
  FOUND = 1,
  FINISH = 3,
}

export class ReadStartEvent extends ProgressStartEvent { }

type ReadFinishEventConstructor = {
  files: number;
  subDirectories: number;
  totalBytes: number;
  startTime: number;
}

export class ReadFinishEvent extends ProgressFinishEvent {

  files: number;
  subDirectories: number;
  totalBytes: number;

  constructor(params: ReadFinishEventConstructor) {
    super({
      completed: params.files,
      startTime: params.startTime,
      total: params.files,
    });

    this.files = params.files;
    this.subDirectories = params.subDirectories;
    this.totalBytes = params.totalBytes;
  }

}
