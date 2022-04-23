---
title: "Implementation"
weight: 100
description: "How producers are implemented"
---

## Abstraction

Eventuous has two types of producers: with or without produce options. The producer without produce options is a simple producer that does not support any options, and it normally produces messages as-is. The producer with produce options can have more fine-grained control on how messages are produced. Produce options are provided per message batch.

The base interface for a producer is called `IEventProducer` and its only method is `Produce`.

```csharp
Task Produce(
    StreamName                   stream,
    IEnumerable<ProducedMessage> messages,
    CancellationToken            cancellationToken = default
);
```

Producers with produce options must implement the `IEventProducer<TProduceOptions>` interface, which is derived from `IEventProducer`. Therefore, a producer with options can also be used as an option-less producer.

```csharp
Task Produce(
    StreamName                   stream,
    IEnumerable<ProducedMessage> messages,
    TProduceOptions?             options,
    CancellationToken            cancellationToken = default
);
```

The `IEventProducer` interface also has a property `ReadyNow`, which indicates if the producer is ready. It is needed because gateways to know if the producer is ready to produce messages. In many cases, a producer needs to arrange or check some infrastructure (queue or topic) before it can produce messages. When that work is done, the producer should set the `ReadyNow` property to `true`.

## Base producer

There are two abstract base classes for producers, one without options, and the other one with options.

The purpose for the base class is to enable tracing for produced messages. All producers implemented in Eventuous use the base producer class. For the purpose of tracing, the base producer class accepts `ProducerTracingOptions` as a parameter.

```csharp
public record ProducerTracingOptions {
    public string? MessagingSystem  { get; init; }
    public string? DestinationKind  { get; init; }
    public string? ProduceOperation { get; init; }
}
```

These options are used to set the producer trace tags that are specific for the infrastructure. For example, the messaging system tag for `RabbitMqProducer` is `rabbitmq`.

Both base classes implement the `Produce` method. It is only used to enable tracing. The actual producing is done by the `ProduceMessages` abstract method. When implementing a new producer using the base class, you'd only need to implement the `ProduceMessages` method.

You can see that for producing a message, the producer gets a collection of `ProducedMessage` record. It looks like this:

```csharp
public record ProducedMessage {
    public object           Message     { get; }
    public Metadata?        Metadata    { get; init; }
    public Guid             MessageId   { get; }
    public string           MessageType { get; }
    public Func<ValueTask>? OnAck       { get; init; }
}
```

The `Message` property is the actual message payload. Normally, producers use `IEventSerializer` instance to serialize the message payload. Sometimes, producers must comply with their supporting infrastructure, and use a different way to serialize the message payload. In that case, the `MessageType` property can be added to the produced message body or header, so it can be deserialized by subscriptions.

## Registration

Eventuous provide several extensions to `IServiceCollection` to register producers. You can provide a pre-made producer instance, a function to resolve the producer from the `IServiceProvider`, or just the producer type if its dependencies can be resolved.

For example, if you have registered the `EventStoreClient` instance, you can then register the `EventStoreProducer` like this:

```csharp
builder.Services.AddEventProducer<EventStoreProducer>();
```

If a producer needs to do some work before ot becomes ready, it should implement the `IHostedService` interface, so it can do all the necessary startup work in `StartAsync` method. When using any of the `AddProducer` extensions, the producer will be registered as a `IHostedService` if the producer implements it.

Remember that producers are registered as singletons. If you need to have multiple producer instances in your application, you'd need to provide them as direct dependencies instead of registering them. It's not often that you need multiple producer instances, unless you're using gateways. Gateway registration extensions are able to use individual producer instances as dependencies.
