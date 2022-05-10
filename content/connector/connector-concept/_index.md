---
title: "Connector concept"
description: "Connector concept"
weight: 100
type: docs
---

Eventuous connectors allow subscribing to events from EventStoreDB (source) and produce derived events to another system (sink). Some sinks also support reduce-like operations that work as [projections]({{< ref "rm-concept" >}}).

The Connector is a combination of a real-time subscription (currently only to `$all` stream) and a sink. A sink can be configured to produce (producer mode) or to project (projector mode) events. Some sinks support both modes, some only support one.
