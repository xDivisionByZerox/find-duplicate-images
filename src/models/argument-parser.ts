import { Config } from '../default-config';
import { Util } from './util';

interface IKeyValueResult {
  key: keyof Config;
  value: string;
}

type HandlerResult = IKeyValueResult | undefined;

class ArgumentParser {

  private readonly $config: Partial<Config> = {
    htmlFileName: undefined,
    jsFileName: undefined,
    outputDir: undefined,
    pathToCheck: undefined,
  };

  parseFromProcess() {
    const args = process.argv.splice(2);
    let nextArg = args.shift();
    while (nextArg) {
      const currentArg = nextArg;
      nextArg = args.shift();

      const resultDoubleDash = this.checkForDoubleDashArg(currentArg, nextArg);
      if (resultDoubleDash !== undefined) {
        this.applyKeyValueToMap(resultDoubleDash);
        continue;
      }

      const resultKeyValueString = this.checkForKeyValueStringPair(currentArg);
      if (resultKeyValueString !== undefined) {
        this.applyKeyValueToMap(resultKeyValueString);
        continue;
      }
    }

    return this.$config;
  }

  private checkForKeyValueStringPair(arg: string): HandlerResult {
    const [key, value] = arg.split('=');
    if (
      key !== undefined
      && value !== undefined
      && Util.isKeyof(this.$config)(key)
    ) {
      const result = { key, value };
      console.log("currentArg is with keyValuePair", result);

      return result;
    }

    return undefined;
  }

  private checkForDoubleDashArg(arg: string, nextArg?: string): HandlerResult {
    if (arg.startsWith('--')) {
      const argShaved = arg.substr(2);

      const keyValueResult = this.checkForKeyValueStringPair(argShaved);
      if (keyValueResult) {
        return keyValueResult;
      }

      if (Util.isKeyof(this.$config)(argShaved)) {
        if (nextArg !== undefined) {
          return {
            key: argShaved,
            value: nextArg,
          }
        }
      }
    }

    return undefined;
  }

  private applyKeyValueToMap(params: IKeyValueResult) {
    this.$config[params.key] = params.value;
  }
}

export const configFromCli = new ArgumentParser().parseFromProcess();
console.log(configFromCli);