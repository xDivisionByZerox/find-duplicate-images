import { Subject } from 'rxjs';
import { ProgressFinishEvent, ProgressFoundEvent, ProgressStartEvent, ProgressUpdateEvent } from '../../shared/events/base.events';

export class EventEmitter {
  
  private readonly $updateInterval: number;

  private readonly $start$ = new Subject<ProgressStartEvent>();
  readonly start$ = this.$start$.asObservable();

  private readonly $update$ = new Subject<ProgressUpdateEvent>();
  readonly update$ = this.$update$.asObservable();

  private readonly $found$ = new Subject<ProgressFoundEvent>();
  readonly found$ = this.$found$.asObservable();

  private readonly $finish$ = new Subject<ProgressFinishEvent>();
  readonly finish$ = this.$finish$.asObservable();

  constructor(updateInterval: number) {
    this.$updateInterval = updateInterval;
  }

  start = this.$start$.next;

  update(event: ProgressUpdateEvent): void {
    if (event.completed % this.$updateInterval === 0) {
      this.$update$.next(event);
    }
  }

  found = this.$found$.next;

  finish = this.$finish$.next;

}