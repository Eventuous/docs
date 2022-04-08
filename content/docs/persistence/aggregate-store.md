---
title: "Aggregate store"
description: "Aggregate store"
date: 2020-10-06T08:49:31+00:00
images: []
menu:
  docs:
    parent: "persistence"
weight: 320
---

{{% alert icon="👉" %}}
Eventuous does not have a concept of Repository. Find out why [on this page]({{< ref "../faq/persistence" >}}).
{{% /alert %}}

Eventuous provides a single abstraction for the domain objects persistence, which is the `AggregateStore`.

The `AggregateStore` uses the `IEventStore` abstraction to be persistence-agnostic, so it can be used as-is, when you give it a proper implementation of event store.

We have only two operations in the `AggregateStore`:
- `Load` - retrieves events from an aggregate stream and restores the aggregate state using those events.
- `Store` - collects new events from an aggregate and stores those events to the aggregate stream.

The `AggregateStore` constructor needs two arguments:
- [Event store]({{< ref "event-store" >}}) (`IEventStore`)
- [Event serializer]({{< ref "serialisation" >}}) (`IEventSerializer`)

Our [`ApplicationService`]({{< ref "app-service" >}}) uses the `AggregateStore` in its command-handling flow.

## Infrastructure

Eventuous supports [EventStoreDB](https://eventstore.com) out of the box, but only v20+ with gRPC protocol.

Using this pre-made event persistence is easy. You can register the necessary dependencies in your startup code:

```csharp
builder.Services.AddSingleton(new EventStoreClient(
    EventStoreClientSettings.Create(connectionString)
));
services.AddAggregateStore<EsDbEventStore>();
```

The `AddAggregateStore` extension is available in the `Eventuous.AspNetCore` NuGet package.

{{% alert icon="👉" %}}
Make sure to read about [events serialisation]({{< ref "serialisation">}}).
{{% /alert %}}

## Stream name

The aggregate store (application-level abstraction) uses an event store (infrastructure) to store events in streams. Each aggregate instance has its own stream, so the event store needs to be capable to read and write events from/to the correct stream.

By default, Eventuous uses the `AggregateType.Name` combined with the aggregate id as the stream name. For example, the `Booking` aggregate with id `1` has a stream name `Booking-1`. That's what `StreamName.For<Booking>(1)` returns.

However, you might want to have more fine-grained control over the stream name. For example, you might want to include the tenant id in the stream name. It's possible to override the default convention by configuring the stream name mapping. The stream map contains a mapping between the aggregate identity type (derived from `AggregateId`) and the stream name generation function. Therefore, any additional property of the aggregate identity type can be used to generate the stream name.

For example, the following code registers a stream name mapping for the `Booking` aggregate:

```csharp
public record BookingId : AggregateId {
    public BookingId(string id, string tenantId) : base(id) {
        TenantId = tenantId;
    }

    public string TenantId { get; }
}

public class BookingService : ApplicationService<Booking, BookingState, BookingId> {
    public BookingService(IAggregateStore store, StreamNameMap streamNameMap)
        : base(store, streamNameMap: streamNameMap) {
        // command handlers registered here
    }
}

// code of the bootstrapper
var streamNameMap = new StreamNameMap();
streamNameMap.Register<Booking, BookingState, BookingId>(
    id => $"Booking-{id.TenantId}-{id.Id}"
);
services.AddSingleton(streamNameMap);
services.AddApplicationService<BookingService>();
```
