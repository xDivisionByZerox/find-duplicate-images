import commandLineArgs, { OptionDefinition } from 'command-line-args';
import { DeleteConfig, FindConfig } from './config';
import { IResultHandlerConstructor } from './result-handler';
import { Util } from './util';

interface FindConfigOptionDefinition extends OptionDefinition {
  name: keyof FindConfig;
}

interface DeleteConfigOptionDefinition extends OptionDefinition {
  name: keyof DeleteConfig;
}

export class ArgumentParser {

  private static defaultConfig: IResultHandlerConstructor = {
    htmlFileName: 'index.html',
    jsFileName: 'data.js',
    outputDir: Util.getPath(__dirname, 'duplicate-files'),
  };

  private static findDefinition: FindConfigOptionDefinition[] = [
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

  private static deleteDefinition: DeleteConfigOptionDefinition[] = [
    {
      name: 'path',
      alias: 'p',
      defaultOption: true,
      type: String,
    }
  ];

  static parseFindArguments() {
    const options = commandLineArgs(this.findDefinition);
    if (!FindConfig.hasConfig(options)) {
      throw new Error('invalid or missing params');
    }

    return new FindConfig(options);
  }

  static parseDeleteArguments() {
    const options = commandLineArgs(this.deleteDefinition);
    if (!DeleteConfig.hasConfig(options)) {
      throw new Error('invalid or missing params');
    }

    return new DeleteConfig(options);
  }

}
