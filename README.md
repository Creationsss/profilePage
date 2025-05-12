# Discord Profile Page

A cool little web app that shows your Discord profile, current activity, and more. Built with Bun.

# Preview
https://creations.works

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

>Only needed if you want to fetch game icons that Discord doesn’t provide:
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
| `REVIEW_DB`           | Enables showing reviews from reviewdb on user pages                         |
| `STEAMGRIDDB_API_KEY` | SteamGridDB API key for fetching game icons                                 |
| `ROBOTS_FILE`         | If there it uses the file in /robots.txt route, requires a valid path       |

#### Optional Lanyard KV Variables (per-user customization)

These can be defined in Lanyard's KV store to customize the page:

| Variable  | Description                                                        |
|-----------|--------------------------------------------------------------------|
| `snow`    | Enables snow background (`true` / `false`)                         |
| `rain`    | Enables rain background (`true` / `false`)                         |
| `stars`   | Enables starfield background (`true` / `false`)                    |
| `badges`  | Enables badge fetching (`true` / `false`)                          |
| `readme`  | URL to a README displayed on the profile (`.md` or `.html`)        |
| `css`     | URL to a css to change styles on the page, no import or require allowed |
| `optout`  | Allows users to stop sharing there profile on the website (`true` / `false`) |
| `reviews` | Enables reviews from reviewdb (`true` / `false`)                   |

---

### 3. Start the Instance

```bash
bun run start
```

---

## Optional: Analytics with Plausible

You can enable [Plausible Analytics](https://plausible.io) tracking by setting a script snippet in your environment.

### `.env` Variable

| Variable                | Description                                                            |
|-------------------------|------------------------------------------------------------------------|
| `PLAUSIBLE_SCRIPT_HTML` | Full `<script>` tag(s) to inject into the `<head>` for analytics       |

#### Example

```env
PLAUSIBLE_SCRIPT_HTML='<script defer data-domain="example.com" src="https://plausible.example.com/js/script.js"></script><script>window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }</script>'
```

- The script will only be injected if this variable is set.
- Plausible provides the correct script when you add a domain.
- Be sure to wrap it in single quotes (`'`) so it works in `.env`.

---

## Docker Support

### Build & Start with Docker Compose

```bash
docker compose up -d --build
```

Make sure the `.env` file is configured correctly before starting the container.

---

## Routes

These are the main public routes exposed by the server:

| Route   | Description                                                                 |
|---------|-----------------------------------------------------------------------------|
| `/`     | Loads the profile page for the default Discord user defined in `.env` (`LANYARD_USER_ID`) |
| `/[id]` | Loads the profile page for a specific Discord user ID passed in the URL     |

> Example: `https://creations.works/209830981060788225` shows the profile of that specific user.

---

## License

[BSD 3](LICENSE)
