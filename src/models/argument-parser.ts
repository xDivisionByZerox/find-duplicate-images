import commandLineArgs, { OptionDefinition } from 'command-line-args';
import { Config } from './config';
import { IResultHandlerConstructor } from './result-handler';
import { Util } from './util';

interface ConfigOptionDefinition extends OptionDefinition {
  name: keyof Config;
}

export class ArgumentParser {

  private static defaultConfig: IResultHandlerConstructor = {
    htmlFileName: 'index.html',
    jsFileName: 'data.js',
    outputDir: Util.getPath(__dirname, 'duplicate-files'),
  };

  private static $ClaOptionDefinition: ConfigOptionDefinition[] = [
    {
      name: 'htmlFileName',
      alias: 'h',
      type: String,
      defaultValue: ArgumentParser.defaultConfig.htmlFileName,
    },
    {
      name: 'jsFileName',
      alias: 'j',
      type: String,
      defaultValue: ArgumentParser.defaultConfig.jsFileName,
    },
    {
      name: 'pathToCheck',
      alias: 'p',
      defaultOption: true,
      type: String,
    },
    {
      name: 'outputDir',
      alias: 'o',
      type: String,
      defaultValue: ArgumentParser.defaultConfig.outputDir,
    },
  ];

  static parseArguments() {
    const options = commandLineArgs(this.$ClaOptionDefinition);
    if (!Config.hasConfig(options)) {
      throw new Error('invalid or missing params');
    }

    return new Config(options);
  }

}
