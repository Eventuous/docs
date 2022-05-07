---
title: "Introduction"
description: >
    What is Eventuous and why you want to use it for implementing an event-sourced system with .NET or .NET Core?
weight: 100
---

## What is Eventuous?

Eventuous is a (relatively) lightweight library, which allows building production-grade applications using the [Event Sourcing](https://zimarev.com/blog/event-sourcing/introduction/) pattern.

The base library has a set of abstractions, following Domain-Driven Design tactical patterns, like `Aggregate`.

Additional components include:
- [Aggregate persistence]({{< ref "aggregate-store" >}}) using [EventStoreDB](https://eventstore.com)
- [Real-time subscriptions]({{< ref "subs-concept" >}}) for EventStoreDB, RabbitMQ, and Google PubSub
- Extensive observability, including Open Telemetry support
- Integration with ASP.NET Core dependency injection, logging, and Web API
- [Producers]({{< ref "producers" >}}) for EventStoreDB, RabbitMQ, Google PubSub, and Apache Kafka
- [Read model]({{< ref "read-models" >}}) projections for MongoDB
- [Gateway]({{< ref "gateway" >}}) for producing events to other services (Event-Driven Architecture support)

{{< alert icon="👉" color="warning" >}}
Eventuous is under active development and doesn't follow semantic versioning. We introduce changes often, according to immediate needs of its production users. The API hasn't reached a stable state  and can change at any time. A patch version update would normally not change the API, but the minor version cloud.
{{< /alert  >}}

### Packages

You can find all the NuGet packages by visiting the [Eventuous profile](https://www.nuget.org/profiles/Eventuous/).

| Package                               | What's it for                                                                              |
|---------------------------------------|--------------------------------------------------------------------------------------------|
| `Eventuous`                           | The core library                                                                           |
| `Eventuous.Subscriptions`             | Subscriptions base library, including diagnostics and DI support                           |
| `Eventuous.Subscriptions.Polly`       | Support for retries in event handlers using [Polly](http://www.thepollyproject.org/)       |
| `Eventuous.Producers`                 | Producers base library, including diagnostics and DI support                               |
| `Eventuous.Diagnostics`               | Diagnostics base library                                                                   |
| `Eventuous.Diagnostics.OpenTelemetry` | Diagnostics integration with [OpenTelemetry](https://opentelemetry.io/)                    |
| `Eventuous.Diagnostics.Logging`       | Eventuous internal logs adapter for ASP.NET Core logging                                   |
| `Eventuous.Gateway`                   | Eventuous [gateway]({{< ref "gateway" >}}) for connecting subscriptions with producers     |
| `Eventuous.EventStore`                | Support for [EventStoreDB](https://eventstore.com) (event store, subscriptions, producers) |
| `Eventuous.RabbitMq`                  | Support for RabbitMQ (subscriptions, producers)                                            |
| `Eventuous.GooglePubSub`              | Support for Google PubSub (subscriptions, producers)                                       |
| `Eventuous.Kafka`                     | Support for Apache Kafka (producers)                                                       |
| `Eventuous.ElasticSearch`             | Support for Elasticsearch (producers, event store for archive purposes)                    |
| `Eventuous.Projections.MongoDB`       | Projections support for [MongoDB](https://www.mongodb.com/)                                |
| `Eventuous.AspNetCore`                | DI extensions for app services, aggregate factory, etc.                                    |
| `Eventuous.AspNetCore.Web`            | [HTTP API automation]({{< ref "command-api" >}}) for app services                          |

[//]: # (### Quick Start - WIP)

[//]: # ()
[//]: # ({{< alert icon="️☢️" >}})

[//]: # (The Quick Start is intended for intermediate to advanced users.)

[//]: # ({{< /alert >}})

## Go further - WIP

Read about [the right way]({{< ref "the-right-way" >}}) to understand how Eventuous embraces the original idea of Event Sourcing.

You can have a look at the sample project in a [separate repository](https://github.com/Eventuous/dotnet-sample).

