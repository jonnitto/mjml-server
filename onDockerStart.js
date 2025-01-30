#!/usr/bin/env node

import process from 'node:process';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

writeConfigAndInstallPackages();

function writeConfigAndInstallPackages() {
    const config = getJson(process.env.MJML_CONFIG_CONIG);

    if (!config) {
        process.exit(0);
    }

    console.log('🚀 Starting MJML config setup');
    const formatted = JSON.stringify(config, null, 4);
    const packages = (config?.packages || []).map(item => item.split('/')[0]);
    installPackages(packages);

    fs.writeFileSync(path.join(process.cwd(), '.mjmlconfig'), formatted, (error) => {
        if (error) {
            console.error('❌ Error writing mjml config file', error);
            process.exit(1);
        }
        console.log('✅ Successfully wrote mjml config file');
    });
}

function installPackages(packages) {
    if (!packages || !packages.length) {
        return;
    }
    const installCommand = `npm install ${packages.join(' ')}`;
    console.log(`📦 Installing packages: ${packages.join(', ')}`);
    console.log(`🔍 Running command: ${installCommand}`);
    execSync(installCommand, { stdio: 'inherit' });
}

function getJson(str) {
    if (!str) {
        return false;
    }
    let result = {};
    try {
        result = JSON.parse(str);
    } catch (e) {
        return false;
    }
    if (Object.keys(result).length) {
        return result;
    }
    return false;
}
