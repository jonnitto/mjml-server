# MJML docker microservice / server

Standalone mjml server, listening on port 8080/tcp.

Due to various challenges this image supports the following features:

- Clean and fast shutdowns on docker.
- Simple CORS capabilities.
- Small footprint (at least in a npm way).
- Supports healthchecks.
- Supports change of mjml config in the request

## Overview

This image spools up a simple mjml server instance, listening to port 8080/tcp per default.

Due to GDPR / DSGVO reasons I required the mjml instance to be under my own control, as the processing personal information is processed in mail content generation.

Starting the image is as easy as running a test instance through docker

```sh
docker run -it --rm jonnitto/mjml-server
```

or `docker-compose` with the following example:

```yml
services:
  mjml:
    image: jonnitto/mjml-server
    # environment:
    # to change the port:
    #   - PORT=8081
    # for development, uncomment the following lines:
    #   - CORS=*
    #   - MJML_KEEP_COMMENTS=true
    #   - MJML_VALIDATION_LEVEL=strict
    #   - MJML_MINIFY=false
    #   - MJML_BEAUTIFY=true
```

## Defaults

The production defaults, without any override, default to:

```sh
CORS ""
MJML_CONFIG_CONIG "false"
MJML_KEEP_COMMENTS "false"
MJML_VALIDATION_LEVEL "soft"
MJML_MINIFY "true"
MJML_BEAUTIFY "false"
HEALTHCHECK "true"
CHARSET "utf8"
DEFAULT_RESPONSE_CONTENT_TYPE "text/html; charset=utf-8"
```

## Development

For development environments I would suggest to switch it to

```sh
CORS "*"
MJML_KEEP_COMMENTS "true"
MJML_VALIDATION_LEVEL "strict"
MJML_MINIFY "false"
MJML_BEAUTIFY "true"
HEALTHCHECK "false"
```

This will escalate any issues you have with invalid mjml code to the docker log (`stdout` or `docker-compose logs`).

## Install community components

If you want to add community components you can define `MJML_CONFIG_CONIG` as `JSON`. If you want, for example add the
`mj-chartjs` component, you can define the variable like this:

```sh
MJML_CONFIG_CONIG "{\"packages\":[\"mjml-chartjs/lib/MjChartjs.js\"]}"
```

## API

An api call should look like this:

```js
  const mjml = '<mjml><mj-body><mj-section><mj-column><mj-text>Hello World</mj-text></mj-column></mj-section></mj-body></mjml>';
  const endpoint = 'http://YOUR_ENDPOINT';
  const port = '8080'
  // Override configuration from enviroment or https://github.com/mjmlio/mjml/blob/master/packages/mjml-core/src/index.js#L101-L124
  const config = {
    beautify: false,
    minify: true,
    validationLevel: 'strict',
    fonts: {},
  }

  fetch(`${endpoint}:${host}`, {
      method: 'POST',
      headers: {
            'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({ mjml, config })
})
```

or with PHP and Guzzle

```php
use GuzzleHttp\Pool;
use GuzzleHttp\Client;
use GuzzleHttp\Psr7\Request;

$client = new Client();

$request = new Request(
  "POST",
  "http://YOUR_ENDPOINT:8080/",
  [
      "Content-Type" => "application/json; charset=utf-8"
  ],
  "{\"mjml\":\"<mjml><mj-body><mj-section><mj-column><mj-text>Hello World</mj-text></mj-column></mj-section></mj-body></mjml>\",\"config\":{\"fonts\":{},\"validationLevel\":\"strict\",\"keepComments\":false,\"beautify\":false,\"minify\":false}}");

$response = $client->send($request);
```

But you can use any language you want to create the request
