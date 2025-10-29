FROM openjdk:17-jdk-slim


WORKDIR /app

RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*
COPY . .

RUN pip3 install -r curriculum-graph-processor/src/main/scripts/requirements.txt

RUN chmod +x curriculum-graph-processor/gradlew

EXPOSE 8080

WORKDIR /app/curriculum-graph-processor

CMD ["./gradlew", "run"]