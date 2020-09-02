import Jasmine from './jasmine-es6.js';

main();

async function main() {
  const iJasmine = new Jasmine();
  await iJasmine.loadConfigFile();
  await iJasmine.execute();
}

