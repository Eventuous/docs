---
title: "Concept"
description: "What's an event gateway and why is it useful?"
weight: 10
---

An event gateway is an engine to bridge Event Sourcing with Event-Driven Architecture (EDA). When you store events to an [event store]({{< ref "event-store" >}}), you can use an event gateway to receive stored events, transform them, and distribute downstream using different transport.

Scenarios where an event gateway is useful:
* Publish transformed domain events as integration events using a broker
* Scale out projections using a partitioned, event-based broker, such as Kafka, Amazon Kinesis, Google PubSub or Azure Event Hub
* Backup or archive domain events in another event store or time-series database
* Send events to an analytics store or service

## How a gateway works

A gateway needs three components that form a gateway event pipeline:
* [Subscription]({{< ref "subs-concept" >}}) to the source event store
* Transformation function that can also be used as a filter
* Producer to a broker, another event store, or a database
