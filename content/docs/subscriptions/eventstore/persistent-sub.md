---
title: "Persistent subscription"
date: 2021-04-28
images: []
description: >
  Subscribe to events from a single stream, using a server-managed subscription.
weight: 30
---

{{% alert icon="⁉️" title="Ordered events" color="warning" %}}
EventStoreDB persistent subscriptions do not guarantee ordered event processing. Therefore, we only recommend using them for integration purposes (reactions).
{{%/ alert %}}


