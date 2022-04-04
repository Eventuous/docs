---
title: "Stream subscription"
description: "Subscribe to events from a single stream"
weight: 20
---

Although subscribing to `$all` using [`AllStreamSubscription`]({{< ref "all-stream-sub" >}}) is the most efficient way to create, for example, [read models]({{< ref "read-models" >}}) using all events in the event store, it is also possible to subscribe to a single stream.

For example, you can subscribe to the `$ce-Booking` stream to project all events for all the aggregates of type `Booking`, and create some representation of the state of the aggregate in a queryable store.

Another scenario is to subscribe to an integration stream, when you use EventStoreDB as a backend for a messaging system.

For that purpose you can use the `StreamSubscription` class.

## Single stream subscription

For registering a subscription to a single stream, use `AddSubscription<StreamSubscription, StreamSubscriptionOptions> as shown below:

```csharp
builder.Services.AddSubscription<StreamSubscription, StreamSubscriptionOptions>(
    "BookingsStateProjections",
    builder => builder
        .Configure(cfg => {
            cfg.StreamName = "$ce-Booking";
            cfg.ResolveLinkTos = true;
        )
        .AddEventHandler<BookingStateProjection>()
);
```

Subscription options for `StreamSubscription` are defined in `StreamSubscriptionOptions` class.

| Option               | Description                                                                                                                        |
|:---------------------|:-----------------------------------------------------------------------------------------------------------------------------------|
| `SubscriptionId`     | Unique subscription identifier.                                                                                                    |
| `StreamName`         | Name of the stream to subscribe to.                                                                                                |
| `ThrowOnError`       | If `true`, an exception will be thrown if the subscription fails, otherwise the subscription continues to run. Default is `false`. |
| `EventSerilizer`     | Serializer for events, if `null` the default serializer will be used.                                                              |
| `MetadataSerilizer`  | Serializer for metadata, if `null` the default serializer will be used.                                                            |
| `Credentials`        | EventStoreDB user credentials. If not specified, the credentials specified in the `EventStoreClientSettings` will be used.         |
| `ResolveLinkTos`     | If `true`, the subscription will automatically resolve the event link to the event that caused the event. Default is `false`.      |
| `IgnoreSystemEvents` | Set to true to ignore system events. Default is `true`.                                                                            |
| `ConcurrencyLimit`   | Maximum number of events to be processed in parallel. Default is `1`.                                                              |

{{% alert icon="👉" %}}
At the bare minimum, you must define the stream name in the subscription options.
{{% /alert %}}

{{% alert icon="☎️" color="warning" title="" %}}
When subscribing to a stream that contains link events, you should set the `ResolveLinkTos` option to `true` to resolve the link to the original event that is linked to the link event.
{{% /alert %}}

### Checkpoint store

`StreamSubscription` is a catch-up subscription that is fully managed on the client side (your application), so you need to manage the [checkpoint]({{< ref "checkpoint" >}}). You can register the checkpoint store using `AddCheckpointStore<T>`, but in that case it will be used for all subscriptions in the application. It might be that your app has multiple subscriptions, and you want to use different checkpoint stores for each of them. In that case, you can register the checkpoint store for each subscription using `UseCheckpointStore<T>` extension of the subscription builder

```csharp
builder.Services.AddSubscription<AllStreamSubscription, AllStreamSubscriptionOptions>(
    "BookingsProjections",
    builder => builder
        .Configure(cfg => {
            cfg.StreamName = "$ce-Booking";
            cfg.ResolveLinkTos = true;
        )
        .UseCheckpointStore<MongoCheckpointStore>()
        .AddEventHandler<BookingStateProjection>()
);
```

### Concurrent event handlers

The single stream subscription is identical to the `$all` stream subscription in terms of the event handlers execution. By default, all the events are processed one-by-one, but you can use the `ConcurrencyLimit` option to process multiple events in parallel.

You can use the stream name partitioner when subscribing to a category (`$ce`) stream. In that case events for a single aggregate instance will always be processed sequentially, but events for different aggregate instances can be processed in parallel.

Read more about concurrent event processing on the 
[all stream subscription]({{< ref "all-stream-sub#concurrent-event-handlers" >}}) page.
