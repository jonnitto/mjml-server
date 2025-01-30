FROM node:23-alpine

LABEL org.opencontainers.image.authors="Jon Uhlmann"
LABEL org.opencontainers.image.description="Standalone mjml server, listening on port 8080/tcp."

ENV NODE_ENV=production

ENV CORS=""
ENV PORT=8080

ENV MJML_KEEP_COMMENTS=false
ENV MJML_VALIDATION_LEVEL=soft
ENV MJML_MINIFY=true
ENV MJML_BEAUTIFY=false
ENV HEALTHCHECK=true
ENV CHARSET="utf8"
ENV DEFAULT_RESPONSE_CONTENT_TYPE="text/html; charset=utf-8"

WORKDIR /app

COPY package* ./

RUN set -ex \
    && apk --no-cache upgrade \
    && apk --no-cache add curl ca-certificates \
    && update-ca-certificates \
    && npm --env=production install

COPY index.js ./index.js
COPY healthcheck.js ./healthcheck.js
USER node

HEALTHCHECK --start-period=10s --retries=1 CMD node healthcheck.js || exit 1

EXPOSE 8080

ENTRYPOINT [ "node", "index.js" ]
