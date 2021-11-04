import { ProgressFinishEvent, ProgressFinishEventType, ProgressFoundEvent, ProgressFoundEventType, ProgressStartEvent, ProgressUpdateEvent, ProgressUpdateEventType } from './base.events';

export enum EReadProgressEventType {
  START = 0,
  FOUND = 1,
  UPDATE = 2,
  FINISH = 3,
}

export class ReadStartEvent extends ProgressStartEvent {
  constructor() {
    super({
      type: EReadProgressEventType.START
    });
  }
}

export class ReadFoundEvent extends ProgressFoundEvent {
  constructor(params: ProgressFoundEventType) {
    super({
      group: params.group,
      type: EReadProgressEventType.FOUND,
    });
  }
}

export class ReadUpdateEvent extends ProgressUpdateEvent {
  constructor(params: ProgressUpdateEventType) {
    super({
      completed: params.completed,
      total: params.total,
      type: EReadProgressEventType.UPDATE,
    });
  }
}

export class ReadFinishEvent extends ProgressFinishEvent {
  constructor(params: ProgressFinishEventType) {
    super({
      completed: params.completed,
      results: params.results,
      timeTaken: params.timeTaken,
      total: params.total,
      type: EReadProgressEventType.UPDATE,
    });
  }
}