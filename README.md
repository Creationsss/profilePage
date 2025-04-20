# Discord Profile Page

A cool little web app that shows your Discord profile, current activity, and more. Built with Bun and EJS.

## Requirements

This project relies on the following services to function correctly:

### 1. Lanyard Backend

This project depends on a self-hosted or public [Lanyard](https://github.com/Phineas/lanyard) instance for Discord presence data.
Make sure Lanyard is running and accessible before using this profile page.

### 2. Redis Instance

A Redis-compatible key-value store is required for caching third-party data (e.g., SteamGridDB icons).
We recommend using [Dragonfly](https://www.dragonflydb.io/) as a high-performance drop-in replacement for Redis.

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

#### Required `.env` Variables

| Variable           | Description                                      |
|--------------------|--------------------------------------------------|
| `HOST`             | Host to bind the Bun server (default: `0.0.0.0`) |
| `PORT`             | Port to run the server on (default: `8080`)      |
| `REDIS_URL`        | Redis connection string                          |
| `LANYARD_USER_ID`  | Your Discord user ID                             |
| `LANYARD_INSTANCE` | Lanyard WebSocket endpoint URL                   |
| `BADGE_API_URL`    | Uses the [badge api](https://git.creations.works/creations/badgeAPI) only required if you want to use badges |

#### Optional Lanyard KV Vars (per-user customization)

These are expected to be defined in Lanyard's KV store:

| Variable  | Description                                                 |
|-----------|-------------------------------------------------------------|
| `snow`    | Enables snow background effect (`true`)                     |
| `rain`    | Enables rain background effect (`true`)                     |
| `readme`  | URL to a README file displayed on your profile              |
| `stars`   | Enables stars background effect (`true`)                    |
| `colors`  | Enables avatar-based color theme (uses `node-vibrant`)      |
| `badges`  | Enables or disables fetching of badges per user             |

---

### 3. Start the App

```bash
bun run start
```

Then open `http://localhost:8080` in your browser.

---

## Docker Support

### Build & Start with Docker Compose

```bash
docker compose up -d --build
```

Make sure your `.env` file is correctly configured before starting.

---

## Tech Stack

- Bun – Runtime
- EJS – Templating
- CSS – Styling
- node-vibrant – Avatar color extraction
- Biome.js – Linting and formatting

---

## License

[MIT](/LICENSE)
