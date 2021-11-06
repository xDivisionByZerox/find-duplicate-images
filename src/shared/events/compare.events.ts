import { ProgressFinishEvent, ProgressFinishEventConstructor, ProgressFoundEvent, ProgressStartEvent, ProgressUpdateEvent } from './base.events';

export enum ECompareProgressEventType {
  START = 0,
  FOUND = 1,
  UPDATE = 2,
  FINISH = 3,
}

export class CompareStartEvent extends ProgressStartEvent {}

export class CompareFoundEvent extends ProgressFoundEvent<string[]> {}

export class CompareUpdateEvent extends ProgressUpdateEvent {}

type CompareFinishConstructor = ProgressFinishEventConstructor & {  
  results: string[][];
};

export class CompareFinishEvent extends ProgressFinishEvent {

  results: string[][];

  constructor(params: CompareFinishConstructor) {
    super(params);

    this.results = params.results;
  }
}


