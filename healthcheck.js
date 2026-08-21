#!/usr/bin/env node
import process from 'node:process';

const healthcheck = process.env.HEALTHCHECK !== 'false';
process.stdout.write(healthcheck ? 'Healthcheck enabled' : 'Healthcheck disabled');
if (!healthcheck) {
    process.exit(0);
}

const port = process.env.PORT || 8080;
const host = process.env.HOST || '0.0.0.0';

// The wildcard address means "every interface". It is fine to listen on, but
// it cannot be connected to, so probe loopback instead.
const target = host === '0.0.0.0' ? '127.0.0.1' : host;

const token = 'RmVXY49YwsRfuBBfiYcWOpq6Py57pfa2x';
const mjml = `<mjml><mj-body><mj-section><mj-column><mj-text>${token}</mj-text></mj-column></mj-section></mj-body></mjml>`;

fetch(`http://${target}:${port}`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mjml }),
})
    .then((response) => response.text())
    .then((response) => {
        if (response.includes(token)) {
            process.exit(0);
        }
        process.exit(1);
    })
    .catch((err) => {
        process.exit(1);
    });
