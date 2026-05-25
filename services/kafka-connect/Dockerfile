FROM confluentinc/cp-kafka-connect:7.6.0

LABEL maintainer="NexaPay Team" \
      description="Kafka Connect with Debezium PostgreSQL connector for NexaPay CDC"

USER root

ENV KAFKA_CONNECT_PLUGIN_DIR=/usr/share/java

RUN confluent-hub install --no-prompt debezium/debezium-connector-postgresql:2.5.2 && \
    confluent-hub install --no-prompt confluentinc/kafka-connect-elasticsearch:14.0.0 && \
    confluent-hub install --no-prompt confluentinc/kafka-connect-jdbc:10.7.5 && \
    confluent-hub install --no-prompt confluentinc/kafka-connect-s3:10.5.13 && \
    rm -rf /tmp/*

RUN mkdir -p /etc/kafka-connect

COPY connect-config.json /etc/kafka-connect/connect-config.json

RUN chown -R appuser:appuser /etc/kafka-connect

USER appuser

EXPOSE 8083

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:8083/connectors || exit 1

CMD ["bash", "-c", "\
    echo \"Starting Kafka Connect worker...\" && \
    /etc/confluent/docker/run & \
    echo \"Waiting for Kafka Connect to be ready...\" && \
    while [ \"$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8083/connectors)\" != \"200\" ]; do \
      sleep 5; \
    done && \
    echo \"Registering Debezium PostgreSQL connector...\" && \
    curl -X POST -H \"Content-Type: application/json\" \
      --data @/etc/kafka-connect/connect-config.json \
      http://localhost:8083/connectors && \
    echo \"Connector registered successfully\" && \
    wait \
"]
