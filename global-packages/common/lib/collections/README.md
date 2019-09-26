## Schema

Users enter topics into the application. These are one word or short phrases
that the user is interested in. These are called "Identifications" in our
schema, and are sometimes referred to as IDs, not to be confused with
database IDs.

A user's session starts from their "root" `Identification`. Every
`Identification` is always linked to a parent (except the root). These links
are tracked in the `Links` collection. It simply contains a copy of the
`source` and `target` identifications.

Whenever we write changes to the `Identifications` collection, we copy those
changes to the `Links` collection. `Links` contains a full copy of the
document from `Identifications` and so it must be kept up to date.

After users enter some topics they are interested in, they can then try to
match with other users. They can choose topics from other users which they
also find interesting. In this way they find "intersections" between their
interests and the interests of other participants. These crossovers are
tracked in the `Meta` collection. This collection is kept up to date every
time the `Identifications` collection is updated. If the same `name` value is
used in multiple documents in the `Identifications`collection then they are
linked in `Meta`. Each unique combination of a `name` and training ID results
in a single document in `Meta`.
