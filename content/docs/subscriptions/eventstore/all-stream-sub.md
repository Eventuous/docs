---
title: "All stream subscription"
description: "Subscribe to all events in the store"
date: 2021-04-08
images: []
weight: 10
---

Subscribing to all events in the store is extremely valuable. This way, you can build comprehensive read models, which consolidate information from multiple aggregates. You can also use such a subscription for integration purposes, to convert and publish integration events.

{{% alert icon="📖" %}}
[Read more](https://zimarev.com/blog/event-sourcing/all-stream/) about benefits of using the global event stream.
{{%/ alert %}}

## All stream subscription service

The `AllStreamSubscriptionService` class inherits from the [subscription service]({{< ref "sub-service" >}}).

Although the `AllStreamSubscriptionService` class is not abstract, we do not recommend using it directly. You need to create your own class, which inherits from it. This way, you can specify the subscription ID for the base class constructor, as it's a string, which is not DI-friendly.

WIP

```csharp
builder.Services.AddSubscription<AllStreamSubscription, AllStreamSubscriptionOptions>(
    "BookingsProjections",
    builder => builder
        .AddEventHandler<BookingStateProjection>()
        .AddEventHandler<MyBookingsProjection>()
        .WithPartitioningByStream(2)
);
```

