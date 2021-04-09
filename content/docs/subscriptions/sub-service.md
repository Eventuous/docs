---
title: "Subscription service"
description: "Base class for subscriptions"
date: 2021-04-08
lastmod: 2021-04-08
draft: false
images: []
menu:
  docs:
    parent: "subscriptions"
weight: 525
toc: true
---

Eventuous implements all subscription types as hosted services. It's because subscriptions need to start when the application starts, work in background when the application is running, then shut down when the application stops.

Eventuous has a `SubscriptionService` base class. Both `AllStreamSubscriptionService` and `StreamSubscriptionService` inherit from it as it handles most of the subscription mechanics, such as:

- Selecting event handlers, which the subscription will serve
- Reading the last known [checkpoint]({{< ref "checkpoint" >}})
- Subscribing (this one is delegated to the implementation)
- Handling eventual [subscription drops](#subscription-drops) and resubscribes
- Measuring the [subscription gap](#mind-the-gap)
- Reporting the [subscription health](#health-checks)
- Updating the checkpoint
- Graceful shutdown

## Service arguments

The subscription service requires the following arguments:

| Parameter name | Type | What's it for | Required |
| -------------- | ---- | ------------- | -------- |
| `eventStoreClient` | `EventStoreClient` | Client for EventStoreDB | Yes |
| `subscriptionName` | `string` | Identifier to select event handlers | Yes |
| `checkpointStore` | `ICheckpointStore` | [Checkpoint]({{< ref "checkpoint" >}}) store | Yes |
| `eventSerializer` | `IEventSerializer` | Event [serializer]({{< ref "serialisation" >}}) | Yes |
| `eventHandlers` | `IEnumerable<IEventHandler>` | List of event handlers | Yes |
| `loggerFactory` | `ILoggerFactory?` | Microsoft logging logger factory instance | No |
| `measure` | `ProjectionGapMeasure?` | Callback to report the [subscription gap](#mind-the-gap) | No |

## Event handlers

As mentioned on the [Concept]({{< ref "subs-concept" >}}) page, one subscription might serve multiple event handlers, such as projections. It is especially relevant to keep a group of projections in sync, so they don't produce inconsistent [read models]({{ ref "rm-concepts" }}).

Each subscription service gets a list of event handlers. An event handler must implement the `IEventHandler` interface, which has two members:

```csharp
public interface IEventHandler {
    string SubscriptionGroup { get; }
    Task HandleEvent(object evt, long? position);
}
```

The `HandleEvent` function will be called by the subscription service for each event it receives. The event is already deserialized. The function also gets the event position in the stream. It might be used in projections to set some property of the read model. Using this property in queries will tell you if the projection is up to date.

{{% alert icon="👻" color="warning" %}}
If an event handler throws, the whole subscription will fail. Such a failure will cause the subscription drop, and the subscription will resubscribe. If the error is caused by a poison event, which can never be handled, it will keep failing in a loop.
{{% /alert %}}

The interface also has the `SubscriptionGroup` property. It is used by the subscription to only select the relevant event handlers, as it might get all the handlers in the application (for example, if all the handlers are registered in the DI container). The subscription will _only_ serve those handlers, which have the `SubscriptionGroup` property value matching the subscription own `subscriptionName` argument value.

## Subscription drops

An EventStoreDB subscription could drop for different reasons. For example, it fails to pass the keep alive ping to the server due to a transient network failure, or it gets overloaded.

The subscription service handles such drops and issues a resubscribe request, unless the application is shutting down, so the drop is deliberate.

This feature makes the subscription service resilient to transient failures, so it will recover from drops and continue processing events, when possible.

## Mind the gap

When using subscriptions for read model projections, you enter to the world of [CQRS](https://zimarev.com/blog/event-sourcing/cqrs/) and asynchronous messaging. After completing a transaction in the domain model, one or more events are added to the event store. Then, a subscription picks it up and calls a projection. Although in most cases you'll see only a few milliseconds delay between these operations, if your projection becomes slow (for example, it uses a slow database), the processing time will increase.

The easiest way to detect such situations is to observe the gap between the last event in the stream, which the subscription listens to, and the event, which is currently being processed. We call it the **subscription gap**.

{{% alert icon="😱" color="warning" %}}
If the gap increases continuously, your subscription is not catching up with all the events it receives. You need to set up a proper metric for the gap, and trigger an alert if the gap exceeds the value you can tolerate.
{{% /alert %}}

The gap is measured by supplying a `SubscriptionGapMeasure` instance, which has a function that you can use for your metric:

```csharp
public ulong GetGap(string checkpointId) => _gaps[checkpointId];
```

You only need a single instance of the `SubscriptionGapMeasure` in the application, as it handles multiple subscriptions. The `checkpointId` there has the same value as the `subscriptionName`. The gap is measured once per second.

## Health checks

The subscription service class also implements the `IHealthCheck` interface. Therefore, it can be used for [ASP.NET Core health monitoring](https://docs.microsoft.com/en-us/aspnet/core/host-and-deploy/health-checks?view=aspnetcore-5.0).

For example, you can register your subscription as a hosted service, and then add it to the health check configuration:

```csharp
services.AddHostedService<MySubscription>();
services.AddHealthChecks().AddCheck<MySubscriptionService>();
```

In addition, Eventuous provides a helper registration method for the DI container, which does both. You can also supply the health name and tags for each subscription:

```csharp
services.AddSubscription<MySubscriptionService>("state-update", new[] {"esdb"});
```
