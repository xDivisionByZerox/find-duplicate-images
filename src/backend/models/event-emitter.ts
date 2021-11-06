import { Observable, Subject } from 'rxjs';
import { ProgressFinishEvent, ProgressFoundEvent, ProgressStartEvent, ProgressUpdateEvent } from '../../shared/events/base.events';

export type EventMap<FoundType> = {
  found$: Observable<ProgressFoundEvent<FoundType>>,
  finish$: Observable<ProgressFinishEvent>,
  update$: Observable<ProgressUpdateEvent>,
  start$: Observable<ProgressStartEvent>,
};

export class EventEmitter<FoundType> {

  private readonly $updateInterval: number;

  private readonly $start$ = new Subject<ProgressStartEvent>();
  readonly start$ = this.$start$.asObservable();

  private readonly $update$ = new Subject<ProgressUpdateEvent>();
  readonly update$ = this.$update$.asObservable();

  private readonly $found$ = new Subject<ProgressFoundEvent<FoundType>>();
  readonly found$ = this.$found$.asObservable();

  private readonly $finish$ = new Subject<ProgressFinishEvent>();
  readonly finish$ = this.$finish$.asObservable();

  constructor(updateInterval: number) {
    this.$updateInterval = updateInterval;
  }

  emitStart(value: ProgressStartEvent): ProgressStartEvent {
    this.$start$.next(value);

    return value;
  }

  emitUpdate(value: ProgressUpdateEvent): ProgressUpdateEvent {
    if (value.completed % this.$updateInterval === 0) {
      this.$update$.next(value);
    }

    return value;
  }

  emitFound(value: ProgressFoundEvent<FoundType>): ProgressFoundEvent<FoundType> {
    this.$found$.next(value);

    return value;
  }

  emitFinish(value: ProgressFinishEvent): ProgressFinishEvent {
    this.$finish$.next(value);

    return value;
  }

  getEventMap(): EventMap<FoundType> {
    return {
      found$: this.found$,
      finish$: this.finish$,
      update$: this.update$,
      start$: this.start$,
    }
  }

}