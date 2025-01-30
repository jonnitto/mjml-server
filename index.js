#!/usr/bin/env node

import { createServer } from 'node:http';
import process from 'node:process';
import os from 'node:os';
import mjml2html from 'mjml';
import prettier from 'prettier';
import { crush } from 'html-crush';

const hostname = os.hostname();
const port = process.env.PORT || 8080;

const opts = {
  keepComments: process.env.MJML_KEEP_COMMENTS === 'true',
  validationLevel: ['soft', 'strict', 'skip']
    .includes(process.env.MJML_VALIDATION_LEVEL)
    ? process.env.MJML_VALIDATION_LEVEL
    : 'soft',
  healthchecks: process.env.HEALTHCHECK === 'true'
}

const doBeautify = process.env.MJML_BEAUTIFY === 'true'
const doMinifiy = process.env.MJML_MINIFY === 'true'

const charsetOpts = {
  write: process.env.CHARSET || 'utf8',
  contentType: process.env.DEFAULT_RESPONSE_CONTENT_TYPE || 'text/html; charset=utf-8'
}

const server = createServer((req, res) => {
  res.setHeader('Content-Type', charsetOpts.contentType);

  // ensure content type is set
  if (!req.headers['content-type'] || !req.headers['content-type'].includes('application/json')) {
    res.statusCode = 500;
    res.end('❌ Content-Type must be set to application/json')
    return;
  }

  // enable cors
  if (process.env.CORS) {
    res.setHeader('Access-Control-Allow-Origin', process.env.CORS)
    res.setHeader('Access-Control-Allow-Headers', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST')
    res.setHeader('Access-Control-Max-Age', '-1')
  }

  const bodyStream = [];

  req
    .on('data', (chunk) => {
      bodyStream.push(chunk);
    })
    .on('end', async () => {
      const bufferData = Buffer.concat(bodyStream);
      let errorMessage = '';

      try {
        const data = JSON.parse(bufferData);

        if (data.mjml === undefined) {
          res.statusCode = 500;
          res.end('❌ You must provide a mjml key with the mjml content')
          return;
        }

        const body = data.mjml;
        const config = {...opts, ...data.config || {}};

        let minify = doMinifiy;
        if (typeof config.minify === 'boolean') {
          minify = config.minify;
          delete config.minify;
        }

        let minifyOptions = {};
        if (typeof config.minifyOptions !== 'undefined') {
          minifyOptions = config.minifyOptions;
          delete config.minifyOptions;
        }

        let beautify = doBeautify;
        if (typeof config.beautify === 'boolean') {
          beautify = config.beautify;
          delete config.beautify;
        }

        const { html, strict, errors } = await parseMjml({body, config, beautify, minify, minifyOptions});
        errorMessage = generateErrorMessage(errors);
        if (strict && errorMessage) {
          throw new Error('Validation failed');
        }
        if (errorMessage) {
          generateLogMessage(bufferData, errorMessage, '❗️ Validation warning');
        }
        res.end(html);
      } catch (ex) {
        res.statusCode = 400;
        const message = generateLogMessage(bufferData, errorMessage, `❌ ${ex.toString()}`);
        res.setHeader('Content-Type', 'text/plain');
        res.end(`${message}Check the log for more details`);
      }
    });
});

server.listen(port, hostname, () => {
  console.log(`✅ Server running at http://${hostname}:${port}/`);
});

let callAmount = 0;
process.on('SIGINT', stopServer);  // CTRL+C
process.on('SIGQUIT', stopServer); // Keyboard quit
process.on('SIGTERM', stopServer); // `kill` command

function generateLogMessage(bufferData, message, title) {
  let logMessage = '';

  console.log('');
  [title, message].filter(Boolean).forEach((text) => {
    const output = `${text}\n\n`;
    logMessage += output;
    console.log(output);
  });
  console.log('Received body');
  console.log(bufferData.toString());
  console.log('');

  return logMessage;
}

function generateErrorMessage(errors) {
  if (!errors || !errors.length) {
    return '';
  }

  return errors.map((error) => `Line ${error.line} in tag ${error.tagName}: ${error.message}`).join('\n');
}

function stopServer() {
  if(callAmount < 1) {
    console.log('');
    console.log('🛑 The server has been stopped');
    console.log('');
    setTimeout(() => process.exit(0), 1000);
  }
  callAmount++;
}

async function parseMjml({body, config, beautify, minify, minifyOptions}) {
  let strict = false;
  if (config.validationLevel == 'strict') {
    strict = true;
    config.validationLevel = 'soft';
  }
  let { html, errors } = mjml2html(body || '', config);
  if (!errors.length) {
    errors = false;
  }

  if (beautify) {
    html = await prettier.format(html, {
      parser: 'html',
      printWidth: 240,
      singleQuote: true,
    });
  }

  if (minify) {
    html = crush(html, minifyOptions).result
  }

  return { html, errors, strict };
}
