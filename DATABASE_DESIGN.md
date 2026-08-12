This document outlines the complete relational database schema for **MyProdigy**, designed for PostgreSQL. This architecture normalizes data for atomic transactions, tracks personal vs. shared inventories, and lays the groundwork for the core gameplay loop (solo/joint sessions, pet decay, and geographical progression).

*Note: Ephemeral state like "Waiting Room" status and "Presence Pokes" will be handled in-memory by the Go WebSocket Hub and do not require database persistence.*

---

## 1. `users`
Handles standard authentication, profile data, and the personal wallets where solo session loot goes first. Players can choose to hoard these resources or leave them on the porch.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID` | Primary Key |
| `email` | `VARCHAR(255)` | Unique identifier |
| `password_hash` | `VARCHAR(255)` | For authentication |
| `display_name` | `VARCHAR(50)` | User's chosen name |
| `personal_wood` | `INT` | Wood kept for themselves (Default: 0) |
| `personal_stone` | `INT` | Stone kept for themselves (Default: 0) |
| `personal_coins` | `INT` | Coins kept for themselves (Default: 0) |
| `created_at` | `TIMESTAMP` | Account creation date |

---

## 2. `partnerships` (The Couple)
This is the central "hub" entity. It joins two users and holds their shared state, including the pooled inventory and their current progress in the world.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID` | Primary Key |
| `user1_id` | `UUID` | Foreign Key (`users.id`) |
| `user2_id` | `UUID` | Foreign Key (`users.id`) |
| `shared_wood` | `INT` | Total pooled wood (Default: 0) |
| `shared_stone` | `INT` | Total pooled stone (Default: 0) |
| `shared_coins` | `INT` | Total pooled coins (Default: 0) |
| `current_city_id` | `INT` | Foreign Key (`cities.id`) |
| `created_at` | `TIMESTAMP` | When the partnership was formed |

---

## 3. `porch_dropoffs` (Asynchronous Love)
When a user chooses to "leave it on the porch" after a solo session, resources are deducted from their personal wallet and stored here. When the partner clicks "Collect," an atomic database transaction moves these into the `partnerships` shared inventory.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID` | Primary Key |
| `partnership_id` | `UUID` | Foreign Key (`partnerships.id`) |
| `sender_user_id` | `UUID` | Foreign Key (`users.id`) |
| `wood_amount` | `INT` | Amount gifted to the shared pool |
| `stone_amount` | `INT` | Amount gifted to the shared pool |
| `coin_amount` | `INT` | Amount gifted to the shared pool |
| `note` | `TEXT` | Affectionate message attached to the loot |
| `status` | `VARCHAR(20)` | Enum: `PENDING`, `COLLECTED` |
| `created_at` | `TIMESTAMP` | When the session ended and gift was left |
| `collected_at` | `TIMESTAMP` | Nullable; when it was moved to shared |

---

## 4. `pets` (Tamagotchi Mechanics)
Separated from the partnership to easily track specific decay mechanics and states via a chron job or Go worker.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID` | Primary Key |
| `partnership_id` | `UUID` | Foreign Key (`partnerships.id`), Unique |
| `name` | `VARCHAR(50)` | Pet's name |
| `health` | `INT` | 0-100 scale; decays over time |
| `status` | `VARCHAR(20)` | Enum: `HEALTHY`, `SICK`, `RUNAWAY` |
| `last_joint_session`| `TIMESTAMP` | Used to calculate health decay based on neglect |

---

## 5. `cities` (Static Catalog / Progression)
A master table defining the progression roadmap (Hometown -> Rome -> Tokyo, etc.) and linking to real-world weather.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `INT` | Primary Key (e.g., 1=Hometown, 2=Rome) |
| `name` | `VARCHAR(100)` | City name (e.g., "Zurich", "Singapore") |
| `weather_code` | `VARCHAR(50)` | Real-world location code for the weather API |
| `cost_wood` | `INT` | Wood required to relocate here |
| `cost_stone` | `INT` | Stone required to relocate here |
| `cost_coins` | `INT` | Coins required to relocate here |
| `tier` | `INT` | Progression difficulty ranking |

---

## 6. `houses`
Tracks the visual tier/upgrade level of the couple's home within specific cities. A couple might have a Tier 3 home in their Hometown but only a Tier 1 apartment in New York City.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID` | Primary Key |
| `partnership_id` | `UUID` | Foreign Key (`partnerships.id`) |
| `city_id` | `INT` | Foreign Key (`cities.id`) |
| `upgrade_tier` | `INT` | Current level of the house in this specific city (Default: 1) |

---

## 7. `focus_sessions` (Activity Log)
An append-only log of all timers. This is crucial for analytics, debugging desyncs, issuing resource payouts, and tracking "Rescue Missions."

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID` | Primary Key |
| `partnership_id` | `UUID` | Foreign Key (`partnerships.id`) |
| `user_id` | `UUID` | Nullable (NULL if JOINT/RESCUE, populated if SOLO) |
| `session_type` | `VARCHAR(20)` | Enum: `SOLO`, `JOINT`, `RESCUE` |
| `duration_mins` | `INT` | Completed duration of the timer |
| `status` | `VARCHAR(20)` | Enum: `COMPLETED`, `ABORTED` |
| `started_at` | `TIMESTAMP` | Start time |
| `ended_at` | `TIMESTAMP` | End time |
