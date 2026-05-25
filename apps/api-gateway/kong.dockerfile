FROM kong:3.7.0-alpine

LABEL maintainer="NexaPay Team" \
      description="Kong API Gateway with decK for NexaPay FinTech SuperApp"

USER root

RUN apk update && \
    apk add --no-cache \
      curl \
      unzip \
      openssl \
      python3 \
      py3-pip && \
    pip3 install --no-cache-dir deck && \
    apk del py3-pip && \
    rm -rf /var/cache/apk/*

COPY kong.yml /etc/kong/kong.yml

ENV KONG_DATABASE=off \
    KONG_DECLARATIVE_CONFIG=/etc/kong/kong.yml \
    KONG_PROXY_ACCESS_LOG=/dev/stdout \
    KONG_ADMIN_ACCESS_LOG=/dev/stdout \
    KONG_PROXY_ERROR_LOG=/dev/stderr \
    KONG_ADMIN_ERROR_LOG=/dev/stderr \
    KONG_ADMIN_LISTEN=0.0.0.0:8001 \
    KONG_PROXY_LISTEN=0.0.0.0:8000

EXPOSE 8000 8001 8443 8444

HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
    CMD kong health

CMD ["kong", "docker-start"]
