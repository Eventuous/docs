---
title: "Release 0.2.0"
date: 2021-04-29
author: Alexey Zimarev
description: >
  Subscriptions core, producers, RabbitMQ and Google PubSub support, persistent subscriptions for EventStoreDB.
---

Eventuous 0.2.0 introduces more messaging bits, and for that implements the concept of [Producers]({{< ref "producers" >}}) in addition to subscriptions.

The first producer to implement was the one for EventStoreDB. Although it's not always a good idea to use the database as a broker, it might be useful in PoC stages to get better understanding how the events look like, and how the whole system works.

New transports came by: Google PubSub and RabbitMQ. Don't be surprised by the choice, Eventuous was and always will be driven by use, so I am adding the transports we are currently use in production.
