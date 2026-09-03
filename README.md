<div align="center">
  <img src="https://github.com/user-attachments/assets/4ad1172f-af27-41cf-8cb9-7079253ff5bc" width="120" alt="juno-bot" />
  <h1>JunoBot</h1>
  <p>A Discord bot for Juniors.dev that provides time-tracking, project management, task management, and a live server dashboard.</p>
</div>

---

## Features

- **Session tracking** - clock in to start a timed work session, clock out to end it; sessions record activity text, duration, and linked tasks
- **Session timers** - configurable warn-before and grace-period windows; the bot DMs a warning before the target duration expires and auto-ends the session after the grace period; timers survive bot restarts
- **Live dashboard** - a persistent channel message showing who is currently clocked in and a daily leaderboard of total time worked; updates on a throttled trailing-edge schedule with a configurable idle refresh interval
- **Personal dashboard** - `/my-dashboard` shows per-user monthly stats: total time, session count, average session length, longest session, best day, and active-day streak
- **Task management** - create, update, archive, and delete tasks; filter by status; tasks can be linked to projects and attached to the active session at clock-in
- **Project management** - create, edit, archive, restore, and delete projects; role-based membership with admin and link-add permissions; attach categorised links (GitHub, Figma, docs, etc.) to each project
- **Health monitoring** - an admin-only cron job polls the bot and database on a configurable schedule; results are posted to a designated channel with alerts on failure and a recovery notice when service is restored; persistent failures trigger a ping to configured admin users; an on-demand `/health` command shows Discord gateway status, database latency, and process uptime

---

## Prerequisites

- Node.js 22 or later
- pnpm
- Docker and Docker Compose (for the local PostgreSQL database)
- A Discord application with a bot token and a target guild

---

## Installation

```sh
git clone https://github.com/Juniors-Dev/juno-bot.git
cd juno-bot
pnpm install
```

---

## Database setup

Start a local PostgreSQL 15 instance using the provided compose file:

```sh
docker-compose up -d
```

This creates a container named `pg_juno_dev` on port `5432`. Data is persisted in a Docker volume named `pg_data`.

In development mode the bot runs `sequelize.sync({ alter: true })` on startup, so tables are created and migrated automatically. In production (`NODE_ENV=production`) the sync step is skipped.

---

## Environment variables

Copy the example file and fill in the values before starting the bot:

```sh
cp ".env .example" .env
```

| Variable                   | Required | Description                                                           | Example               |
| -------------------------- | -------- | --------------------------------------------------------------------- | --------------------- |
| `NODE_ENV`                 | No       | Set to `production` to skip DB sync on startup                        | `development`         |
| `token`                    | Yes      | Discord bot token                                                     | `MTIz...`             |
| `clientId`                 | Yes      | Discord application client ID (used by `deploy-commands.js`)          | `123456789012345678`  |
| `guildId`                  | Yes      | Target guild (server) ID                                              | `987654321098765432`  |
| `statusChannelId`          | No       | Channel where the good morning cron job posts                         | `111222333444555666`  |
| `HOST`                     | Yes      | PostgreSQL host                                                       | `localhost`           |
| `DATABASE_NAME`            | Yes      | PostgreSQL database name                                              | `juno_time_dev`       |
| `ADMIN_USERNAME`           | Yes      | PostgreSQL username                                                   | `admin`               |
| `ADMIN_PASSWORD`           | Yes      | PostgreSQL password                                                   | `secret`              |
| `DIALECT`                  | Yes      | Sequelize dialect (must be `postgres`)                                | `postgres`            |
| `DEFAULT_SESSION_MINUTES`  | No       | Default session target duration in minutes (default: `120`)           | `120`                 |
| `MIN_SESSION_MINUTES`      | No       | Minimum session length in minutes (default: `10`)                     | `10`                  |
| `MAX_SESSION_MINUTES`      | No       | Hard cap on session duration in minutes (default: `480`)              | `480`                 |
| `WARN_BEFORE_MINUTES`      | No       | Minutes before session end when the warning DM is sent (default: `5`) | `5`                   |
| `GRACE_PERIOD_MINUTES`     | No       | Extra minutes after the target before auto-end fires (default: `3`)   | `3`                   |
| `IDLE_REFRESH_MINUTES`     | No       | Dashboard idle-refresh interval in minutes (default: `5`)             | `5`                   |
| `HEALTH_POLL_SCHEDULE`     | No       | Cron expression for automated health checks (default: `*/5 * * * *`)  | `*/1 * * * *`         |
| `BOT_ISSUES_CHANNEL_ID`    | No       | Channel where health alerts are posted; alerts are silenced if unset  | `111222333444555666`  |
| `ADMIN_USER_IDS`           | No       | Comma-separated Discord user IDs to ping on persistent failures       | `123456789,987654321` |
| `HEALTH_FAILURE_THRESHOLD` | No       | Consecutive failures before admins are pinged (default: `3`)          | `3`                   |

---

## Running the bot

**Development** (file-watcher restarts on changes):

```sh
pnpm dev
```

**Production:**

```sh
pnpm start
```

Both scripts load `.env` automatically via the Node.js `--env-file` flag.

---

## Registering slash commands

Slash commands must be registered with Discord before they appear in the server. Run this once after cloning, and again whenever you add or rename a command:

```sh
node deploy-commands.js
```

---

## Available slash commands

| Command            | Description                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------------- |
| `/clock-in`        | Start a new work session; shows a UI to select tasks and set an activity note                                   |
| `/clock-out`       | End the current work session and display a session summary                                                      |
| `/my-dashboard`    | View your monthly work statistics (total time, streaks, best day, etc.)                                         |
| `/my-tasks`        | View and manage your tasks with an optional `filter` parameter (`active`, `todo`, `in_progress`, `done`, `all`) |
| `/projects`        | List, create, edit, archive, restore, and delete your projects                                                  |
| `/projects-links`  | Manage links attached to your projects                                                                          |
| `/create-user`     | Register your Discord account in the database (required before using other commands)                            |
| `/setup-dashboard` | Initialize the live dashboard in the current channel (admin setup, run once per channel)                        |
| `/health`          | Check bot and database health: Discord gateway status, DB latency, and process uptime. Admin only.              |

---

## Architecture overview

### Entry point - `index.js`

1. Connects to PostgreSQL via Sequelize and syncs models (development only).
2. Attaches all service instances to every incoming interaction via a `prependListener` on `InteractionCreate`, making them available as `interaction.services`.
3. Recursively loads commands from `commands/` and events from `events/`.
4. On `ready`: restores in-memory timers for any sessions active before the process started, initialises the live dashboard, and registers cron jobs.

### Interaction routing - `events/interaction/`

The single `InteractionCreate` handler dispatches by type:

- **Chat input** → looks up `interaction.commandName` in `client.commands`, runs guards, then `execute`
- **Button** → keyed by the prefix before the first `:` in `customId`
- **Modal submit** → same prefix approach
- **Select menu** → same prefix approach

For buttons, modals, and select menus the routing key is everything before the first `:` in `customId`. A button built with `.setCustomId("timer:pause:abc-123")` matches the `timer` entry in `buttonHandlers`. The rest of the `customId` after the first `:` can carry whatever payload the handler needs.

Handlers are registered in `events/interaction/handlers/button.js` (and the equivalent `modal.js` / `select.js`) as:

```js
// events/interaction/handlers/button.js
export const buttonHandlers = {
  timer: {
    run: handleTimerButtons,          // function that receives the interaction
    context: { needsUser: true, needsSession: false }, // which DB lookups to run first
  },
};
```

### Services pattern

All database access goes through service classes in `services/`. Commands and handlers access them via `interaction.services`, never by importing models directly.

| Service            | Responsibility                                                           |
| ------------------ | ------------------------------------------------------------------------ |
| `userService`      | User CRUD by Discord ID or internal UUID                                 |
| `sessionService`   | Start, end, update, and query work sessions; monthly stats; daily totals |
| `taskService`      | Task CRUD; link tasks to sessions; status filtering                      |
| `projectService`   | Project CRUD; member management; archive/restore                         |
| `linkService`      | Create, update, and delete links attached to projects                    |
| `dashboardService` | Persist and retrieve live dashboard channel/message state                |
| `healthService`    | Check Discord gateway and database connectivity; drives the health poll  |

### Guards

Commands declare a `guards` array. Before `execute` is called, each guard returns `true` to allow or `false` (after sending an ephemeral reply) to abort.

| Guard                    | Behaviour                                                      |
| ------------------------ | -------------------------------------------------------------- |
| `requireActiveSession`   | Aborts if no active session is found; offers a Clock In button |
| `requireNoActiveSession` | Aborts if an active session exists; offers a Clock Out button  |

### Feature modules - `features/`

- `liveDashboard/` - builds and updates the persistent dashboard message in the designated channel. Handles throttling (so rapid activity does not spam Discord), the idle-refresh timer, and restoring the dashboard on bot startup.
- `session/` - everything that happens during a work session: the countdown timer that sends a warning DM before the session ends and then auto-ends it after the grace period, restoring in-memory timers when the bot restarts, and the UI builders for the clock-in flow and personal dashboard.
- `tasks/` - builds the embed shown in `/my-tasks`.
- `projects/links/` - builds the UI for managing links attached to a project.
- `health/` - runs the automated health poll on a cron schedule and posts alerts to a designated channel when checks fail or recover.

---

## Adding a new slash command

1. Create a `.js` file in the appropriate subfolder under `commands/`.
2. Export a default object:

   ```js
   export default {
     data: new SlashCommandBuilder().setName("my-command").setDescription("..."),
     guards: [], // optional
     skipContext: false, // set to true to skip DB user lookup (interaction.botContext will not be populated)
     async execute(interaction) {
       /* ... */
     },
   };
   ```

3. Run `node deploy-commands.js` to register the command with Discord.

---

## Code style

The project uses ESLint and Prettier. A Husky pre-commit hook runs both checks automatically.

```sh
pnpm lint          # check only
pnpm lint:fix      # auto-fix
pnpm format        # write formatting
pnpm format:check  # check only
```

---

## License

ISC
