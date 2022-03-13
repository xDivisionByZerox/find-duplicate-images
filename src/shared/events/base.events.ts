export abstract class ProgressStartEvent {

  readonly startTime: number;

  constructor(startTime?: number) {
    this.startTime = startTime ?? Date.now();
  }

}

export abstract class ProgressFoundEvent<T> {

  readonly group: T;

  constructor(params: ProgressFoundEvent<T>) {
    this.group = params.group;
  }

}

export abstract class ProgressUpdateEvent {

  readonly total: number;
  readonly completed: number;

  constructor(params: ProgressUpdateEvent) {
    this.total = params.total;
    this.completed = params.completed;
  }

}

export type ProgressFinishEventConstructor = Pick<
  ProgressFinishEvent,
  'completed'
  | 'total'
> & {
  startTime: number;
};

export abstract class ProgressFinishEvent extends ProgressUpdateEvent {

  readonly timeTaken: number;

  constructor(params: ProgressFinishEventConstructor) {
    super(params);

    this.timeTaken = Date.now() - params.startTime;
  }

}
