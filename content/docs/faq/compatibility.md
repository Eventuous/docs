---
title: "Compatibility"
description: "Platforms and SDKs"
weight: 920
---

## Only .NET 5+? Why not .NET Framework 3.5?

Eventuous uses the latest features of C#, like records and advanced pattern matching. Therefore, we rely on compiler versions, which support C# 9.

We also aim to support the current application hosting model that only got consistent and stable in .NET 5.

Eventuous supports .NET Core 3.1, but it's not a priority. Some packages only support .NET 6 as they need the latest features like minimal API. Right now, Eventuous provides packages for the following runtimes:

- .NET Core 3.1
- .NET 5
- .NET 6

Targets will be added and removed when getting our of support or when new versions get released.

