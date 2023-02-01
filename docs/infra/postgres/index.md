---
title: "PostgreSQL"
description: "Supported PostgreSQL infrastructure"
sidebar_position: 3
---

PostgreSQL is a powerful, open source object-relational database system with over 30 years of active development that has earned it a strong reputation for reliability, feature robustness, and performance. [source](https://www.postgresql.org/).

Eventuous supports Postgres as an event store, and also allows subscribing to the global event log and to individual streams using catch-up subscriptions.

## Data model

Eventuous uses a single table to store events. The table name is `messages`. In addition, another table called `streams` is used to control the stream existence, and store the last event number for each stream. In the `messages` table, events and metadata are stored as JSONB columns. The table schema is as follows:

```sql
message_id      uuid,
message_type    varchar not null,
stream_id       integer not null,
stream_position integer not null,
global_position bigint primary key generated always as identity, 
json_data       jsonb not null,
json_metadata   jsonb,
created         timestamp not null,
```

In theory, it allows you to execute queries across events using the JSONB query syntax of Postgres SQL dialect.

For subscriptions, Eventuous adds a table called `checkpoints` that stores the last processed event number for each subscription. It is then used by the checkpoint store implementation for Postgres.

## Event persistence

Usually, you just need to register the aggregate store that uses the Postgres event store. For that to work, you'd also need to register a Postgres connection factory, which is used to create connections to the database.

```csharp
// Local connection factory function
NpgsqlConnection GetConnection() => new(connectionString);

builder.Services.AddSingleton((GetPostgresConnection)GetConnection);
builder.Services.AddAggregateStore<PostgresStore>();
```

When that's done, Eventuous would persist aggregates in Postgres when you use the [application service](../../application/app-service).

At this moment, the Postgres event store implementation doesn't support stream truncation.

## Subscriptions

Eventuous supports two types of subscriptions to Postgres: global and stream. The global subscription is a catch-up subscription, which means that it reads all events from the beginning of the event log. The stream subscription is also a catch-up subscription, but it only reads events from a specific stream.

Both subscription types use continuous polling to check for new events. We don't use the notifications feature of Postgres database.

### Registering subscriptions

Registering a global log subscription is similar to [EventStoreDB](../esdb/index.md#all-stream-subscription). The only difference is the subscription and the options types:

```csharp
builder.Services.AddSubscription<PostgresAllStreamSubscription, PostgresAllStreamSubscriptionOptions>(
    "BookingsProjections",
    builder => builder
        .AddEventHandler<BookingStateProjection>()
        .AddEventHandler<MyBookingsProjection>();
);
```

When you register a subscription to a single stream, you need to configure the subscription options to specify the stream name:

```csharp
builder.Services.AddSubscription<PostgresStreamSubscription, PostgresStreamSubscriptionOptions>(
    "StreamSubscription",
    builder => builder
        .Configure(x => x.StreamName = "my-stream")
        .AddEventHandler<StreamSubscriptionHander>()
);
```

### Checkpoint store

Catch-up subscriptions need a [checkpoint](../../subscriptions/checkpoint). You can register the checkpoint store using `AddCheckpointStore<T>`, and it will be used for all subscriptions in the application.

Remember to store the checkpoint in the same database as the read model. For example, if you use Postgres as an event store, and project events to read models in MongoDB, you need to use the `MongoCheckpointStore`. Eventuous also has a checkpoint store implementation for Postgres (`PostgresCheckpointStore`), which you can use if you project events to Postgres.
