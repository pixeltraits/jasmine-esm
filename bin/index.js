#!/usr/bin/env node --experimental-json-modules

import path from 'path';
import Command from 'jasmine/lib/command.js';
import JasmineEsm from '../src/jasmine-esm.js';

(async () => {
  const jasmineEsm = new JasmineEsm({ projectBaseDir: path.resolve() });
  const examplesDir = path.join('jasmine-core', 'example', 'node_example');
  const command = new Command(path.resolve(), examplesDir, console.log);

  command.run(jasmineEsm, process.argv.slice(2));
})();
