import path from 'path';
import util from 'util';
import fg from 'fast-glob';
import jasminecore from 'jasmine-core';
import CompletionReporter from './node_modules/jasmine/lib/reporters/completion_reporter.js';
import ConsoleSpecFilter from './node_modules/jasmine/lib/filters/console_spec_filter.js';
import ConsoleReporter from './node_modules/jasmine/lib/reporters/console_reporter.js';


export default class JasmineEsm {

  constructor(options) {
    options = options || {};
    const jasmineCore = options.jasmineCore || jasminecore;
    this.jasmineCorePath = path.join(jasmineCore.files.path, 'jasmine.js');
    this.jasmine = jasmineCore.boot(jasmineCore);
    this.projectBaseDir = options.projectBaseDir || path.resolve();
    this.specDir = '';
    this.specFiles = [];
    this.helperFiles = [];
    this.requires = [];
    this.env = this.jasmine.getEnv({suppressLoadErrors: true});
    this.reportersCount = 0;
    this.completionReporter = new CompletionReporter();
    this.onCompleteCallbackAdded = false;
    this.exit = process.exit;
    this.showingColors = true;
    this.reporter = new ConsoleReporter();
    this.addReporter(this.reporter);
    this.defaultReporterConfigured = false;
    this.completionReporter.onComplete((passed) => {
      this.exitCodeCompletion(passed);
    });
  }

  coreVersion() {
    return jasmineCore.version();
  };

  randomizeTests(value) {
    this.env.configure({random: value});
  };

  seed(value) {
    this.env.configure({seed: value});
  };

  showColors(value) {
    this.showingColors = value;
  };

  addSpecFile(filePath) {
    this.specFiles.push(filePath);
  };

  addReporter(reporter) {
    this.env.addReporter(reporter);
    this.reportersCount++;
  };

  clearReporters() {
    this.env.clearReporters();
    this.reportersCount = 0;
  };

  provideFallbackReporter(reporter) {
    this.env.provideFallbackReporter(reporter);
  };

  configureDefaultReporter(options) {
    options.timer = options.timer || new this.jasmine.Timer();
    options.print = options.print || function() {
      process.stdout.write(util.format.apply(this, arguments));
    };
    options.showColors = options.hasOwnProperty('showColors') ? options.showColors : true;
    options.jasmineCorePath = options.jasmineCorePath || this.jasmineCorePath;

    this.reporter.setOptions(options);
    this.defaultReporterConfigured = true;
  };

  addMatchers(matchers) {
    this.env.addMatchers(matchers);
  };

  async loadSpecs() {
    return await Jasmine.promiseAllCollectionImport(this.specFiles);
  };

  async loadHelpers() {
    //delete require.cache[require.resolve(file)]
    return await Jasmine.promiseAllCollectionImport(this.helperFiles);
  };

  async loadRequires() {
    //delete require.cache[require.resolve(r)];
    return await Jasmine.promiseAllCollectionImport(this.requires);
  };

  async loadConfigFile(configFilePath) {
    try {
      const absoluteConfigFilePath = path.resolve(this.projectBaseDir, configFilePath || './spec/support/jasmine.json');
      console.log(absoluteConfigFilePath)
      const config = await import(absoluteConfigFilePath);
      this.loadConfig(config.default);
    } catch (error) {
      if (configFilePath || error.code != 'MODULE_NOT_FOUND') {
        throw error;
      }
    }
  };

  loadConfig(config) {
    this.specDir = config.spec_dir || this.specDir;

    const configuration = {};

    if (config.failSpecWithNoExpectations !== undefined) {
      configuration.failSpecWithNoExpectations = config.failSpecWithNoExpectations;
    }

    if (config.stopSpecOnExpectationFailure !== undefined) {
      configuration.oneFailurePerSpec = config.stopSpecOnExpectationFailure;
    }

    if (config.stopOnSpecFailure !== undefined) {
      configuration.failFast = config.stopOnSpecFailure;
    }

    if (config.random !== undefined) {
      configuration.random = config.random;
    }

    if (Object.keys(configuration).length > 0) {
      this.env.configure(configuration);
    }

    if(config.helpers) {
      this.addHelperFiles(config.helpers);
    }

    if(config.requires) {
      this.addRequires(config.requires);
    }

    if(config.spec_files) {
      this.addSpecFiles(config.spec_files);
    }
  };

  addRequires(requires) {
    requires.forEach((r) => {
      this.requires.push(r);
    });
  };

  addHelperFiles(filePaths) {
    const files = this.addFiles(filePaths);

    fg.sync(this.helperFiles.concat(files), { 'unique': true })
      .forEach((file) => {
        // glob will always output '/' as a segment separator but the fileArr may use \ on windows
        // fileArr needs to be checked for both versions
        if (this.helperFiles.indexOf(file) === -1 && this.helperFiles.indexOf(path.normalize(file)) === -1) {
          this.helperFiles.push(file);
        }
      });
  }

  addSpecFiles(filePaths) {
    const files = this.addFiles(filePaths);
    fg.sync(this.specFiles.concat(files), { 'unique': true })
      .forEach((file) => {
        // glob will always output '/' as a segment separator but the fileArr may use \ on windows
        // fileArr needs to be checked for both versions
        if (this.specFiles.indexOf(file) === -1 && this.specFiles.indexOf(path.normalize(file)) === -1 && !file.includes('node_modules')) {
          this.specFiles.push(file);
        }
      });
  }

  addFiles(files) {
    return files.map((file) => {
      const hasNegation = file[0] === "!";
      if (hasNegation) {
        file = file.substring(1);
      }

      /*if (!path.isAbsolute(file)) {
        file = path.join(this.projectBaseDir, this.specDir, file);
      }*/

      if (hasNegation) {
        file = '!' + file;
      }

      return file;
    });
  }

  async execute(files, filterString) {
    await this.loadConfigFile();
    this.completionReporter.exitHandler = this.checkExit;
    await this.loadRequires();
    await this.loadHelpers();

    if (!this.defaultReporterConfigured) {
      this.configureDefaultReporter({ showColors: this.showingColors });
    }

    if (filterString) {
      const specFilter = new ConsoleSpecFilter({
        filterString: filterString
      });

      this.env.configure({
        specFilter: (spec) => {
          return specFilter.matches(spec.getFullName());
        }
      });
    }

    if (files && files.length > 0) {
      this.specDir = '';
      this.specFiles = [];
      this.addSpecFiles(files);
    }

    await this.loadSpecs();

    this.addReporter(this.completionReporter);
    this.env.execute();
  };

  onComplete(onCompleteCallback) {
    this.completionReporter.onComplete(onCompleteCallback);
  };

  stopSpecOnExpectationFailure(value) {
    this.env.configure({oneFailurePerSpec: value});
  };

  stopOnSpecFailure(value) {
    this.env.configure({failFast: value});
  };

  exitCodeCompletion(passed) {
    const streams = [process.stdout, process.stderr];
    const writesToWait = streams.length;

    streams.forEach((stream) => {
      stream.write('', null, exitIfAllStreamsCompleted);
    });
    this.exitIfAllStreamsCompleted();
  };

  exitIfAllStreamsCompleted() {
    writesToWait--;
    if (writesToWait === 0) {
      if(passed) {
        this.exit(0);
      } else {
        this.exit(1);
      }
    }
  }

  checkExit() {
    if (!this.completionReporter.isComplete()) {
      process.exitCode = 4;
    }
  };

  static async promiseAllCollectionImport(collection) {
    const collectionLength = collection.length;
    const promises = [];

    for (let x = 0; x < collectionLength; x++) {
      promises.push(
        import('./'+collection[x])
      );
    }

    return Promise.all(promises);
  }

}
