---
title: "MongoDB"
description: "Project events from EventStoreDB to MongoDB"
sidebar_position: 1
---

The MongoDB target only support the `projector` mode for now.

You need to run a gRPC server accessible by the Connector to make the MongoDB target work.

## Projector sidecar

You can create a projector gRPC server using any language or stack. The server must support bidirectional streaming. Below, you can find MongoDB-specific response types:

```proto
syntax = "proto3";

package projection;

import "google/protobuf/struct.proto";

message InsertOne {
  google.protobuf.Struct document = 1;
}

message UpdateOne {
  google.protobuf.Struct filter = 1;
  google.protobuf.Struct update = 2;
}

message DeleteOne {
  google.protobuf.Struct filter = 1;
}
```

## Configuration

There are two sections to configure in the [Connector configuration](../../deployment/#configuration): `target` and `grpc`. The `target` section specified the MongoDB configuration, and the `grpc` section contains the sidecar URL.

For the MongoDB target, you need to configure the following parameters:

- `connectionString`: The connection string to the MongoDB instance.
- `database`: The name of the database to use.
- `collection`: The name of the collection to use.

You can only project to one collection in one database using a single Connector instance.

Here's the sample configuration for this connector:

```yaml
connector:
  connectorId: "esdb-mongo-connector"
  connectorAssembly: "Eventuous.Connector.EsdbMongo"
  diagnostics:
    tracing:
      enabled: true
      exporters: [zipkin]
    metrics:
      enabled: true
      exporters: [prometheus]
    traceSamplerProbability: 0
source:
  connectionString: "esdb://localhost:2113?tls=false"
  concurrencyLimit: 1
target:
  connectionString: "mongodb://mongoadmin:secret@localhost:27017"
  database: test
  collection: bookings
grpc:
  uri: "http://localhost:9091"
  credentials: "insecure"
```

## Samples

We have a few samples for this target:

- [NodeJS][1] implementation
- [PHP][2] implementation

[1]: https://github.com/Eventuous/connector-sidecar-nodejs-mongo
[2]: https://github.com/Eventuous/connector-sidecar-php-mongo
