# Discord Profile Page

A cool little web app that shows your Discord profile, current activity, and more. Built with Bun and EJS.

---

## Requirements

This project depends on the following services to function properly:

### 1. Lanyard Backend

This project depends on a self-hosted or public [Lanyard](https://github.com/Phineas/lanyard) instance to fetch real-time Discord presence data.
Make sure the Lanyard instance is running and accessible before using this.

### 2. Redis Instance

A Redis-compatible key-value store is required to cache third-party data (e.g., SteamGridDB icons).
I recommend [Dragonfly](https://www.dragonflydb.io/), a high-performance drop-in replacement for Redis.

### 3. Badge API

A lightweight API to render Discord-style badges.
>Only needed if you want to show badges on profiles:
https://git.creations.works/creations/badgeAPI

### 4. SteamGridDB

>You only have to use this if you want to fetch game icons that Discord doesn’t provide:
https://www.steamgriddb.com/api/v2

---

## Getting Started

### 1. Clone & Install

```bash
git clone https://git.creations.works/creations/profilePage.git
cd profilePage
bun install
```

### 2. Configure Environment

Copy the example environment file and update it:

```bash
cp .env.example .env
```

#### `.env` Variables

| Variable              | Description                                                                 |
|-----------------------|-----------------------------------------------------------------------------|
| `HOST`                | Host to bind the Bun server (default: `0.0.0.0`)                            |
| `PORT`                | Port to run the server on (default: `8080`)                                 |
| `REDIS_URL`           | Redis connection string                                                     |
| `LANYARD_USER_ID`     | Your Discord user ID, for the default page                                  |
| `LANYARD_INSTANCE`    | Endpoint of the Lanyard instance                                            |
| `BADGE_API_URL`       | Badge API URL ([badgeAPI](https://git.creations.works/creations/badgeAPI))  |
| `STEAMGRIDDB_API_KEY` | SteamGridDB API key for fetching game icons                                 |

#### Optional Lanyard KV Variables (per-user customization)

These can be defined in Lanyard's KV store to customize the page:

| Variable  | Description                                                        |
|-----------|--------------------------------------------------------------------|
| `snow`    | Enables snow background (`true` / `false`)                         |
| `rain`    | Enables rain background (`true` / `false`)                         |
| `stars`   | Enables starfield background (`true` / `false`)                    |
| `badges`  | Enables badge fetching (`true` / `false`)                          |
| `readme`  | URL to a README displayed on the profile (`.md` or `.html`)        |
| `colors`  | Enables avatar-based color theming (uses `node-vibrant`)           |

---

### 3. Start the Instance

```bash
bun run start
```

---

## Docker Support

### Build & Start with Docker Compose

```bash
docker compose up -d --build
```

Make sure the `.env` file is configured correctly before starting the container.

---

## License

[MIT](/LICENSE)
