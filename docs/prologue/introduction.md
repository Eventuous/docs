---
title: "Introduction"
description: >
    What is Eventuous and why you want to use it for implementing an event-sourced system with .NET or .NET Core?
sidebar_position: 1
---

## What is Eventuous?

Eventuous is a (relatively) lightweight library, which allows building production-grade applications using the [Event Sourcing](https://zimarev.com/blog/event-sourcing/introduction/) pattern.

The base library has a set of abstractions, following Domain-Driven Design tactical patterns, like `Aggregate`.

Additional components include:
- [Aggregate persistence](../persistence) using [EventStoreDB](https://eventstore.com)
- [Real-time subscriptions](../subscriptions) for EventStoreDB, RabbitMQ, and Google PubSub
- Extensive observability, including Open Telemetry support
- Integration with ASP.NET Core dependency injection, logging, and Web API
- [Producers](../producers) for EventStoreDB, RabbitMQ, Google PubSub, and Apache Kafka
- [Read model](../read-models) projections for MongoDB
- [Gateway](../gateway) for producing events to other services (Event-Driven Architecture support)

:::note
Eventuous is under active development and doesn't follow semantic versioning. We introduce changes often, according to immediate needs of its production users. The API hasn't reached a stable state  and can change at any time. A patch version update would normally not change the API, but the minor version cloud.
:::

### Packages

You can find all the NuGet packages by visiting the [Eventuous profile](https://www.nuget.org/profiles/Eventuous/).

| Package                               | What's it for                                                                              |
|---------------------------------------|--------------------------------------------------------------------------------------------|
| `Eventuous`                           | The umbrella package that includes the most user components                                |
| `Eventuous.Subscriptions`             | Subscriptions base library, including diagnostics and DI support                           |
| `Eventuous.Subscriptions.Polly`       | Support for retries in event handlers using [Polly](http://www.thepollyproject.org/)       |
| `Eventuous.Producers`                 | [Producers](../producers) base library, including diagnostics and DI support               |
| `Eventuous.Diagnostics`               | Diagnostics base library                                                                   |
| `Eventuous.Diagnostics.OpenTelemetry` | Diagnostics integration with [OpenTelemetry](https://opentelemetry.io/)                    |
| `Eventuous.Diagnostics.Logging`       | Eventuous internal logs adapter for ASP.NET Core logging                                   |
| `Eventuous.Gateway`                   | Eventuous [gateway](../gateway) for connecting subscriptions with producers                |
| `Eventuous.EventStore`                | Support for [EventStoreDB](https://eventstore.com) (event store, subscriptions, producers) |
| `Eventuous.RabbitMq`                  | Support for RabbitMQ (subscriptions, producers)                                            |
| `Eventuous.GooglePubSub`              | Support for Google PubSub (subscriptions, producers)                                       |
| `Eventuous.Kafka`                     | Support for Apache Kafka (producers)                                                       |
| `Eventuous.ElasticSearch`             | Support for Elasticsearch (producers, event store for archive purposes)                    |
| `Eventuous.Projections.MongoDB`       | Projections support for [MongoDB](https://www.mongodb.com/)                                |
| `Eventuous.AspNetCore`                | DI extensions for app services, aggregate factory, etc.                                    |
| `Eventuous.AspNetCore.Web`            | [HTTP API automation](../application/command-api) for app services                         |

## Go further - WIP

Read about [the right way](the-right-way) to understand how Eventuous embraces the original idea of Event Sourcing.

You can have a look at the sample project in a [separate repository](https://github.com/Eventuous/dotnet-sample).

