---
title: "Event handlers"
description: "The last bit of the subscription process"
---

Event handlers are at the end of the subscription event processing [pipeline](../pipes). Each subscription has a single consumer, which holds a collection of event handlers added to the subscription. The consumer calls all the event handlers simultaneously, collects the results, and then acknowledges the event to the subscription.

One typical example of an event handler is a [read model](../../read-models) projector. Eventuous currently supports projecting events to [MongoDB](../../infra/mongodb), but you can also use any other database or even a file system.

## Abstractions

The default consumer holds a collection of classes that implement the very basic interface of an event handler. The interface is defined like this:

```csharp
public interface IEventHandler {
    string DiagnosticName { get; }
    
    ValueTask<EventHandlingStatus> HandleEvent(IMessageConsumeContext context);
}
```

There, the `DiagnosticName` is an informational property. Its value is used in log messages when the handler processes th event or fails to do so. 

The `HandleEvent` function is called for each event received by the consumer, so its implementation contains the actual event processing code. This function should return a result of type `EventHandlingResult` which is a bitmask. 

The second abstraction is the `BaseEventHandler` abstract class. It is normally used as the base class for all the event handlers, including custom ones, instead of implementing the interface directly. The only function of the base class is to set the `DiagnosticName` property to the type name of the event handler class.

Higher-level event handlers implemented in Eventuous like `MongoProjection` and `GatewayHandler` inherit from `BaseEventHandler`.

## Process

Normally, a handler would return `Success` if it handled the event successfully, `Error` if handling the event failed, or `Ignored` when the handler doesn't have any code to process the event. When the consumer gets all the results from its handlers, it decides on the combined result as described below:

- Consider ignored events as processed successfully
- If all the events were successfully processed, the consumer acknowledges the event
- If one or more handlers returned an error result, the consumer considers it as an error, and the consumer explicitly NACKs the event

What happens with events that were not acknowledged by the consumer depends on the subscription type and its configuration.

## Custom handlers

If you need to implement a custom handler like a projector to a relational database, you would normally use a higher-level abstraction provided by Eventuous, which is called `EventHandler`. It allows registering typed handlers per event type in a map, and the `HandleEvent` function of the interface is already implemented there to call the registered handler or return the `Ignore` result if there's no handler for a given event type is registered in the map.

For example, a simple handler below would print `$$$ MONEY! You got USD 100!` on the console when it receives the `PaymentRegistered` event where the paid amount property of the event is `100` and currency is `USD`:

```csharp
class MoneyHandler : EventHandler {
    public MoneyHandler(TypeMapper? typeMap = null) : base(typeMap) {
        On<PaymentRegistered>(
            async context => {
                await Console.Out.WriteLineAsync(
                    $"$$$ MONEY! You got {context.Message.Currency} {context.Message.AmountPaid}"
                );
            }
        );
    }
}
```

Another example would be a base class for a projector. It would use the handlers map and allow adding extended handlers purposed for projecting events to a query model. Below you can find an example of a base class for a Postgres projector:

```csharp
public abstract class PostgresProjector : EventHandler {
    readonly GetPostgresConnection _getConnection;

    protected PostgresProjector(
        GetPostgresConnection getConnection, 
        TypeMapper? mapper = null) : base(mapper) {
        _getConnection = getConnection;
    }

    protected void On<T>(ProjectToPostgres<T> handler) where T : class {
        base.On<T>(async ctx => await Handle(ctx).NoContext());

        async Task Handle(MessageConsumeContext<T> context) {
            await using var connection = _getConnection();
            await connection.OpenAsync(context.CancellationToken).ConfigureAwait(false);
            var cmd = await handler(connection, context).ConfigureAwait(false);
            await cmd.ExecuteNonQueryAsync(context.CancellationToken).ConfigureAwait(false);
        }
    }
}

public delegate Task<NpgsqlCommand> ProjectToPostgres<T>(
    NpgsqlConnection connection, 
    MessageConsumeContext<T> consumeContext)
    where T : class;
```