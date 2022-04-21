---
title: "Application service"
description: "Application service and unit of work"
weight: 420
---

{{% alert icon="👉" %}}
The Application Service base class is **optional**, it just makes your life a bit easier.
{{%/ alert %}}

## Concept

The command service itself performs the following operations when handling one command:
1. Extract the aggregate id from the command, if necessary.
2. Instantiate all the necessary value objects. This could effectively reject the command if value objects cannot be constructed. The command service could also load some other aggregates, or any other information, which is needed to execute the command but won't change state.
3. If the command expects to operate on an existing aggregate instance, this instance gets loaded from the [Aggregate Store]({{< ref "aggregate-store" >}}).
4. Execute an operation on the loaded (or new) aggregate, using values from the command, and the constructed value objects.
5. The aggregate either performs the operation and changes its state by producing new events, or rejects the operation.
6. If the operation was successful, the service persists new events to the store. Otherwise, it returns a failure to the edge.

{{% alert icon="⁉️" title="Command-handling errors" color="warning" %}}
The last point above translates to: the application service **does not throw exceptions**. It [returns](#result) an instance of `ErrorResult` instead. It is your responsibility to handle the error.

{{%/ alert %}}

## Application service base class

Eventuous provides a base class for you to build command services. It is a generic abstract class, which is typed to the aggregate type. You should create your own implementation of a command service for each aggregate type. As command execution is transactional, it can only operate on a single aggregate instance, and, logically, only one aggregate type.

### Registering command handlers

We have three methods, which you call in your class constructor to register the command handlers:

| Function     | What's it for                                                                                                                                                                                                                                                               |
|--------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `OnNew`      | Registers the handler, which expects no instance aggregate to exist (create, register, initialise, etc).<br> It will get a new aggregate instance. The operation will fail when it will try storing the aggregate state due to version mismatch.                            |
| `OnExisting` | Registers the handler, which expect an aggregate instance to exist.<br> You need to provide a function to extract the aggregate id from the command.<br> The handler will get the aggregate instance loaded from the store, and will throw if there's no aggregate to load. |
| `OnAny`      | Used for handlers, which can operate both on new and existing aggregate instances. <br>The command service will _try_ to load the aggregate, but won't throw if the load fails, and will pass a new instance instead.                                                       |

Here is an example of a command service form our test project:

```csharp
public class BookingService
  : ApplicationService<Booking, BookingState, BookingId> {
    public BookingService(IAggregateStore store) : base(store) {
        OnNew<Commands.BookRoom>(
            (booking, cmd)
                => booking.BookRoom(
                    new BookingId(cmd.BookingId),
                    cmd.RoomId,
                    new StayPeriod(cmd.CheckIn, cmd.CheckOut),
                    cmd.Price,
                    cmd.BookedBy,
                    cmd.BookedAt
                )
        );

        OnAny<Commands.ImportBooking>(
            cmd => new BookingId(cmd.BookingId),
            (booking, cmd)
                => booking.Import(
                    new BookingId(cmd.BookingId),
                    cmd.RoomId,
                    new StayPeriod(cmd.CheckIn, cmd.CheckOut)
                )
        );
    }
}
```

You pass the command handler as a function to one of those methods. The function can be inline, like in the example, or it could be a method in the command service class.

In addition, `OnAny` and `OnExisting` need a function, which extracts the aggregate id from the command, as both of those methods will try loading the aggregate instance from the store.

{{% alert icon="👉" title="Stream name" %}}
Check the [stream name]({{< ref "aggregate-stream#stream-name" >}}) documentation if you need to use custom stream names.
{{%/ alert %}}

#### Async command handlers

If you need to get outside your process boundary when handling a command, you most probably would need to execute an asynchronous call to something like an external HTTP API or a database. For those cases you need to use async overloads:

- `OnNewAsync`
- `OnExistingAsync`
- `OnAnyAsync`

These overloads are identical to sync functions, but the command handler function needs to return `Task`, so it can be awaited.

### Result

The command service will return an instance of `Result`.

It could be an `OkResult`, which contains the new aggregate state and the list of new events. You use the data in the result to pass it over to the caller, if needed.

If the operation was not successful, the command service will return an instance of `ErrorResult` that contains the error message and the exception details.

### Bootstrap

If you registered the `EsdbEventStore` and the `AggregateStore` in your `Startup` as described on the [Aggregate store]({{< ref "aggregate-store" >}}) page, you can also register the application service:

```csharp
services.AddApplicationService<BookingCommandService, Booking>();
```

The `AddApplicationService` extension will register the `BookingService`, and also as `IApplicationService<Booking>`, as a singleton. Remember that all the DI extensions are part of the `Eventuous.AspNetCore` NuGet package.

When you also use `AddControllers`, you get the command service injected to your controllers.

You can simplify your application and avoid creating HTTP endpoints explicitly (as controllers or minimal API endpoints) if you use the [command API feature]({{< ref "command-api" >}}).

## Application HTTP API

The most common use case is to connect the application service to an HTTP API.

Read the [Command API]({{< ref "command-api" >}}) feature documentation for more details.
