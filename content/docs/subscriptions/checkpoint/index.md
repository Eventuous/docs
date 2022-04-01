---
title: "Checkpoints"
description: "What's a checkpoint and why you need to store it"
menu:
  docs:
    parent: "subscriptions"
weight: 520
---

When you subscribe to an event store, you need to decide what events you want to receive. A proper event store would allow you to subscribe to any event stream, or to a global stream (_All stream_), which contains all the events from the store, ordered by the time they were appended. Event-oriented brokers that support persistence as ordered event logs also support subscriptions, normally called _consumers_, as it's the publish-subscribe broker terminology.

The subscription decides at what stream position it wants to start receiving events. If you want to process all the historical events, you'd subscribe from the beginning of the stream. If you want to only receive real-time events, you need to subscribe from _now_.

## What's the checkpoint?

As the subscription receives and processes events, it moves further along the stream it subscribed to. Every event the subscription receives and processes has a position in the subscribed stream. This position can be used as a _checkpoint_ of the subscription. If the application that hosts the subscription eventually shuts down, you'd want the subscription to resubscribe from the position, which was processed last, plus one. That's how you achieve _exactly one_ event handling. Therefore, the subscription needs to take care about storing its checkpoint somewhere, so the last known position can be retrieved from the checkpoint store and used to resubscribe.

Some log-based brokers also use the term _offset_ to describe the checkpoint concept.

Subscriptions, which are managed by the server, **don't require** storing checkpoints on the client side. For example, EventStoreDB persistent subscriptions and Google PubSub subscriptions don't require a client-side checkpoint store. Some subscriptions, like RabbitMQ subscription, don't have this concept at all, as RabbitMQ doesn't keep consumed messages, neither ACKed nor NACKed.

## Checkpoint store

Eventuous provides an abstraction, which allows subscriptions to store checkpoints reliably. You can decide to store it in a file or in a database. You can also decide if you want to store a checkpoint after processing each event, or only flush it now and then. Periodical checkpoint flush decreases the pressure on the infrastructure behind the checkpoint store, but also requires you to make your subscription idempotent. It's usually hard or impossible for integration since you can rarely check if you published an event to a broker or not. However, it can work for read model projections.

{{% alert icon="😱" title="Keep the checkpoint safe" %}}
When the checkpoint is lost, the subscription will get all the events. It might be intentional when you are creating a brand new [read model]({{< ref "rm-concept" >}}), then it's okay. Otherwise, you get undesired consequences.
{{% /alert %}}

### Abstraction

The checkpoint store interface is simple, it only has two functions:

```csharp
interface ICheckpointStore {
    ValueTask<Checkpoint> GetLastCheckpoint(
        string checkpointId,
        CancellationToken cancellationToken
    );

    ValueTask<Checkpoint> StoreCheckpoint(
        Checkpoint checkpoint,
        CancellationToken cancellationToken
    );
}
```

The `Checkpoint` record is a simple record, which aims to represent a stream position in any kind of event store:

```csharp
record Checkpoint(string Id, ulong? Position);
```

### Available stores

If a supported projection type in an Eventuous package for projections (`Eventuous.Projections.*`) requires a checkpoint store, you can find its implementation in that package. For example, the `Eventuous.Projections.MongoDB` package has a checkpoint store implementation for MongoDB.

If you register subscriptions in the DI container, you also need to register the checkpoint store:

```csharp
builder.Services.AddSingleton<IMongoDatabase>(Mongo.ConfigureMongo());
builder.Services.AddCheckpointStore<MongoCheckpointStore>();
```

The MongoDB checkpoint store will create a collection called `checkpoint` where it will keep one document per subscription.

In addition to that, Eventuous has two implementations in the core subscriptions package:
- `MeasuredCheckpointStore`: creates a trace for all the IO operations, wraps an existing store
- `NoOpCheckpointStore`: does nothing, used in Eventuous tests

The measured store is used by default if Eventuous diagnostics aren't disabled, and you use the `AddCheckpointStore` container registration extension.

## Checkpoint commit handler

In addition to checkpoint store, Eventuous has a more advanced way to work with checkpoints. It doesn't load or store checkpoints by itself, for that purpose it uses the provided checkpoint store. However, the commit handler is able to receive a stream of unordered checkpoints, reorder them, detect possible gaps, and only store the checkpoint that is the latest before the gap.

For subscriptions that support delayed consume (see [Partitioning filter]({{< ref "pipes#partitioning-filter" >}})) and require a checkpoint store, you must use the commit handler. All such subscription types provided by Eventuous use the checkpoint commit handler.

Unless you create your own subscription with such requirements, you don't need to know the internals of the commit handler. However, you would benefit to know the consequences of delayed event processing with supported subscriptions.

When events get partitioned by the filter, several consumer instances process events in parallel. As a result, each partition will get checkpoints with gaps. When partitioned consumers process events, they run at different speed. Each event inside `DelayedConsumeContext` is explicitly acknowledged, and when it happens, the checkpoint gets to the commit handler queue. The commit handler then is able to accumulate checkpoints, detect gaps in the sequence, and only store the latest checkpoint in a gap-less sequence.

{{< imgproc commit-handler.png Resize "1100x366" >}}
Gap in the commit handler queue
{{< /imgproc >}}

{{% alert icon="👉" %}}
On the illustration above, the commit queue has a gap, and event **95** is still in-flight. As soon as the event **95** is processed, its position will get to the queue, the commit handler will detect a gap-less sequence, and commit the checkpoint **97**.
{{%/ alert %}}

As we talk about gaps, you might face a situation when the commit handler has a list of uncommitted checkpoints with gaps, and the application stops. When this happens, some events were already processed, whilst checkpoints for those events remain in-flight. When the application restarts, it loads the checkpoint that points to some position in the stream that is _earlier_ than positions of already processed events. Because of that, some events will be processed by event handlers _again_. Therefore, you need to make sure that your event handlers are _idempotent_, so when the same events are processed again, the result of the processing won't create any undesired side effects.
