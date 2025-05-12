import { program, Command } from 'commander';
import packageJson from '../package.json';

/**
 * Set global CLI configurations
 */
program.storeOptionsAsProperties(false);

program.version(packageJson.version, '-v, --version');

program
  .command('convert')
  .description('Split a string into substrings and display as an array')
  .option('-p, --root-path <path>', 'display just the first substring')
  .option('-f, --from-extension <fromExt>', 'separator character', 'jpg')
  .option('-t, --to-extension <toExt>', 'separator character', 'png')
  .action((options) => {
    console.log(options);
  });

program.parse(process.argv);
