import { program } from 'commander';
import packageJson from '../package.json';
import path from 'node:path';
import fg from 'fast-glob';
import sharp, { OutputInfo, FormatEnum, AvailableFormatInfo } from 'sharp';
import fs from 'node:fs';

/**
 * Set global CLI configurations
 */
program.storeOptionsAsProperties(false);

program.version(packageJson.version, '-v, --version');

program
  .command('convert')
  .description('convert image file')
  .option('-i, --input <path>', 'input filepath')
  .option('-f, --format <format>', 'convert to image format')
  .argument('<output>', 'output file path')
  .action(async (output, options) => {
    const inputFilePath = options.input;
    if (!inputFilePath || !fs.existsSync(inputFilePath)) {
      throw new Error('input file not found');
    }
    const outputFilePath = path.resolve(output);
    const convertImageFormat = (options.format || path.extname(outputFilePath).substring(1).toLocaleLowerCase()) as
      | keyof FormatEnum
      | AvailableFormatInfo;
    await convertImage(inputFilePath.toString(), outputFilePath, convertImageFormat);
  });

async function convertImage(
  imageFilePath: string,
  outputFilePath: string,
  convertImageFormat: keyof FormatEnum | AvailableFormatInfo,
): Promise<OutputInfo | null> {
  return sharp(imageFilePath).toFormat(convertImageFormat).toFile(outputFilePath);
}

program
  .command('bulk-convert')
  .description('search and convert image files')
  .option('-i, --input <path>', 'input directory path')
  .option('--if, --input-format <format>', 'filter input file format')
  .option('-f, --format <format>', 'convert to image format')
  .argument('<output>', 'output directory path')
  .action(async (output, options) => {
    const imageFilePathes: string[] = [];
    const inputDirectoryPath = options.input;
    if (!inputDirectoryPath || !fs.existsSync(inputDirectoryPath)) {
      throw new Error('input directory not found');
    }
    const inputFormat = options.inputFormat;
    if (!inputFormat) {
      throw new Error('input image format is none');
    }
    const outputDirectoryPath = path.resolve(output);
    const outputStat = fs.lstatSync(outputDirectoryPath);
    if (!outputStat.isDirectory()) {
      throw new Error('output path is not directory');
    }

    const filePathes = fg.sync(
      [...inputDirectoryPath.toString().split(path.sep), '**', `*.${inputFormat.toString().toLowerCase()}`].join('/'),
      { dot: true },
    );
    for (const filePath of filePathes) {
      imageFilePathes.push(filePath);
    }
    const convertImageFormat = options.format.toString().toLowerCase();
    for (const imageFilePath of imageFilePathes) {
      const imageFileName = path.basename(imageFilePath.toString().split(path.sep).join('/'));
      const outputImagePath = imageFileName.replace(path.extname(imageFileName), `.${convertImageFormat}`);
      await convertImage(imageFilePath, outputImagePath, convertImageFormat);
    }
  });

program.parse(process.argv);
