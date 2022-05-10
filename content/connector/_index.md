---
title: "Eventuous Connectors"
linkTitle: "Connectors"
menu: {main: {weight: 20}}
type: docs
---

Eventuous Connector allow subscribing to events from a source subscription and produce derived events to another system (sink), as well as execute reduce-like operations that work as [projections]({{< ref "rm-concept" >}}).

Right now, the only source that is built-in to the Connector application is the EventStoreDB source. You can, however, build a custom connector using another Eventuous subscription type, or your own subscription implementation.

{{% alert icon="🧑🏽‍💻" %}}
Eventuous Connector is a pre-built ready-to-use application. You can find its source code, which include the code for all the provided sinks, in the [GitHub repository](https://github.com/Eventuous/connectors).
{{% /alert %}}
