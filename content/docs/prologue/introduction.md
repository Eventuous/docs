---
title: "Introduction"
description: ""
date: 2021-03-10
images: []
weight: 100
---

## What is Eventuous

Eventuous is a (relatively) lightweight library, which allows building production-grade applications using the [Event Sourcing](https://zimarev.com/blog/event-sourcing/introduction/) pattern.

The base library has a set of abstractions, following Domain-Driven Design tactical patterns, like `Aggregate`.

Additional components include:
- [Aggregate persistence]({{< ref "aggregate-store" >}}) using [EventStoreDB](https://eventstore.com)
- [Real-time subscriptions]({{< ref "subs-concept" >}}) for EventStoreDB
- Read-model projections for MongoDB

{{< alert icon="👉" color="warning" >}}
Eventuous is in a highly volatile state as it changes according to immediate needs of its production users. The API is not stable and can change at any time.
{{< /alert  >}}

### Packages

Right now we publish four NuGet packages:

| Package | What's it for |
| ------- | ------------- |
| `Eventuous` | The core library. |
| `Eventuous.EventStoreDB` | [Persistence](../../persistence/) support for [EventStoreDB](https://eventstore.com) |
| `Eventuous.EventStoreDB.Subscriptions` | Real-time subscriptions support for EventStoreDB |
| `Eventuous.Projections.MongoDB` | Projections support for [MongoDB](https://www.mongodb.com/) |

### Quick Start - WIP

{{< alert icon="️☢️" >}}
The Quick Start is intended for intermediate to advanced users.
{{< /alert >}}

One page summary of how to start a new Doks project. [Quick Start →]({{< ref "quick-start" >}})

## Go further - WIP

Recipes, Reference Guides, Extensions, and Showcase.

