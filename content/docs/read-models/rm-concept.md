---
title: "Concept"
description: "The concept of read models"
weight: 620
---

## Queries in event-sourced systems

As described [previously]({{< ref "aggregate" >}}), the domain model is using [events]({{< ref "domain-events" >}}) as the _source of truth_. These events represent individual and atomic state transitions of the system. We add events to [event store]({{< ref "event-store" >}}) one by one, in append-only fashion. When restoring the state of an aggregate, we read all the events from a single stream, and apply those events to the aggregate state. When all events are applied, the state is fully restored. This process takes nanoseconds to complete, so it's not really a burden.

However, when all you have in your database is events, you can hardly query the system state for more than one object at a time. The only query that the event store supports is to get one event stream using the aggregate id. In many cases, though, we need to query using some other attribute of the aggregate state, and we expect more than one result. Many see it as a major downside of Event Sourcing, but, in fact, it's not a big problem.

When building an event-sourced system, after some initial focus on the domain model and its behaviour, you start to work on queries that provide things like lists of objects via an API, so the UI can display them. There you need to write queries, and that's where the idea of CQRS comes in.

## CQRS (do you mean "cars"?)

The term CQRS was coined more than a decade ago by [Greg Young](https://twitter.com/gregyoung), who also established a lot of practices of Event Sourcing as implemented by Eventuous.

{{% alert icon="👉" %}}
**CQRS** stands for **C**ommand-**Q**uery **R**esponsibility **S**egregation.
{{%/ alert %}}

The concept can be traced back in time to a separation between operational and reporting store:

> [The main] database supports operational updates of the application's state, and also various reports used for decision support and analysis.
> The operational needs and the reporting needs are, however, often quite different - with different requirements from a schema and different data access patterns. When this happens it's often a wise idea to separate the reporting needs into a reporting database...
> 
> [ReportingDatabase](https://martinfowler.com/bliki/ReportingDatabase.html) - Martin Fowler's bliki

Greg argues that it's not a requirement to separate two databases, but it's a good idea to at least understand that the need for transactional updates requires a different approach compared with reporting needs. Say, you use something like EntityFramework to persist your domain entities state. Although it works quite well, it's not a good idea to use it for reporting purposes. You'd be limited to reach the data using EntityFramework's DbContext, when in reality you'd want to make more direct queries, joining different tables, etc.

{{< alert icon="🙄" >}}
Where "did you mean CARS?" comes from? When CQRS wasn't as popular term, Google search assumed you made a mistake and proposed to search for "cars" instead.
{{< /alert >}}

### CQRS and Event Sourcing

In real life, CQRS in event-sourced system means that you will have to separate the operation and the reporting stores. It's because querying the state of a single aggregate is not the only query you'd like to do. You might want to query across multiple aggregates, or across different aggregate types. In addition, you don't always need to return the full aggregate state, but only a subset of it.

That's where read models come in. Read models are _projections_ of the system state, which are built based on the query needs. Therefore, we sometime reference them as _views_, or _query models_. You'd normally use some other database than your event store database for storing read models, and that database needs to support rich indexing and querying.

## Benefits of read models

In state-based systems you normally have access to the state of your domain object in a very optimised, normalised schema. When executing a query over a normalised database, you'd often need to build a comprehensive set of joins across multiple tables or collections, so you can get all the required information in one go. That approach is not always optimal. Let's say you want to display a widget that shows the number of reservations made for a give hotel during the last 30 days. You'd need to run a count query across the reservations table, and then a join across the hotels table to get the hotel name.

Now imagine all the reservations made are represented as events. By _projecting_ those events to a read model that just calculates the number of reservations made for the last 30 days per hotel, you can get the same result in a much more efficient way. When you have a read model, you can do the same query in a single query, without the need to build joins. You'd just need to run a query against the read model, and it would return the required information in a single query, just using the hotel id as a single query argument.

You could see this approach as a denormalisation of an operational database schema. However, it's not the only thing that happens. When building read models, you are no longer bound to the primary key of the aggregate that emit state transitions. You can use another attribute as the primary key, or even a composite key. For example, with the number of reservations of a hotel, you could use the hotel id and the date of the reservation as the read model primary key.

The point here is that when building read models, you'd normally start designing them based on the needs of the query, not the needs of the database schema. The query needs most often come from the user interface requirements for data visualisations, which are often orthogonal to the operational needs of the domain model. Read model allow you to find a balance between operational and reporting needs without sacrificing the explicitness of the model for the richness and effectiveness of the query model.

Here are some examples of the read models that can be built for a given domain model:
- My reservations (per guest)
- My past stays (per guest)
- My upcoming stays (per guest)
- Upcoming arrivals (per hotel)
- Cancellations for the last three months (per hotel)

Built as read models, all those queries can be run in a single query, without the need to build joins over multiple tables and potentially thousands of rows or documents.
