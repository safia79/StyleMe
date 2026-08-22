# StyleME — Database Schema

This document describes the SQLite tables used by StyleME.
Field names are **final**. No columns have been added or renamed since the original schema.

The database file is created locally by Prisma at `backend/prisma/dev.db`.
No cloud account is required.

---

## users

Stores each StyleME account.

| Field | Type | Notes |
| --- | --- | --- |
| id | Integer | Primary key, auto-increment |
| name | Text | Display name |
| email | Text | Unique login email (stored lowercase) |
| passwordHash | Text | bcrypt hash of the password (never store the raw password) |
| city | Text | Used for weather on Recommendations. Optional on the Register form; stored as `""` if left blank |
| accountType | Text | `free` or `premium`. Default: `free` |
| createdAt | Date/time | Set automatically when the row is created |

Relations: one user can have many wardrobe items, saved outfits, and subscriptions.

---

## wardrobe_items

One row per clothing item a user has uploaded.

| Field | Type | Notes |
| --- | --- | --- |
| id | Integer | Primary key, auto-increment |
| userId | Integer | Foreign key → users.id |
| imageUrl | Text | Path of the photo (files live in `backend/uploads`, e.g. `/uploads/1-123.png`) |
| category | Text | See allowed values below |
| colour | Text | See allowed values below |
| style | Text | See allowed values below |
| formality | Text | See allowed values below |
| season | Text | See allowed values below |
| isFavourite | Boolean | Default: false |
| wearCount | Integer | Default: 0 (**not used in the UI yet**) |
| uploadDate | Date/time | Set automatically when the row is created |

If a user is deleted, their wardrobe items are deleted too (cascade).

Allowed tag values (enforced in the app, not as extra database columns):

- **category:** Top, Bottom, Dress, Outerwear, Shoes, Accessory
- **colour:** Black, White, Grey, Navy, Blue, Red, Pink, Green, Beige, Brown, Yellow, Purple, Orange
- **style:** Casual, Formal, Sporty, Streetwear
- **formality:** Casual, Smart-Casual, Formal
- **season:** Summer, Winter, Spring, Autumn, All-season

---

## saved_outfits

Outfits a user has saved (a named combination of wardrobe items).

| Field | Type | Notes |
| --- | --- | --- |
| id | Integer | Primary key, auto-increment |
| userId | Integer | Foreign key → users.id |
| name | Text | Outfit name |
| occasionTag | Text | Occasion label (e.g. Casual, Work, Custom, Any) |
| itemIds | JSON | Array of `wardrobe_items` ids, e.g. `[1, 4, 7]` |
| createdAt | Date/time | Set automatically when the row is created |
| wornCount | Integer | Default: 0 (**not used in the UI yet**) |

If a user is deleted, their saved outfits are deleted too (cascade).

---

## subscriptions

Premium plan records for a user. **This table is unused so far** (no payment FR yet).

| Field | Type | Notes |
| --- | --- | --- |
| id | Integer | Primary key, auto-increment |
| userId | Integer | Foreign key → users.id |
| customerRef | Text | Reference id for the (mocked) payment customer |
| expiryDate | Date/time | When the current plan ends |
| planStatus | Text | e.g. active, expired, cancelled |

If a user is deleted, their subscription rows are deleted too (cascade).

---

## Prisma models vs table names

Prisma uses PascalCase model names in code. The real SQLite table names are:

- `User` → `users`
- `WardrobeItem` → `wardrobe_items`
- `SavedOutfit` → `saved_outfits`
- `Subscription` → `subscriptions`

The **field names** in code match the columns above exactly. Relation fields such as `wardrobeItems` are Prisma helpers, not extra database columns.
