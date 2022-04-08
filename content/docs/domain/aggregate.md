---
title: "Aggregate"
description: "Aggregate: consistency boundaries"
weight: 200
---

## Concept

{{% alert icon="🧐" color="light" %}}
If you are familiar with the concept, [scroll down](#implementation).
{{% /alert %}}

`Aggregate` is probably the most important tactical pattern in Domain-Driven Design. It is a building block of the domain model. An `Aggregate` is a model on its own, a model of a particular business objects, which can be uniquely identified and by that distinguished from any other object of the same kind.

When handling a command, you need to ensure it only changes the state of a single aggregate. An aggregate boundary is a transaction boundary, so the state transition for the aggregate needs to happen entirely or not at all.

{{% alert icon="👇" color="light" %}}
**TD;LR** Eventuous doesn't have entities other than the Aggregate Root. If you are okay with that, [scroll down](#implementation).
{{% /alert %}}

Traditionally, DDD defines three concepts, which are related to aggregate:
- `Entity` - a representation of a business object, which has an identifier
- `Aggregate Root` - an entity, which might aggregate other entities and value objects
- `Aggregate` - the `Aggregate Root` and all the things inside it

The idea of an aggregate, which holds more than one entity, seems to be derived from the technical concerns of persisting the state. You can imagine an aggregate root type called `Booking` (for a hotel room), which holds a collection of `ExtraService` entities. Each of those entities represent a single extra service ordered by the guest when they made this booking. It could be a room service late at night, a baby cot, anything else that the guest needs to order in advance. Since those extra services might be also cancelled, we need to have a way to uniquely identify each of them inside the `Booking` aggregate, so those are entities.

If we decide to persist the `Booking` state in a relational database, the natural choice would be to have one table for `Booking` and one table for `ExtraService` with one-to-many relationship. Still, when loading the `Booking` state, we load the whole aggregate, so we have to read from the `Booking` table with inner join on the `ExtraService` table.

Those entities might also have behaviour, but to reach out to an entity within an aggregate, you go through the aggregate root (`Booking`). For example, to cancel the baby cot service, we'd have code like this:

```csharp
var booking = bookingRepository.Load(bookingId);
booking.CancelExtraService(extraServiceId);
bookingRepository.Save(booking);
```

In the `Booking` code it would expand to:

```csharp
void CancelExtraService(ExtraServiceId id) {
    extraServices.RemoveAll(x => x.Id == id);
    RecalculateTotal();
}
```

So, we have an entity here, but it doesn't really expose any behaviour. Even if it does, you first call the aggregate root logic, which finds the entity, and then routes the call to the entity.

In Eventuous, we consider it as a burden. If you need to find the entity in the aggregate root logic, why can't you also execute the operation logic right away? If you want to keep the entity logic separated, you can always create a module with a pure function, which takes the entity state and returns an event to the aggregate root.

The relational database persistence concern doesn't exist in Event Sourcing world. Therefore, we decided not to implement concepts like `Entity` and `AggregateRoot`. Instead, we provide a single abstraction for the logical and physical transaction boundary, which is the `Aggregate`.

## Implementation

Eventuous provides three abstract classes for the `Aggregate` pattern, which are all event-sourced. The reason to have three and not one is that all of them allow you to implement the pattern differently. You can choose the one you prefer.

### Aggregate

The `Aggregate` abstract class is quite technical and provides very little out of the box.

| Member         | Kind                 | What it's for                                                               |
|----------------|----------------------|-----------------------------------------------------------------------------|
| `Changes`      | Read-only collection | Events, which represent new state changes, get added here                   |
| `ClearChanges` | Method               | Clears the changes collection                                               |
| `Version`      | Property, `int`      | Current aggregate version, used for optimistic concurrency. Default is `-1` |
| `AddChange`    | Method               | Adds an event to the list of changes                                        |

It also has two helpful methods, which aren't related to Event Sourcing:
- `EnsureExists` - throws if `Version` is `-1`
- `EnsureDoesntExist` - throws if `Version` is not `-1`

All other members are methods. You either need to implement them, or use one of the derived classes (see below).

| Member  | What it's for                                                                                                                                                                       |
|---------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `Load`  | Given the list of previously stored events, restores the aggregate state. Normally, it's used for synchronous load, when all the stored events come from event store at once.       |
| `Fold`  | Applies a single state transition event to the aggregate state and increases the version. Normally, it's used for asynchronous loads, when events come from event store one by one. |
| `GetId` | Returns the aggregate identity as `string`. As most databases support string identity, it's the most generic type to support persistence.                                           |

When building an application, you'd not need to use the `Aggregate` abstract class as-is. You still might want to use it to implement some advanced scenarios.

### Aggregate with state

Inherited from `Aggregate`, the `Aggregate<T>` adds a separate concept of the aggregate state. Traditionally, we consider state as part of the aggregate. However, state is the only part of the aggregate that mutated. We decided to separate state from the behaviour by splitting them into two distinct objects.

The aggregate state in Eventuous is _immutable_. When applying an event to it, we get a new state.

The stateful aggregate class implements most of the abstract members of the original `Aggregate`. It exposes an API, which allows you to use the stateful aggregate base class directly.

| Member  | Kind     | What it's for                                                                                                                                                                                            |
|---------|----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `Apply` | Method   | Given a domain event, applies it to the state. Replaces the current state with the new version. Adds the event to the list of changes. Returns a tuple with the previous and the current state versions. |
| `State` | Property | Returns the current aggregate state.                                                                                                                                                                     |

As we don't know how to extract the aggregate identity from this implementation, you still need to implement the `GetId` function.

The `Apply` function is virtual, so you can override it to add some contract-based checks (ensure if the state is valid, or the state transition was valid).

#### Aggregate state

We have an abstraction for the aggregate state. It might seem unnecessary, but it has a single abstract method, which you need to implement for your own state classes. As mentioned previously, we separated the aggregate behaviour from its state. Moving along, we consider event-based state transitions as part of the state handling. Therefore, the state objects needs to expose an API to receive events and produce a new instance of itself (remember that the state is immutable).

To support state immutability, `AggregateState` is an abstract _record_, not class. Therefore, it supports immutability out of the box and supports `with` syntax to make state transitions easier.

A record, which inherits from `AggregateState` needs to implement a single function called `When`. It gets an event as an argument and returns the new state instance. There are two ways to define how events mutate the state, described below.

##### Using pattern matching

Using pattern matching, you can define how events mutate the state with functions that return the new `AggregateState` instance.

For example:

```csharp
record BookingState : AggregateState<BookingState, BookingId> {
    decimal Price { get; init; }

    public override BookingState When(object @event)
        => @event switch {
            RoomBooked booked        => this with
                { Id = new BookingId(booked.BookingId), Price = booked.Price },
            BookingImported imported => this with
                { Id = new BookingId(imported.BookingId) },
            _                        => this
        };
}
```

##### Using explicit handlers

You can also use explicit event handlers, where you define one function per event, and register them in the constructor. In that case, there's no need to override the `When` function.

The syntax is similar to registered command handlers for the [application service]({{< ref "application" >}}):

```csharp
public record BookingState : AggregateState<BookingState, BookingId> {
    public BookingState() {
        On<RoomBooked>(
            (state, booked) => state with { 
                Id = new BookingId(booked.BookingId), 
                Price = booked.Price 
            }
        );

        On<BookingImported>(
            (state, imported) => state with { 
                Id = new BookingId(imported.BookingId) 
            }
        );

        On<BookingPaymentRegistered>(
            (state, paid) => state with {
                PaymentRecords = state.PaymentRecords.Add(
                    new PaymentRecord(paid.PaymentId, paid.AmountPaid)
                ),
                AmountPaid = paid.FullPaidAmount
            }
        );
    }

    decimal Price          { get; init; }
    decimal AmountPaid     { get; init; }

    ImmutableList<PaymentRecord> PaymentRecords { get; init; } =
        ImmutableList<PaymentRecord>.Empty;
}
```

{{% alert icon="👉" %}}
Always set the state `Id` property to the aggregate identity when handling events that happen first in the aggregate lifecycle. For example, the code above does it for `BookingImported` and `RoomBooked` events because either of them are the first events in the aggregate lifecycle.
{{%/ alert %}}

The default branch of the switch expression returns the current instance as it received an unknown event. You might decide to throw an exception there.

### Aggregate with typed identity

The last abstraction is `Aggregate<T, TId>`, where `T` is `AggregateState` and `TId` is the identity type. You can use it if you want to have a typed identity. We provide a small identity value object abstraction, which allows Eventuous to understand that it's indeed the aggregate identity.

#### Aggregate identity

Use the `AggregateId` abstract record, which needs a string value for its constructor:

```csharp
record BookingId : AggregateId {
    public BookingId(string id) : base(id) { }
}
```

The abstract record overrides its `ToString` to return the string value as-is. It also has an implicit conversion operator, which allows you to use a string value without explicitly instantiating the identity record. However, we still recommend instantiating the identity explicitly to benefit from type safety.

#### Aggregate state with typed identity

The aggregate with typed identity also uses the aggregate state with typed identity. It's because the identity value is a part of the aggregate state.

A typed state base class has its identity property built-in, so you don't need to do anything in addition. The `BookingState` example above uses the typed state and, therefore, is able to set the identity value when it gets it from the event.

As we know what the aggregate identity is when using aggregates with typed identity, the `GetId` function is implemented in the base class. Therefore, there are no more abstract methods to implement in derived classes.

Although the number of generic parameters for this version of the `Aggregate` base class comes to three, it is still the most useful one. It gives you type safety for the aggregate identity, and also nicely separates state from behaviour.

Example:

```csharp
class Booking : Aggregate<BookingState, BookingId> {
    public void BookRoom(
        BookingId id,
        string roomId,
        StayPeriod period,
        decimal price
    ) {
        EnsureDoesntExist();
        Apply(new RoomBooked(
            id, roomId, period.CheckIn, period.CheckOut, price
        ));
    }

    public void Import(BookingId id, string roomId, StayPeriod period) {
        Apply(new BookingImported(
            id, roomId, period.CheckIn, period.CheckOut
        ));
    }
}
```

## Aggregate factory

Eventuous needs to instantiate your aggregates when it loads them from the store. New instances are also created by the `ApplicationService` when handling a command that operates on a new aggregate. Normally, aggregate classes don't have dependencies, so it is possible to instantiate one by calling its default constructor. However, you might need to have a dependency or two, like a domain service. We advise providing such dependencies when calling the aggregate function from the application service, as an argument. But it's still possible to instruct Eventuous how to construct aggregates that don't have a default parameterless constructor. That's the purpose of the `AggregateFactory` and `AggregateFactoryRegistry`.

The `AggregateFactory` is a simple function:

```csharp
public delegate T AggregateFactory<out T>() where T : Aggregate;
```

The registry allows you to add custom factory for a particular aggregate type. The registry itself is a singleton, accessible by `AggregateFactoryRegistry.Instance`. You can register your custom factory by using the `CreateAggregateUsing<T>` method of the registry:

```csharp
AggregateFactoryRegistry.CreateAggregateUsing(() => new Booking(availabilityService));
```

By default, when there's no custom factory registered in the registry for a particular aggregate type, Eventuous will create new aggregate instances by using reflections. It will only work when the aggregate class has a parameterless constructor (it's provided by the `Aggregate` base class).

It's not a requirement to use the default factory registry singleton. Both `ApplicationService` and `AggregateStore` have an optional parameter that allows you to provide the registry as a dependency. When not provided, the default instance will be used. If you use a custom registry, you can add it to the DI container as singleton.

### Dependency injection

The aggregate factory can inject registered dependencies to aggregates when constructing them. For this to work, you need to tell Eventuous that the aggregate needs to be constructed using the container. To do so, use the `AddAggregate<T>` service collection extension:

```csharp
builder.Services.AddAggregate<Booking>();
builder.Services.AddAggregate<Payment>(
    sp => new Payment(sp.GetRequiredService<PaymentProcessor>, otherService)
);
```

When that's done, you also need to tell the host to use the registered factories:

```csharp
app.UseAggregateFactory();
```

These extensions are available in the `Eventuous.AspNetCore` (DI extensions and `IApplicationBuilder` extensions) and `Eventuous.AspNetCore.Web` (`IHost` extensions).
