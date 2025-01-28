#!/usr/bin/env node
import process from 'node:process';
import os from 'node:os';

const healthcheck = process.env.HEALTHCHECK !== 'false';
process.stdout.write(healthcheck ? 'Healthcheck enabled' : 'Healthcheck disabled');
if (!healthcheck) {
    process.exit(0);
}

const hostname = os.hostname();
const port = process.env.PORT || 8080;

const token = 'RmVXY49YwsRfuBBfiYcWOpq6Py57pfa2x';
const mjml = `<mjml><mj-body><mj-section><mj-column><mj-text>${token}</mj-text></mj-column></mj-section></mj-body></mjml>`;

fetch(`http://${hostname}:${port}`, {
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
