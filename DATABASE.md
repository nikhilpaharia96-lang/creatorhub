# Database Migration Guide

CreatorHub uses Prisma Migrate against PostgreSQL. Schema lives at
`backend/prisma/schema.prisma`.

## First-time setup

```bash
cd backend
npx prisma generate          # generates the typed Prisma Client
npx prisma migrate dev --name init
```

This creates the initial migration and applies it to your local database.

## Creating a new migration

After editing `schema.prisma`:

```bash
npx prisma migrate dev --name describe_your_change
```

## Applying migrations in production

```bash
npx prisma migrate deploy
```

`migrate deploy` only applies pending migrations -- it never generates new
ones and never resets data.

## Inspecting the database

```bash
npx prisma studio     # opens a local GUI at http://localhost:5555
```

## Current schema overview

| Model | Purpose |
|---|---|
| User | Customers and admins (role-based) |
| Product | Digital products for sale |
| Order / OrderItem | Purchases, including subtotal/discount/coupon linkage |
| Coupon | Discount codes |
| Entitlement | Per-user, per-product download access (count + expiry) |
| WishlistItem | Saved-for-later products |

## Rollback strategy

Prisma Migrate does not have an automated "down" migration by default.
To roll back:
1. Identify the last-known-good migration.
2. Write a new forward migration that reverses the change, or
3. For emergencies: restore from a database backup taken before the migration ran.

There is currently no automated backup step in this repository -- set
this up at the infrastructure/hosting layer before running migrations
against production data.
