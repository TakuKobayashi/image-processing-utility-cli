import { program } from 'commander';
import packageJson from '../package.json';
import path from 'node:path';
import fg from 'fast-glob';
import sharp from 'sharp';
import crypto from 'node:crypto';
import fs from 'node:fs';

/**
 * Set global CLI configurations
 */
program.storeOptionsAsProperties(false);

program.version(packageJson.version, '-v, --version');

program
  .command('convert')
  .description('search and convert image files')
  .option('-i, --input <path>', 'input filepath')
  .option('-id, --input-directory <path>', 'input directory path')
  .option('-if, --input-format <format>', 'filter input file format')
  .option('-o, --output <path>', 'output file path')
  .option('-od, --output-directory <path>', 'output root directory path')
  .option('-f, --format <format>', 'convert to image format')
  .action(async (output, options) => {
    const inputPath = options.input
    const imageFilePathes = [];
    const inputDirectoryPath = options.inputDirectory
    if (inputDirectoryPath) {

    }
    const pathes = fg.sync([...inputDirectoryPath.split(path.sep).join('/'), "**", ], { dot: true });
    if (!fs.existsSync(inputPath)) {
      return;
    }
    const inputStat = fs.lstatSync(inputPath);
    console.log(options);

    const convertImageFormat = options.format as (keyof sharp.FormatEnum | sharp.AvailableFormatInfo);
    for (const imageFilePath of imageFilePathes) {
      const converted = await sharp(imageFilePath).toFormat(convertImageFormat).toFile(output);
      console.log(converted);
    }
  });


program.parse(process.argv);
