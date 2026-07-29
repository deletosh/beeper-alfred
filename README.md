# Beeper Alfred Workflow

Quick access to all your messages across WhatsApp, Telegram, Signal, Slack, and more—right from Alfred.

![Demo - Search Messages](https://i.imgur.com/HH5vn31.gif)

## ✨ Key Features

### 🔍 Universal Search
Search across **all your messaging networks** in one place. Find chats, groups, and individual messages instantly—whether they're in WhatsApp, Telegram, Signal, Slack, or any other platform Beeper supports.

### 👤 Smart Contact Management
- **Find contacts across all networks** - Search for "John" and see results from WhatsApp, Telegram, Signal, etc.
- **Multi-account support** - Have 2 WhatsApp accounts? No problem! See contacts from both
- **Start new conversations** - Create chats with any contact from any network, right from Alfred

### 📬 Unified Inbox
- **See all unread messages** in one view across all platforms
- **Visual priority indicators** - Color-coded badges show message count (🔴 >10, 🟡 5-10, 🟢 1-4)
- **Quick actions** - Reply, archive, or open with keyboard shortcuts

### ⚡ Lightning Fast
- **Direct integration** with Beeper Desktop API
- **Cached results** for instant performance
- **Keyboard-driven** workflow - never touch your mouse

## 🚀 Quick Start

1. **Install** - Download and double-click `beeper-alfred.alfredworkflow`
2. **Enable API** - Open Beeper → Settings → Developers → Toggle "Allow connections" ON
3. **Authorize** - Run `bp setup` in Alfred and press ↵ on "Connect Alfred to Beeper"
4. **Start using** - Type `bp` to see all commands!

## Requirements

- macOS 10.15+
- [Alfred 5+](https://www.alfredapp.com/) with Powerpack
- [Beeper Desktop](https://www.beeper.com/) with the `/v1` API and OAuth
  (verified on 4.2.1004). Older builds serving only the `/v0` API are not
  supported — every command returns 404 against them.
- Node.js 20+ (usually pre-installed on macOS)

## Installation

### Option 1: Stable release (recommended)

Releases attach the workflow file directly, so there is nothing to unzip.

1. Open [**Releases**](../../releases/latest)
2. Under **Assets**, download `beeper-alfred.alfredworkflow`
3. Double-click it to install in Alfred
4. Run `bp setup` in Alfred to authorize

### Option 2: Latest development build

Builds from `main` are published as GitHub Actions artifacts. Actions always
serves artifacts as a **`.zip`**, so this route has an extra unzip step —
inside is the same `beeper-alfred.alfredworkflow` file.

**[⬇️ Download latest build](https://nightly.link/deletosh/beeper-alfred/workflows/build/main/beeper-alfred-latest.zip)** (`.zip`)

Or manually:
1. Go to [Actions → Build Workflow](../../actions/workflows/build.yml)
2. Open the latest successful run on `main`
3. Under "Artifacts", download `beeper-alfred-latest` (downloads as `.zip`)
4. Unzip it
5. Double-click `beeper-alfred.alfredworkflow` to install
6. Run `bp setup` in Alfred to authorize

## Setup

Authorization uses **OAuth** — there is no token to copy or paste.

1. Open Beeper Desktop
2. Go to **Settings** (⌘,) → **Developers**
3. Toggle **"Allow connections"** ON
4. In Alfred, type `bp setup` and press ↵ on **"Connect Alfred to Beeper"**
5. Approve the consent page that opens in your browser

`bp setup` also doubles as a status check — run it any time to see whether
the workflow is connected.

### When authorization expires

Tokens last about 30 days and there is no refresh token, so re-running
`bp setup` is the normal fix when commands start reporting "Not authorized".
You can revoke access at any time from Beeper → Settings → Developers →
**Approved connections**.

> **Note:** the workflow exposes an optional `Access Token` setting for
> advanced use. Leave it empty. A value there overrides OAuth, so a stale
> one will shadow a working authorization.

## Usage

### Commands

#### `bp` or `beeper`
Opens the main menu with quick actions.

#### `bp search <query>`
Global search across chats, groups, and messages.

![Search Demo](https://i.imgur.com/HH5vn31.gif)

**What it searches:**
- 💬 **Chats** - Direct conversations matching your query
- 👥 **Groups** - Group chats with matching names or participants
- 📩 **Messages** - Message content across all conversations

**Examples:**
- `bp search john` - Find all chats, groups, and messages related to "john"
- `bp search meeting notes` - Search for "meeting notes" everywhere

**Results show:**
- 💬 = Existing chat
- 👥 = Group chat
- 📩 = Individual message

**Keyboard Shortcuts:**
- `↵` Open chat/message in Beeper
- `⌘↵` Copy text
- `⌥↵` Quick reply to chat

#### `bp send`
Send a message to a contact or start a new conversation.

![Send Message Demo](https://i.imgur.com/aqQFbU0.gif)

**What it shows:**
- 💬 **Existing Chats** - Conversations you already have (shown first)
- 👤 **Contacts** - People you can start new conversations with

**How it works:**
1. Type `bp send john` to search for contacts and chats
2. Select from results:
   - **Existing chat**: Opens directly in Beeper
   - **New contact**: Creates a new chat and opens it
3. Start typing your message

**Multi-Account Support:**
- If you have multiple WhatsApp accounts, you'll see contacts from both
- Each contact shows which network/account it belongs to
- Results are deduplicated (won't show same person twice)

**Examples:**
- `bp send mom` - Find mom across all networks
- `bp send john` - Shows John from WhatsApp, Telegram, Signal, etc.

**Keyboard Shortcuts:**
- `↵` Open chat or create new conversation
- `⌘↵` Open and start typing
- `⌥↵` Add file attachment

#### `bp contact <name>`
Find a person across every connected network and pick where to message them.

Where `bp send` lists each match separately, `bp contact` groups results by
person: one row per network you can actually reach them on, so you can choose
whether to message someone on WhatsApp, Telegram, Signal, etc.

**What it shows:**
- The person's name once, followed by each network they're reachable on
- 💬 **Existing chat** - with the last message and when it happened
- 👤 **Start new conversation** - for networks where you have no chat yet
- Networks where Beeper can't start a DM are shown but not selectable

**How it works:**
1. Type `bp contact alice` to search every network at once
2. Pick the network you want to reach them on
3. Press `↵` to open the conversation in Beeper

**Send without leaving Alfred:**

Add `>>` followed by your message to send it immediately:

```
bp contact alice >> running 10 minutes late
```

Each row then becomes "send on this network" — pick WhatsApp or Telegram and
the message goes out directly. If no chat exists yet on that network, one is
started first.

**Examples:**
- `bp contact mom` - See every network mom is reachable on
- `bp contact alice >> on my way` - Send straight to Alice, choosing the network

**Keyboard Shortcuts:**
- `↵` Open the conversation (or send, when using `>>`)
- `⌘↵` Open in Beeper with the message box focused
- `⌥↵` Copy the contact's name

**Notes:**
- A network whose bridge is offline is skipped rather than failing the search
- Your own account is never listed as a contact

#### `bp unread`
View all unread messages across all networks.

![Unread Messages Demo](https://i.imgur.com/jdksDRZ.gif)

**Features:**
- See all unread conversations in one place
- Sorted by most recent activity
- Shows unread count per chat
- Visual badges: 🔴 >10 messages, 🟡 5-10 messages, 🟢 1-4 messages
- Preview of last message

**Keyboard Shortcuts:**
- `↵` Open chat in Beeper
- `⌘↵` Quick reply
- `⌥↵` Archive chat

**Network Filters** (coming soon):
- `bp unread:whatsapp` - Only WhatsApp unreads
- `bp unread:telegram` - Only Telegram unreads

#### `bp recent`
Quick access to your last 10 active chats.

![Recent Chats Demo](https://i.imgur.com/dofjUNC.gif)

**Features:**
- Shows your 10 most recently active conversations
- Displays last message preview
- Shows time since last activity
- Quick access to frequently used chats

**Perfect for:**
- Jumping back to recent conversations
- Following up on earlier discussions
- Quick access without searching

## Supported Networks

- WhatsApp
- Telegram
- Signal
- Slack
- Discord
- Instagram
- Messenger
- X (Twitter)
- LinkedIn
- Google Messages
- iMessage
- SMS

## Troubleshooting

### "Could not connect to Beeper Desktop API"
- Ensure Beeper Desktop is running
- Check "Allow connections" is ON in Settings → Developers
- Run `bp setup` to check the connection

### "Not authorized" / "Invalid API Token"
- Run `bp setup` and re-authorize — tokens expire after ~30 days
- Check the connection was not revoked under Settings → Developers →
  Approved connections
- If you set the optional `Access Token` workflow setting, clear it: it
  overrides OAuth and a stale value shadows a working authorization

### "No results found"
- Wait for Beeper to finish indexing messages
- Use "On-Device Connections" in Beeper settings for better indexing
- Try broader search terms

### Search is slow
- Results are cached for 5 minutes
- Consider using network-specific filters (`bp search:whatsapp`)

## Privacy & Security

- All data stays local on your machine
- API runs on `localhost:23373` only
- No external network requests, and no runtime dependencies
- Authorization uses OAuth 2.0 with PKCE; the redirect listener binds to
  `127.0.0.1` on an ephemeral port and closes as soon as the flow completes
- The access token is stored with owner-only permissions (`0600`) in Alfred's
  workflow data directory, and can be revoked from Beeper at any time

### Setup Development Environment

```bash
git clone https://github.com/deletosh/beeper-alfred.git
cd beeper-alfred
npm install          # dev tooling only — the workflow itself ships no deps

node src/index.js setup            # authorize, then:
node src/index.js search "test"
```

Build an installable `.alfredworkflow` into `dist/`:

```bash
npm run build
```

## License

MIT License - See [LICENSE](LICENSE) for details.

## Credits

- [Beeper Desktop API](https://developers.beeper.com/)
- [Alfred](https://www.alfredapp.com/)

## Support

- GitHub Issues: [Report a bug](../../issues)
- Beeper Developers: [Matrix](https://matrix.to/#/#beeper-developers:beeper.com)

---

**Version:** 1.0.0 

**Author:** Dele Tosh  
