---
title: "All stream subscription"
description: "Subscribe to all events in the store"
images: []
weight: 10
---

Subscribing to all events in the store is extremely valuable. This way, you can build comprehensive read models, which consolidate information from multiple aggregates. You can also use such a subscription for integration purposes, to convert and publish integration events.

{{% alert icon="📖" %}}
[Read more](https://zimarev.com/blog/event-sourcing/all-stream/) about benefits of using the global event stream.
{{%/ alert %}}

## All stream subscription

For registering a subscription to `$all` stream, use `AddSubscription<AllStreamSubscription, AllStreamSubscriptionOptions> as shown below:

```csharp
builder.Services.AddSubscription<AllStreamSubscription, AllStreamSubscriptionOptions>(
    "BookingsProjections",
    builder => builder
        .AddEventHandler<BookingStateProjection>()
        .AddEventHandler<MyBookingsProjection>()
);
```

Subscription options for `AllStreamSubscription` are defined in `AllStreamSubscriptionOptions` class.

* `SubscriptionId` - unique subscription identifier.
* `ThrowOnError` - if `true`, an exception will be thrown if the subscription fails, otherwise the subscription continues to run. Default is `false`.
* `EventSerilizer` - serializer for events, if `null` the default serializer will be used.
* `MetadataSerilizer` - serializer for metadata, if `null` the default serializer will be used.
* `Credentials` - EventStoreDB user credentials. If not specified, the credentials specified in the `EventStoreClientSettings` will be used.
* `ResolveLinkTos` - if `true`, the subscription will automatically resolve the event link to the event that caused the event. Default is `false`.
* `ConcurrencyLimit` - maximum number of events to be processed in parallel. Default is `1`.
* `EventFilter` - filter for events, if `null`, the subscription will filter out system events.
* `CheckpointInterval` - interval between checkpoints. Default is `10` events.

### Checkpoint store

`AllStreamSubscription` is a catch-up subscription that is fully managed on the client side (your application), so you need to manage the [checkpoint]({{< ref "checkpoint" >}}). You can register the checkpoint store using `AddCheckpointStore<T>`, but in that case it will be used for all subscriptions in the application. It might be that your app has multiple subscriptions, and you want to use different checkpoint stores for each of them. In that case, you can register the checkpoint store for each subscription using `UseCheckpointStore<T>` extension of the subscription builder

```csharp
builder.Services.AddSubscription<AllStreamSubscription, AllStreamSubscriptionOptions>(
    "BookingsProjections",
    builder => builder
        .UseCheckpointStore<MongoCheckpointStore>()
        .AddEventHandler<BookingStateProjection>()
        .AddEventHandler<MyBookingsProjection>()
);
```

### Concurrent event handlers

As any catch-up subscription, subscription to all runs sequentially, processing events one by one. In many cases that's enough, but sometimes you might want to speed it up, and allow parallel processing of events. To do that, you need to set the `ConcurrencyLimit` subscription option property to a value that is equal to the number of events being processed in parallel. In addition, you need to tell the subscription how to distribute events into partitions. That is needed as you rarely can tolerate processing events in a completely random order, so you can partition events using some key, and distribute them to different partitions.

Here is an example of using `AllStreamSubscription` with `ConcurrencyLimit` and partitioning by stream name:

```csharp
var partitionCount = 2;
builder.Services.AddSubscription<AllStreamSubscription, AllStreamSubscriptionOptions>(
    "BookingsProjections",
    builder => builder
        .Configure(cfg => cfg.ConcurrencyLimit = partitionCount)
        .AddEventHandler<BookingStateProjection>()
        .AddEventHandler<MyBookingsProjection>()
        .WithPartitioningByStream(partitionCount)
);
```

You can build your own partitioning strategy by implementing the `GetPartitionKey` function:

```csharp
public delegate string GetPartitionKey(IMessageConsumeContext context);
```

and then using it in the `WithPartitioning` extension:

```csharp
builder => builder
    .Configure(cfg => cfg.ConcurrencyLimit = partitionCount)
    ... // add handlers
    .WithPartitioning(partitionCount, MyPartitionFunction)
```


