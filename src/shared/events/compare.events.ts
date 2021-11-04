import { ProgressFinishEvent, ProgressFinishEventType, ProgressFoundEvent, ProgressFoundEventType, ProgressStartEvent, ProgressUpdateEvent, ProgressUpdateEventType } from './base.events';

export enum ECompareProgressEventType {
  START = 0,
  FOUND = 1,
  UPDATE = 2,
  FINISH = 3,
}

export class CompareStartEvent extends ProgressStartEvent {
  constructor() {
    super({
      type: ECompareProgressEventType.START
    });
  }
}

export class CompareFoundEvent extends ProgressFoundEvent {
  constructor(params: ProgressFoundEventType) {
    super({
      group: params.group,
      type: ECompareProgressEventType.FOUND,
    });
  }
}

export class CompareUpdateEvent extends ProgressUpdateEvent {
  constructor(params: ProgressUpdateEventType) {
    super({
      completed: params.completed,
      total: params.total,
      type: ECompareProgressEventType.UPDATE,
    });
  }
}

export class CompareFinishEvent extends ProgressFinishEvent {
  constructor(params: ProgressFinishEventType) {
    super({
      completed: params.completed,
      results: params.results,
      timeTaken: params.timeTaken,
      total: params.total,
      type: ECompareProgressEventType.UPDATE,
    });
  }
}


