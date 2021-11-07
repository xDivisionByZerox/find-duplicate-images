import { ProgressFinishEvent, ProgressFoundEvent, ProgressStartEvent, ProgressUpdateEvent } from './base.events';

export enum EReadProgressEventType {
  START = 0,
  FOUND = 1,
  FINISH = 3,
}

export class ReadStartEvent extends ProgressStartEvent { }

export enum EReadFoundType {
  FILE,
  SUBDIRECTORY,
}

type ReadFoundEventConstructor = ProgressFoundEvent<string> & {
  type: EReadFoundType;
}

export class ReadFoundEvent extends ProgressFoundEvent<string> { 
  
  type: EReadFoundType;

  constructor(params: ReadFoundEventConstructor) {
    super(params);
    
    this.type = params.type;
  }
}

export class ReadFinishEvent extends ProgressFinishEvent { }
