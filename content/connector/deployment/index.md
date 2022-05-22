---
title: "Configuration and deployment"
description: "How to configure and deploy Eventuous Connector"
weight: 105
type: docs
---

Eventuous Connector with EventStoreDB source needs to be hosted as a continuously running service because it must maintain a realtime gRPC subscription. When you deploy a projector, it can be deployed as a sidecar for the connector, or as a standalone service. It could be possible to deploy it as a serverless workload if the serverless solution supports gRPC streaming.


