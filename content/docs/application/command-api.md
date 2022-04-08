---
title: "Command API"
description: "Auto-generated HTTP API for command handling"
weight: 430
toc: true
---

## Generated command API

Eventuous can use your application service to generate a command API. Such an API will accept JSON models matching the application service command contracts, and pass those commands as-is to the application service. This feature removes the need to create API endpoints manually using controllers or .NET minimal API. 

{{% alert icon="👉" %}}
In fact, the auto-HTTP endpoint feature uses the .NET minimal API feature, so it is only available for .NET 6 and higher.
{{%/ alert %}}

To use generated APIs, you need to add `Eventuous.AspNetCore.Web` package.

All the auto-generated API endpoints will use the `POST` HTTP method.

### Annotating commands

For Eventuous to understand what commands need to be exposed as API endpoints and on what routes, those commands need to be annotated by the `HttpCommand` attribute:

```csharp
[HttpCommand(Route = "payment", Aggregate = typeof(Booking))]
public record ProcessPayment(string BookingId, float PaidAmount);
```

You can skip the `Route` property, in that case Eventuous will use the command class name. For the example above the generated route would be `processPayment`. We recommend specifying the route explicitly as you might refactor the command class and give it a different name, and it will break your API if the route is auto-generated.

If your application has a single application service working with a single aggregate type, you don't need to specify the aggregate type, and then use a different command registration method (described below).

Another way to specify the aggregate type for a group of commands is to annotate the parent class (command container):

```csharp
[AggregateCommands(typeof(Booking))]
public static class BookingCommands {
    [HttpCommand(Route = "payment")]
    public record ProcessPayment(string BookingId, float PaidAmount);
}
```

In such case, Eventuous will treat all the commands defined inside the `BookingCommands` static class as commands operating on the `Booking` aggregate.

Also, you don't need to specify the aggregate type in the command annotation if you use the `MapAggregateCommands` registration (see below).

Finally, you don't need to annotate the command at all if you use the explicit command registration with the route parameter.

### Registering commands

There are several extensions for `IEndpointRouteBuilder` that allow you to register HTTP endpoints for one or more commands.

#### Single command

The simplest way to register a single command is to make it explicitly in the bootstrap code:

```csharp
var builder = WebApplication.CreateBuilder();

builder.Services.AddApplicationService<BookingService, Booking>();

builder.MapCommand<ProcessPayment, Booking>("payment");

var app = builder.Build();
app.Run();

record ProcessPayment(string BookingId, float PaidAmount);
```

If you annotate the command with the `HttpCommand` attribute, and specify the route, you can avoid providing the route when registering the command:

```csharp
builder.MapCommand<BookingCommand, Booking>();
...

[HttpCommand(Route = "payment")]
public record ProcessPayment(string BookingId, float PaidAmount);
```

#### Multiple commands for an aggregate

You can also register multiple commands for the same aggregate type, without a need to provide the aggregate type in the command annotation. To do that, use the extension that will create an `ApplicationServiceRouteBuilder`, then register commands using that builder:

```csharp
builder
    .MapAggregateCommands<Booking>()
    .MapCommand<ProcessPayment>()
    .MapCommand<ApplyDiscount>("discount");
    
...

// route specified in the annotation
[HttpCommand(Route = "payment")] 
public record ProcessPayment(string BookingId, float PaidAmount);

// No annotation needed
public record ApplyDiscount(string BookingId, float Discount);
```

#### Discover commands

There are two extensions that are able to scan your application for annotated commands, and register them automatically.

First, the `MapDiscoveredCommand<TAggregate>`, which assumes your application only serves commands for a single aggregate type:

```csharp
builder.MapDiscoveredCommands<Booking>();

...
[HttpCommand(Route = "payment")] 
record ProcessPayment(string BookingId, float PaidAmount);
```

For it to work, all the commands must be annotated and have the route defined in the annotation.

The second extension will discover all the annotated commands, which need to have an association with the aggregate type by using the `Aggregate` argument of the attribute, or by using the `AggregateCommands` attribute on the container class (described above):

```csharp
builder.MapDiscoveredCommands();

...

[HttpCommand(Route = "bookings/payment", Aggregate = typeof(Booking))] 
record ProcessPayment(string BookingId, float PaidAmount);

[AggregateCommands(typeof(Payment))]
class V1.PaymentCommands {
    [HttpCommand(Route = "payments/register")]
    public record RegisterPayment(string PaymentId, string Provider, float Amount);
    
    [HttpCommand(Route = "payments/refund")]
    public record RefundPayment(string PaymentId);
}
```

Both extensions will scan the current assembly by default, but you can also provide a list of assemblies to scan as an argument:

```csharp
builder.MapDiscoveredCommands(typeof(V1.PaymentCommands).Assembly);
```
