export class Logger {

  private readonly $label: string;

  constructor(
    label: string,
    private readonly $isActive = false,
  ) {
    this.$label = `[${label}]:`;
  }

  log(message: unknown, ...optionalParams: unknown[]) {
    if (this.$isActive) {
      console.log(this.$label, message, ...optionalParams);
    }
  }

}
