export enum EDuplicationProgressEventType {
  START = 0,
  FOUND = 1,
  UPDATE = 2,
  FINISHED = 3,
}

class DuplicationProgressEvent {
  constructor(
    public type: EDuplicationProgressEventType,
  ) { }
}

export class DuplicationProgressStartEvent extends DuplicationProgressEvent {
  constructor(public step: 'read' | 'compare') {
    super(EDuplicationProgressEventType.START);
  }
}

export class DuplicationProgressFoundEvent extends DuplicationProgressEvent {
  constructor(public group: string[]) {
    super(EDuplicationProgressEventType.FOUND);
  }
}

interface IUpdateEventParams {
  total: number;
  completed: number;
}

export class DuplicationProgressUpdateEvent extends DuplicationProgressEvent implements IUpdateEventParams {

  total: number;
  completed: number;

  constructor(params: IUpdateEventParams) {
    super(EDuplicationProgressEventType.UPDATE);

    this.total = params.total;
    this.completed = params.completed;
  }
}

interface IFinishedEventParams extends IUpdateEventParams {
  timeTaken: number;
  results: string[][];
}

export class DuplicationProgressFinishedEvent extends DuplicationProgressEvent implements IFinishedEventParams, DuplicationProgressUpdateEvent {

  completed: number;
  total: number;
  timeTaken: number;
  results: string[][];

  constructor(params: IFinishedEventParams) {
    super(EDuplicationProgressEventType.FINISHED);

    this.completed = params.completed;
    this.results = params.results;
    this.timeTaken = params.timeTaken;
    this.total = params.total;
  }
}