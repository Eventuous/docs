---
title: "Breaking change - Subscriptions"
description: "Breaking change in Subscriptions namespaces"
description: "Breaking change in Subscriptions namespaces"
date: 2021-04-20
lastmod: 2021-04-20
draft: false
contributors: ["Alexey Zimarev"]
---

The latest 0.1.2 alpha versions got a new structure of packages, which are related to subscriptions.

- New package `Eventuous.Subscriptions` - a foundation for subscription services, which opens doors to support other message delivery infrastructure, like brokers.
- Renamed package `Eventuous.Subscriptions.EventStoreDB`, which replaces `Eventuous.EventStoreDB.Subscriptions`. Renaming the package (and its namespace) was necessary to align with the new base package name.
