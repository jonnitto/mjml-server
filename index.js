#!/usr/bin/env node

import { createServer } from 'node:http';
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
    res.end('Content-Type must be set to application/json')
    return;
  }

  // enable cors
  if (process.env.CORS) {
    res.header('Access-Control-Allow-Origin', process.env.CORS)
    res.header('Access-Control-Allow-Headers', '*')
    res.header('Access-Control-Allow-Methods', 'POST')
    res.header('Access-Control-Max-Age', '-1')
  }

  const bodyStream = [];

  req
    .on('data', (chunk) => {
      bodyStream.push(chunk);
    })
    .on('end', async () => {
      const bufferData = Buffer.concat(bodyStream);

      try {
        const data = JSON.parse(bufferData);

        if (data.mjml === undefined) {
          res.statusCode = 500;
          res.end('You must provide a mjml key with the mjml content')
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

        const html = await parseMjml({body, config, beautify, minify, minifyOptions});
        res.end(html);
      } catch (ex) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'text/plain');
        console.log('');
        console.log('Received body');
        console.log(bufferData.toString());
        console.log('');
        console.error(ex);
        console.log('');
        res.end('Someting went wrong, check the log for details');
      }
    });
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

async function parseMjml({body, config, beautify, minify, minifyOptions}) {
  let { html } = mjml2html(body || '', config)
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

  return html;
}
