---
title: "Connector concept"
description: "What is Eventuous Connector and how to use it"
weight: 100
type: docs
---

Eventuous connectors allow subscribing to events from EventStoreDB (source) and produce derived events to another system (sink). Some sinks also support reduce-like operations that work as [projections]({{< ref "rm-concept" >}}).

The Connector is a combination of a real-time subscription (currently only to `$all` stream) and a sink. A sink can be configured to produce (producer mode) or to project (projector mode) events. Some sinks support both modes, some only support one.

Currently, the following sinks are supported:

| Sink                                                         | Supported modes     |
|:-------------------------------------------------------------|:--------------------|
| [Elasticsearch]({{< ref "elastic-target" >}})                | producer, projector |
| [MongoDB]({{< ref "mongo-target" >}})                        | projector           |
| [MS SQL Server or Azure SQL]({{< ref "sqlserver-target" >}}) | projector           |

{{% alert icon="👉" %}}
Because the Connector uses all the features of Eventuous, it is able to execute both produce and project
operations in parallel using the [partitioning filter]({{< ref "pipes#partitioning-filter" >}}). The only
partition key supported right now is the **stream name**. In addition, each sink is fully instrumented for
observability with traces and metrics.
{{% /alert %}}

## Connector modes

Below, you can find a description of the different modes that are supported by the connectors.

### Producer mode

In _producer_ mode, the connector subscribes to the source and produces events to the sink. How events will
look like on the other side depends on the sink implementation.

The producer mode is most useful for the purpose of re-publishing domain events to a broker, or to be used as
an archive or backup. For example, the Elasticsearch sink can be used in combination with
the [archive event store]({{< ref "aggregate-store#multi-tier-store" >}}) to keep archived events in a cheaper
persistence tier, whilst keeping the EventStoreDB database size contained.

When used in combination with a message bus sink, the connector can be used to publish integration events for
other services to consume. However, right now the connector lacks the transformation capabilities, so we don't
recommend using it in this way when the connector is deployed as-is. However, you can
still [build a custom connector]({{< ref "custom-connector" >}}) for that purpose.

### Projector mode

The _projector_ mode allows to implement projections that are built using other stacks than .NET. Basically,
the projector mode implements the [MapReduce](https://en.wikipedia.org/wiki/MapReduce) pattern. Using a
projector you can reduce events to a single piece of state using some unique key.

Because the reduce function requires custom implementation, Eventuous Connector needs to call some custom code
that will get events and send the reduce function back. That custom code can be completely stateless and,
therefore, can execute in parallel, although the Connector will maintain ordered event processing.

The only mode that the connector is able to execute such custom code at this moment is by using an external
gRPC service with bidirectional streaming. The connector will send events to the gRPC service and the gRPC
service will send the reduce function back. Each projector sink implementation requires using its own reduce
functions set. With this model, the external gRPC service implements a gRPC server, and the connector will
connect to it as a client.

{{< imgproc connector-grpc-concept.png Fill "900x313" >}}
Using a gRPC service for reduce functions
{{< /imgproc >}}

A custom gRPC service can be built in any language or stack that supports gRPC. You'd normally deploy it as a
sidecar for the Connector pod in Kubernetes or a serverless workload.

For example, a MongoDB projector will expect to get operations line `IndexOne` or `UpdateOne` back from the
gRPC service, and SQL Server projector uses a single operation that returns an arbitrary SQL statement based
on event data.

{{< imgproc connector-sql-projector.png Fill "900x322" >}}
Example: SQL Server projector sidecar
{{< /imgproc >}}

The Connector role here is to maintain the subscription to EventStoreDB, send events to the gRPC service,
receive the reduce function back, execute the response, and maintain the checkpoint. By convention, each sink
uses its database for checkpointing.

As a result, it's possible to build a stack-agnostic stateless projector and use the Connector to do the heavy
lifting. Each sink also provides observability instrumentation for the database client library it uses.

Refer to the specific connector documentation page for more information.

