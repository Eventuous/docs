---
title: "Release 0.6.0"
author: Alexey Zimarev
date: 2022-02-21
description: >
  Full rewrite of subscriptions, traces, etc
---

The main changes are:
- Full subscriptions rewrite with [new architecture]({{< ref "pipes" >}})
- Telemetry improvements for subscriptions
- A new package to support retries in subscriptions with Polly
- Allow to use a gateway transformation class instead of a simple function

Release on [GitHub](https://github.com/Eventuous/eventuous/releases/tag/0.6.0).
