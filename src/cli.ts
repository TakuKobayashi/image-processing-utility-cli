import { program } from 'commander';
import packageJson from '../package.json';
import path from 'node:path';
import fg from 'fast-glob';
import sharp, { OutputInfo, FormatEnum, AvailableFormatInfo } from 'sharp';
import fs from 'node:fs';
import ExifReader, { Tags } from 'exifreader';
import cliProgress from 'cli-progress';

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

program
  .command('bulk-convert')
  .description('search and convert image files')
  .option('-i, --input <path>', 'input directory path')
  .option('--if, --input-format <format>', 'filter input file format')
  .option('-f, --format <format>', 'convert to image format')
  .argument('<output>', 'output directory path')
  .action(async (output, options) => {
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

    const imageFilePathes = loadImageFilePathes(inputDirectoryPath.toString(), inputFormat.toString());
    const convertImageFormat = options.format.toString().toLowerCase();
    const convertPromises: Promise<any>[] = [];
    const progressBar = new cliProgress.SingleBar(
      {
        format: '{bar} | {value}/{total} | {inputFileName} => {outputFileName}',
      },
      cliProgress.Presets.shades_classic,
    );
    progressBar.start(imageFilePathes.length, 0);
    for (const imageFilePath of imageFilePathes) {
      const imageFileName = path.basename(imageFilePath.toString().split(path.sep).join('/'));
      const outputImageName = imageFileName.replace(path.extname(imageFileName), `.${convertImageFormat}`);
      const outputImagePath = path.resolve(outputDirectoryPath, outputImageName);
      convertPromises.push(
        convertImage(imageFilePath, outputImagePath, convertImageFormat).then((result) => {
          progressBar.increment(1, {
            inputFileName: imageFilePath,
            outputFileName: outputImagePath,
          });
        }),
      );
    }
    await Promise.all(convertPromises);
    progressBar.stop();
  });

program
  .command('export-exif')
  .description('export exif from image file')
  .option('-i, --input <path>', 'input filepath')
  .option('-o, --output <path>', 'output json filepath')
  .action(async (options) => {
    const inputFilePath = options.input;
    if (!inputFilePath || !fs.existsSync(inputFilePath)) {
      throw new Error('input file not found');
    }
    await IOExifInfo(inputFilePath, options.output);
  });

program
  .command('bulk-export-exif')
  .description('search and convert image files')
  .option('-i, --input <path>', 'input directory path')
  .option('--if, --input-format <format>', 'filter input file format')
  .option('-o, --output <path>', 'output json directory filepath')
  .action(async (options) => {
    const inputDirectoryPath = options.input;
    if (!inputDirectoryPath || !fs.existsSync(inputDirectoryPath)) {
      throw new Error('input directory not found');
    }
    const inputFormat = options.inputFormat;
    if (!inputFormat) {
      throw new Error('input image format is none');
    }
    const output = options.output;
    const outputDirectoryPath = path.resolve(output);
    const outputStat = fs.lstatSync(outputDirectoryPath);
    if (!outputStat.isDirectory()) {
      throw new Error('output path is not directory');
    }
    const imageFilePathes = loadImageFilePathes(inputDirectoryPath.toString(), inputFormat.toString());
    const progressBar = new cliProgress.SingleBar(
      {
        format: '{bar} | {value}/{total} | {inputFileName} => {outputFileName}',
      },
      cliProgress.Presets.shades_classic,
    );
    progressBar.start(imageFilePathes.length, 0);
    const exifPromises: Promise<any>[] = [];
    for (const imageFilePath of imageFilePathes) {
      const imageFileName = path.basename(imageFilePath.toString().split(path.sep).join('/'));
      const outputImageName = imageFileName.replace(path.extname(imageFileName), `.json`);
      const outputImagePath = path.resolve(outputDirectoryPath, outputImageName);
      exifPromises.push(
        IOExifInfo(imageFilePath, outputImagePath).then((result) => {
          progressBar.increment(1, {
            inputFileName: imageFilePath,
            outputFileName: outputImagePath,
          });
        }),
      );
    }
    await Promise.all(exifPromises);
  });

async function IOExifInfo(inputFilePath: string, writeJsonFilePath: string | null = null): Promise<Tags> {
  const info = await ExifReader.load(inputFilePath);
  if (writeJsonFilePath) {
    const outputFilePath = path.resolve(writeJsonFilePath);
    fs.writeFileSync(outputFilePath, JSON.stringify(info));
  }
  return info;
}

function loadImageFilePathes(inputDirectoryPath: string, inputFormat: string): string[] {
  const imageFilePathes: string[] = [];
  const filePathes = fg.sync([...inputDirectoryPath.split(path.sep), '**', `*.${inputFormat.toLowerCase()}`].join('/'), { dot: true });
  for (const filePath of filePathes) {
    imageFilePathes.push(filePath);
  }
  return imageFilePathes;
}

async function convertImage(
  imageFilePath: string,
  outputFilePath: string,
  convertImageFormat: keyof FormatEnum | AvailableFormatInfo,
): Promise<OutputInfo | null> {
  return sharp(imageFilePath).keepExif().toFormat(convertImageFormat).toFile(outputFilePath);
}

program.parse(process.argv);
