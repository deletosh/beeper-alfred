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

1. **Install** - Download and double-click `Beeper.alfredworkflow`
2. **Enable API** - Open Beeper → Settings → Developers → Toggle "Beeper Desktop API" ON
3. **Configure** - Run `bp setup` in Alfred and paste your access token
4. **Start using** - Type `bp` to see all commands!

## Requirements

- macOS 10.15+
- [Alfred 5+](https://www.alfredapp.com/) with Powerpack
- [Beeper Desktop](https://www.beeper.com/) v4.1.169+
- Node.js 20+ (usually pre-installed on macOS)

## Installation

### Option 1: Download Latest Build (Recommended)

Download the latest development build directly from GitHub Actions:

**[⬇️ Download Latest Build](https://nightly.link/deletosh/beeper-alfred/workflows/build/main/beeper-alfred-latest.zip)**

Or manually:
1. Go to [Actions → Build Workflow](../../actions/workflows/build.yml)
2. Click the latest successful workflow run
3. Scroll to "Artifacts" and download `beeper-alfred-latest`
4. Extract the ZIP file
5. Double-click `beeper-alfred.alfredworkflow` to install
6. Run `bp setup` in Alfred to configure your API token

### Option 2: Stable Release

1. Download the latest stable release from [Releases](../../releases)
2. Double-click `Beeper.alfredworkflow` to install
3. Run `bp setup` in Alfred to configure your API token

## Setup

![Get Access Token](https://i.imgur.com/gT2rahf.gif)

1. Open Beeper Desktop
2. Go to **Settings** (⌘,) → **Developers**
3. Toggle **"Beeper Desktop API"** to ON
4. Copy your **Access Token**
5. In Alfred, type `bp setup` and paste your token

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
- Check API is enabled in Settings → Developers
- Run `bp setup` to verify your token

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
- Access token stored securely in Alfred's encrypted storage
- No external network requests

### Setup Development Environment

```bash
cd /Users/deletosh/projects/software/beeper-alfred
npm install
node src/index.js search "test"
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
