---
title: "Subscription service"
description: "Base class for subscriptions"
images: []
menu:
  docs:
    parent: "subscriptions"
weight: 525
toc: true
---

Eventuous implements all subscription types as hosted services. It's because subscriptions need to start when the application starts, work in background when the application is running, then shut down when the application stops.

Eventuous has a `SubscriptionService` base class. It aims to support a variety of scenarios, using a real-time message delivery infrastructure to feed message handlers (could be events or commands).

All infrastructure-specific subscriptions inherit from `SubscriptionService` as it handles most of the subscription mechanics, such as:

- Selecting event handlers, which the subscription will serve
- Reading the last known [checkpoint]({{< ref "checkpoint" >}})
- Subscribing (this one is delegated to the implementation)
- Handling eventual [subscription drops](#subscription-drops) and resubscribes
- Measuring the [subscription gap](#mind-the-gap)
- Reporting the [subscription health](#health-checks)
- Updating the checkpoint
- Graceful shutdown

You'd normally use the DI container to register subscriptions with all the necessary handlers (described below).

## Event handlers

As mentioned on the [Concept]({{< ref "subs-concept" >}}) page, one subscription might serve multiple event handlers, such as projections. It is especially relevant to keep a group of projections in sync, so they don't produce inconsistent [read models]({{ ref "rm-concepts" }}).

Each subscription service gets a list of event handlers. An event handler must implement the `IEventHandler` interface, which has two members:

```csharp
public interface IEventHandler {
    string DiagnosticName { get; }
    ValueTask<EventHandlingStatus> HandleEvent(IMessageConsumeContext context);
}
```

The `HandleEvent` function will be called by the subscription service for each event it receives. The event is already deserialized. The function also gets the event position in the stream. It might be used in projections to set some property of the read model. Using this property in queries will tell you if the projection is up-to-date.

{{% alert icon="👻" color="warning" title="Event handler failures" %}}
If an event handler throws, the whole subscription will fail. Such a failure will cause the subscription drop, and the subscription will resubscribe. If the error is caused by a poison event, which can never be handled, it will keep failing in a loop. You can configure the subscription to ignore failures and continue by setting `ThrowIfError` property of `SubscriptionOptions` to `false`.
{{% /alert %}}

The diagnostic name of the handler is used to distinguish logs in traces coming from a subscription per individual handler.

### Consume context

The subscription will invoke all its event handlers at once for each event received. Instead of just getting the event, the handler will get an instance of the message context (`IMessageConsumeContext` interface). The context contains the payload (event or other message) in its `Message` property, which has the type `object?`. It's possible to handle each event type differently by using pattern matching:

```csharp
public ValueTask<EventHandlingStatus> HandleEvent(IMessageConsumeContext ctx) {
    return ctx.Message switch {
        V1.RoomBooked => ...
        _ => EventHandlingStatus.Ignored
    };
}
```

However, it's easier and more explicit to use pre-optimised base handlers. For read model projections you can use [Projections] handlers, described separately. For integration purposes you might want to use the [Gateway]({{< ref "gateway" >}}). For more generic needs, Eventuous offers the `EventHandler` base class. It allows specifying typed handlers for each of the event types that the handler processes:

```csharp
public class MyHandler : EventHandler {
    public MyHandler(SmsService smsService) {
        On<RoomBooked>(async ctx => await smsService.Send($"Room {ctx.Message.RoomId} booked!"));
    } 
}
```

The typed handler will get an instance of `MessageConsumeContext<T>` where `T` is the message type. There, you can access the message using the `Message` property without casting it.

A subscription will invoke a single consumer and give it an instance of the consume context. The consumer's job is to handle the message by invoking all the registered handlers. By default, Eventuous uses the `DefaultConsumer`, unless specified otherwise when registering the subscription. The `IMessageConsumeContext` interface has functions to acknowledge (ACK), not acknowledge (NACK), or ignore the message. The default consumer Acks the message when all the handlers processed the message without failures, and at least one handler didn't ignore the message. It Nacks the message if any handler returned an error or crashed. Finally, it will ignore the message if all the handlers ignored it. How the message handling result is processed is unknown to the consumer as this behaviour is transport-specific. Each subscription type has its own way to process the message handling result.

### Handling result

The handler needs to return the handling status. It's preferred to return the error status `EventHandlingStatus.Failure` instead of throwing an exception. When using the `EventHandler` base class, if the event handling function throws an exception, the handler will return the failure status and not float the exception back to the subscription.

The status is important for diagnostic purposes. For example, you don't want to trace event handlers for events that are ignored. That's why when you don't want to process the event, you need to return `EventHandlingStatus.Ignored`. The `EventHandler` base class will do it automatically if it gets an event that has no registered handler.

When the event is handled successfully (neither failed nor ignored), the handler needs to return `EventHandlingStatus.Success`. Again, the `EventHandler` base class will do it automatically if the registered handler doesn't throw.

The subscription will acknowledge the event only if all of its handlers _don't fail_. How subscriptions handle failures depends on the transport type.

## Registration

As mentioned before, you'd normally register subscriptions using the DI extensions provided by Eventuous:

```csharp
builder.Services.AddSubscription<StreamSubscription, StreamSubscriptionOptions>(
    "PaymentIntegration",
    builder => builder
        .Configure(x => x.StreamName = PaymentsIntegrationHandler.Stream)
        .AddEventHandler<PaymentsIntegrationHandler>()
);
```

The `AddSubscription` extension needs two generic arguments: subscription implementation and its options. Every implementation has its own options as the options configure the particular subscription transport.

The first parameter for `AddSubscription` is the subscription name. It must be unique within the application scope. Eventuous uses the subscription name to separate one subscription from another, along with their options and other things. The subscription name is also used in diagnostics as a tag.

Then, you need to specify how the subscription builds. There are two most used functions in the builder:

- `Configure`: allows to change the subscription options
- `AddEventHandler<T>`: adds an event handler to the subscription

You can add several handlers to the subscription, and they will always "move" together throw the events stream or topic. If any of the handlers fail, the subscription might fail, so it's "all or nothing" strategy.

Eventuous uses the consume pipe, where it's possible to add filters (similar to [MassTransit](http://masstransit-project.com)). You won't need to think about it in most of the cases, but you can read mode in the [Pipes and filters]({{< ref "pipes">}}) section.

## Subscription drops

A subscription could drop for different reasons. For example, it fails to pass the keep alive ping to the server due to a transient network failure, or it gets overloaded.

The subscription service handles such drops and issues a resubscribe request, unless the application is shutting down, so the drop is deliberate.

This feature makes the subscription service resilient to transient failures, so it will recover from drops and continue processing events, when possible.

You can configure the subscription to ignore failures and continue by setting `ThrowIfError` property of `SubscriptionOptions` to `false`.

## Mind the gap

When using subscriptions for read model projections, you enter to the world of [CQRS](https://zimarev.com/blog/event-sourcing/cqrs/) and asynchronous messaging. After completing a transaction in the domain model, one or more events are added to the event store. Then, a subscription picks it up and calls a projection. Although in most cases you'll see only a few milliseconds delay between these operations, if your projection becomes slow (for example, it uses a slow database), the processing time will increase.

The easiest way to detect such situations is to observe the gap between the last event in the stream, which the subscription listens to, and the event, which is currently being processed. We call it the **subscription gap**.

{{% alert icon="☎️" color="warning" title="Alerting for the gap" %}}
If the gap increases continuously, your subscription is not catching up with all the events it receives. You need to set up a proper metric for the gap, and trigger an alert if the gap exceeds the value you can tolerate.
{{% /alert %}}

The gap is measured by subscriptions that implement the `IMeasuredSubscription` interface:

```csharp
public interface IMeasuredSubscription {
    GetSubscriptionGap GetMeasure();
}
```

Subscription gaps are collected as metrics. Read more about Eventuous metrics in the [Diagnostics] section.

## Health checks

The subscription service class also implements the `IHealthCheck` interface. Therefore, it can be used for [ASP.NET Core health monitoring](https://docs.microsoft.com/en-us/aspnet/core/host-and-deploy/health-checks?view=aspnetcore-5.0).

When using Eventuous dependency injection extensions, each registered subscription will also register its health checks.

However, you need to register the global Eventuous subscriptions health check by adding one line to the ASP.NET Core health checks registration:

```csharp
builder.Services
  .AddHealthChecks()
  .AddSubscriptionsHealthCheck("subscriptions", HealthStatus.Unhealthy, new []{"tag"});
```

