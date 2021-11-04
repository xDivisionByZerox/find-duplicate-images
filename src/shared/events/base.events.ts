export type ProgressEventConstructor = {  
  type: number;
}

class ProgressEvent {

  readonly type: number;

  constructor(params: ProgressEventConstructor) { 
    this.type = params.type;
  }

}

export abstract class ProgressStartEvent extends ProgressEvent { }

export type ProgressFoundEventType = {
  group: string[];
}

export type ProgressFoundEventConstructor = ProgressEventConstructor & ProgressFoundEventType;

export abstract class ProgressFoundEvent extends ProgressEvent {
  
  readonly group: string[];

  constructor(params: ProgressFoundEventConstructor) {
    super(params);
    this.group = params.group;
  }

}

export type ProgressUpdateEventType = {
  total: number;
  completed: number;
}

export type ProgressUpdateEventConstructor = ProgressEventConstructor & ProgressUpdateEventType;

export abstract class ProgressUpdateEvent extends ProgressEvent {

  readonly total: number;
  readonly completed: number;

  constructor(params: ProgressUpdateEventConstructor) {
    super(params);

    this.total = params.total;
    this.completed = params.completed;
  }
}

export type ProgressFinishEventType = ProgressUpdateEventType & {
  timeTaken: number;
  results: string[][];
}

export type ProgressFinishEventConstructor = ProgressUpdateEventConstructor & ProgressFinishEventType;

export abstract class ProgressFinishEvent extends ProgressUpdateEvent {

  readonly results: string[][];
  readonly timeTaken: number;

  constructor(params: ProgressFinishEventConstructor) {
    super(params);

    this.results = params.results;
    this.timeTaken = params.timeTaken;
  }
}