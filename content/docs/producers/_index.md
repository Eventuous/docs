---
title: "Producers"
description: "Message producers"
weight: 700
---

Producers, along with [Subscriptions]({{< ref "subs-concept" >}}), are the foundation of the Eventuous' messaging system.

## Concept

Although an [event store]({{< ref "event-store" >}}) produces events too, it is normally used via the [Aggregate store]({{< ref "aggregate-store" >}}). Sometimes, you just need to produce arbitrary messages, which aren't necessarily events. For example, you can also produce commands. Still, the main purpose of a producer is to put events to an event database or a broker, so they can be consumed by a subscription.

Within Eventuous, the main purpose of producers is to support [gateways]({{< ref "gateway" >}}), and, through gateways, enable creation of [connectors]({{< ref "connector" >}}).
