import { program } from 'commander';
import packageJson from '../package.json';
import path from 'node:path';
import fg from 'fast-glob';

/**
 * Set global CLI configurations
 */
program.storeOptionsAsProperties(false);

program.version(packageJson.version, '-v, --version');

program
  .command('convert')
  .description('Split a string into substrings and display as an array')
  .option('-p, --root-path <path>', 'display just the first substring', './')
  .option('-f, --from-extension <fromExt>', 'separator character', 'jpg')
  .option('-t, --to-extension <toExt>', 'separator character', 'png')
  .action((options) => {
    console.log(options);
    const imageFilePathes = fg.sync([...options.rootPath.split(path.sep), '**', `*.${options.fromExtension}`].join('/'), { dot: true });
    console.log(imageFilePathes);
  });

program.parse(process.argv);
