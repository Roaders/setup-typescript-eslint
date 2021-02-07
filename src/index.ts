#!/usr/bin/env node

import { blue, green, red } from 'chalk';
import { join } from 'path';
import { readFileSync, writeFileSync, copyFileSync } from 'fs';
import { PackageJson } from './types';
import { cursorTo, clearLine } from 'readline';
import { exec } from 'child_process';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const detect = require('detect-json-indent');

const configSourceFileName = 'eslint-config.js';
const configTargetFileName = '.eslintrc.js';

function configureEsLint() {
    console.log(blue(`Configuring ESLint...`));

    const { packageJson, packageJsonPath, indent } = loadPackageJson();

    copyConfig();
    updatePackageJson(packageJson, packageJsonPath, indent);
    installDependencies();
}

function installDependencies() {
    const progressMessage = `Installing dev dependencies`;
    let dots = 0;
    process.stdout.write(progressMessage);

    const dependencies = [
        'eslint',
        'eslint-config-prettier',
        'eslint-config-standard',
        'eslint-plugin-import',
        'eslint-plugin-node',
        'eslint-plugin-prettier',
        'eslint-plugin-promise',
        '@typescript-eslint/eslint-plugin',
        '@typescript-eslint/parser',
        'prettier',
    ];

    const installCommand = `npm install -D ${dependencies.join(' ')}`;

    const timer = setInterval(() => {
        switch (dots) {
            case 3:
                dots = 0;
                cursorTo(process.stdout, progressMessage.length);
                clearLine(process.stdout, 1);
                break;
            default:
                dots++;
                process.stdout.write('.');
        }
    }, 250);

    exec(installCommand, (error) => {
        clearInterval(timer);
        if (error) {
            console.log(`Error installing dependencies: `, error);
        }

        cursorTo(process.stdout, 0);
        console.log(`${progressMessage}... ${green('\u2713')}`);

        console.log(` `);
        console.log(green(`Installation complete.`));
        console.log(`To lint your project run 'npm run lint'`);
        console.log(
            `To attempt to auto fix any issues run 'npx eslint . --ext .ts,.js'`
        );
    });
}

function updatePackageJson(
    packageJson: PackageJson,
    packageJsonPath: string,
    indent: string
) {
    const progressMessage = `Adding 'lint' script to 'package.json'...`;
    process.stdout.write(progressMessage);

    packageJson.scripts = packageJson.scripts || {};
    packageJson.scripts.lint = 'eslint . --ext .ts,.js';

    writeFileSync(
        packageJsonPath,
        JSON.stringify(packageJson, undefined, indent)
    );

    cursorTo(process.stdout, 0);
    console.log(`${progressMessage} ${green('\u2713')}`);
}

function copyConfig() {
    const configSrcPath = join(
        __dirname,
        '../',
        'config',
        configSourceFileName
    );
    const configTargetPath = join(process.cwd(), configTargetFileName);

    const progressMessage = `Copying config to '${configTargetFileName}'...`;
    process.stdout.write(progressMessage);

    copyFileSync(configSrcPath, configTargetPath);

    cursorTo(process.stdout, 0);
    console.log(`${progressMessage} ${green('\u2713')}`);
}

function loadPackageJson() {
    const packageJsonPath = join(process.cwd(), 'package.json');

    const progressMessage = `Loading 'package.json'...`;
    process.stdout.write(progressMessage);

    let packageJson: PackageJson;
    let indent = '';

    try {
        const stringified = readFileSync(packageJsonPath).toString();
        indent = detect(stringified);
        packageJson = JSON.parse(stringified);
    } catch (e) {
        console.log(
            `${red(
                `Error:`
            )} could not load package.json from '${packageJsonPath}'.`
        );
        console.log(
            `Please ensure you run command from a folder that contains a package.json.`
        );
        process.exit(1);
    }

    cursorTo(process.stdout, 0);
    console.log(`${progressMessage} ${green('\u2713')}`);

    return { packageJsonPath, packageJson, indent };
}

configureEsLint();
