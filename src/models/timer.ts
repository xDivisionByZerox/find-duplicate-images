export class Timer {

  private readonly $label: string;

  constructor(label: string) {
    this.$label = label;
  }

  async run<T>(func: () => T | Promise<T>): Promise<T> {
    console.time(this.$label);
    
    let res = func();
    if(res instanceof Promise) {
      res = await res;
    } 

    console.timeEnd(this.$label);

    return res;
  }

}