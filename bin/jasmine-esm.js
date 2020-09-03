#!/usr/bin/env node

import path from 'path';
import Command from '../node_modules/jasmine/lib/command.js';
import JasmineEsm from '../jasmine-esm.js';

(async () => {
const jasmineEsm = new JasmineEsm({ projectBaseDir: path.resolve() });
const examplesDir = path.join(path.dirname(await import.meta.resolve('jasmine-core')), 'jasmine-core', 'example', 'node_example');
const command = new Command(path.resolve(), examplesDir, console.log);

command.run(jasmineEsm, process.argv.slice(2));
})();
