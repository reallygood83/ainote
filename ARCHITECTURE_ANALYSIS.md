# Deta Surf Project Architecture Analysis

## 1. PROJECT OVERVIEW

**Project Name**: Surf (Horizon) - Desktop Application
**Type**: Electron-based Desktop Browser/Productivity App
**Framework**: Svelte 5 + TypeScript + Electron
**Backend**: Rust (NEON bindings)
**Database**: SQLite (WAL mode with multi-process support)
**Data Storage**: SFFS (Surf File File System) - Local file storage system

---

## 2. DATA STORAGE ARCHITECTURE

### 2.1 SFFS System (Surf File File System)

**Location**: `app.getPath('userData')/sffs_backend/`

The SFFS system is the core data storage mechanism for Surf:

```
sffs_backend/
├── resources/          # Raw resource files (documents, images, etc.)
├── sqlite/             # Database files
│   ├── database.db     # Main SQLite database
│   ├── database.db-shm # Write-Ahead Logging shared memory
│   └── database.db-wal # WAL log file
└── [other data]
```

**Key Characteristics**:
- **Hybrid Storage**: Combines SQLite for metadata + file system for raw content
- **Resource Isolation**: Each resource has a unique ID and separate file storage
- **Metadata Management**: Tags, annotations, and metadata stored in SQLite
- **Content Hashing**: Content deduplication through hash tracking

### 2.2 SQLite Database Configuration

**File**: `packages/backend/src/store/db.rs`

**Performance Settings**:
```rust
PRAGMA journal_mode = WAL;              // Write-Ahead Logging for multi-process support
PRAGMA synchronous = NORMAL;            // Safe in WAL mode, much faster
PRAGMA temp_store = MEMORY;             // Temp tables in memory
PRAGMA cache_size = -32000;             // 32MB cache per connection
PRAGMA mmap_size = 536870912;           // 512MB memory-mapped I/O
PRAGMA busy_timeout = 60000;            // 60 second lock timeout (multi-tab support)
PRAGMA wal_autocheckpoint = 100;        // Frequent checkpoints to prevent WAL growth
PRAGMA page_size = 4096;                // 4KB pages for mixed read/write
PRAGMA optimize;                        // Auto-analyze for query planning
```

### 2.3 Data Structures

**Core Resource Structure** (`packages/types/src/resources.types.ts`):

```typescript
interface SFFSResource {
  id: string;                    // Unique resource identifier
  type: string;                  // Resource type (article, link, note, etc.)
  path: string;                  // File system path
  createdAt: string;             // Creation timestamp
  updatedAt: string;             // Last update timestamp
  deleted: boolean;              // Soft delete flag
  metadata: {
    name: string;                // User-friendly name
    sourceURI: string;           // Original source URL
    alt: string;                 // Alternative text (images)
    userContext: string;         // User-provided context
  };
  tags: SFFSResourceTag[];        // Key-value tags for organization
  annotations: Annotation[];      // User annotations
  postProcessingState: string;   // Processing state
  spaceIds: string[];            // Associated spaces
}
```

**Resource Tags** (Built-in keys):
- `type`: Resource type identifier
- `deleted`: Soft delete marker
- `hostname`: Source hostname
- `canonicalUrl`: Original URL
- `savedWithAction`: How saved (download, paste, import, etc.)
- `contentHash`: Content deduplication hash
- `spaceSource`: External source (RSS, etc.)
- `viewedByUser`: User visibility flag
- `silent`: Background save indicator

### 2.4 Database Schema (Multi-table structure)

**Main Tables**:
1. `resources` - Core resource metadata
2. `resource_metadata` - Resource name, source URI, alt text
3. `resource_tags` - Key-value tags for resources
4. `resource_text_content` - Indexed text for search
5. `embedding_resources` - AI embeddings for semantic search
6. `resource_content_hash` - Content deduplication
7. `resource_annotations` - User annotations
8. `history_entries` - Browser history
9. `ai_sessions` - Chat/AI session data
10. `spaces` - Organization spaces
11. `post_processing_jobs` - Async processing queue

---

## 3. ELECTRON APP ARCHITECTURE

### 3.1 Application Structure

```
app/
├── src/
│   ├── main/              # Main process (Node.js)
│   ├── preload/           # Preload scripts (IPC bridge)
│   └── renderer/          # Renderer process (Svelte UI)
├── electron.vite.config.ts # Build configuration
├── build/                  # Distribution config
└── package.json            # Dependencies
```

### 3.2 Main Process (`app/src/main/`)

**Entry Point**: `index.ts`

**Key Responsibilities**:
- Electron app lifecycle management
- Window creation and management
- IPC event handling
- Backend initialization
- Protocol registration (surf://)
- File system operations
- User configuration management

**Critical Files**:

| File | Purpose |
|------|---------|
| `index.ts` | App initialization, path setup, SFFS initialization |
| `config.ts` | User configuration (JSON file-based) |
| `mainWindow.ts` | Main window creation and management |
| `ipcHandlers.ts` | IPC event handlers and validation |
| `sffs.ts` | SFFS abstraction layer |
| `surfBackend.ts` | Rust backend process management |
| `downloadManager.ts` | Download and resource saving |
| `viewManager.ts` | Web view and tab management |

**Configuration Files**:
```
userData/
├── user.json                # User settings & preferences
├── permissions.json         # Permission cache by session
├── seen_announcements.json  # Seen announcements state
└── sffs_backend/            # SFFS data directory
```

### 3.3 Backend Integration (Rust)

**Package**: `packages/backend`

**Architecture**:
```
Backend (Rust native module via NEON)
    ↓
JavaScript API Layer (src/api/*.rs)
    ↓
Store Layer (src/store/*.rs)
    ↓
SQLite Database (libsqlite)
```

**Export Functions** (Registered via NEON):

```rust
// Store operations
js__store_create_resource
js__store_get_resource
js__store_update_resource
js__store_remove_resources
js__store_search_resources
js__store_list_resources_by_tags
js__store_create_resource_tag
js__store_update_resource_tag_by_name

// History operations
js__store_create_history_entry
js__store_get_history_entry
js__store_search_history_entries_by_url_and_title

// AI operations
js__ai_*  (AI model inference, embeddings, RAG)

// Worker operations
js__worker_*  (Background processing)

// Key-value store
js__kv_*  (In-memory caching)
```

**Initialization** (`sffs.ts`):
```typescript
const result = initBackend({
  num_worker_threads: 2,           // Background processing threads
  num_processor_threads: 1,        // Text processing threads
  userDataPath: app.getPath('userData'),
  appPath: app.getAppPath()        // App resources directory
})
```

### 3.4 Preload Scripts

**Purpose**: Secure IPC bridge between renderer and main process

**File**: `app/src/preload/` (not shown but referenced in config)

**Functions**: 
- API exposure (`window.api`)
- Backend access (`window.backend.sffs`)
- IPC communication helpers

### 3.5 Renderer (UI) Process

**Framework**: Svelte 5 + TypeScript

**Components**: 94 Svelte components organized as:

```
renderer/
├── Core/              # Core UI components & state management
│   ├── components/    # Reusable components (Tabs, etc.)
│   ├── stores/        # Svelte stores (state management)
│   └── assets/        # Global styles, fonts, images
├── Resource/          # Resource viewing & management
├── Settings/          # Settings UI
├── PDF/               # PDF viewer integration
├── Overlay/           # Overlay components
└── components/        # Additional components
```

---

## 4. UI TEXT STRINGS & LOCALIZATION

### 4.1 Text Definition Locations

**Primary**: Embedded in Svelte components (`.svelte` files)

**Example Pattern** (`Settings.svelte`):
```svelte
<SettingsOption
  title="Dark Mode"
  description="Enable dark appearance for the application."
/>

<SettingsOption
  title="Turntable Favicons"
  description="Tabs will have their favicons spinning to indicate media playing."
/>

<SettingsOption
  title="Custom Prompts"
  description="Save custom prompts inside notes for quick re-use."
/>
```

### 4.2 UI Components with Text

**Settings Components** (`Settings/components/`):
- `AppStylePicker.svelte` - Theme selection (Light/Dark labels)
- `SettingsOption.svelte` - Generic settings option with title/description
- `DefaultSearchEnginePicker.svelte` - Search engine selection
- `TeletypeDefaultActionPicker.svelte` - Command bar action selection
- `ModelSettings.svelte` - AI model configuration
- `SmartNotesOptions.svelte` - Notes features

**Text in TeletypeDefaultActionPicker.svelte**:
```
{ key: 'auto', label: 'Auto (Smart)', description: 'Automatically select based on query type' }
{ key: 'ask_surf', label: 'Ask Surf', description: 'Always default to Ask Surf action' }
{ key: 'search_web', label: 'Search Web', description: 'Always default to Search Web action' }
"Choose how the command bar selects actions by default"
```

### 4.3 Configuration Types (User Settings)

**File**: `packages/types/src/config.types.ts`

```typescript
type UserSettings = {
  embedding_model: 'english_small' | 'english_large' | 'multilingual_small' | 'multilingual_large'
  tabs_orientation: 'vertical' | 'horizontal'
  app_style: 'light' | 'dark'
  use_semantic_search: boolean
  save_to_user_downloads: boolean
  automatic_chat_prompt_generation: boolean
  adblockerEnabled: boolean
  historySwipeGesture: boolean
  cleanup_filenames: boolean
  save_to_active_context: boolean
  search_engine: string
  selected_model: string
  vision_image_tagging: boolean
  turntable_favicons: boolean
  auto_toggle_pip: boolean
  enable_custom_prompts: boolean
  teletype_default_action: 'auto' | 'always_ask' | 'always_search'
  // ... more settings
}
```

### 4.4 Default Settings Values

**File**: `app/src/main/config.ts` (lines 78-126)

```typescript
storedConfig.settings = {
  search_engine: 'google',
  embedding_model: 'multilingual_small',
  tabs_orientation: 'vertical',
  app_style: 'light',
  use_semantic_search: false,
  save_to_user_downloads: true,
  automatic_chat_prompt_generation: true,
  adblockerEnabled: true,
  historySwipeGesture: false,
  has_seen_hero_screen: false,
  skipped_hero_screen: false,
  cleanup_filenames: false,
  save_to_active_context: true,
  onboarding: {
    completed_welcome: false,
    completed_welcome_v2: false,
    completed_chat: false,
    completed_stuff: false
  },
  // ... more defaults
}
```

---

## 5. BACKEND INTEGRATION POINTS

### 5.1 IPC Communication Flow

```
Renderer (Svelte)
        ↓
    window.api (Preload)
        ↓
    IPC Events (Main Process)
        ↓
    Backend Rust Module
        ↓
    SQLite Database
```

### 5.2 Resource Lifecycle

**Creating a Resource**:
1. User saves page/file/text in Surf
2. Renderer calls `window.backend.sffs.js__store_create_resource()`
3. Rust backend:
   - Generates unique resource ID
   - Creates metadata entry in SQLite
   - Saves raw content to file system
   - Creates initial tags
4. Returns resource object to renderer

**Searching Resources**:
1. Renderer calls `window.backend.sffs.js__store_search_resources(query, params)`
2. Rust backend:
   - Performs full-text search in SQLite
   - Optionally uses AI embeddings for semantic search
   - Returns matching resources with metadata
3. Renderer renders results

### 5.3 File Access

**Direct File Operations** (`ipcHandlers.ts`):
```typescript
IPC_EVENTS_MAIN.webviewReadResourceData.handle(async (_, { token, resourceId }) => {
  // Token-based access validation
  const resource_path = path.join(
    app.getPath('userData'), 
    'sffs_backend', 
    'resources', 
    resourceId
  );
  // Path traversal prevention
  if (!isPathSafe(base_path, resource_path)) return null;
  // Read file
  return fileBuffer;
})
```

### 5.4 Settings Synchronization

**Update Flow**:
1. User changes setting in Settings UI
2. Renderer emits update event
3. Main process receives and validates
4. Updates `user.json` via `setUserConfig()`
5. Broadcasts update to all windows

**File**: `config.ts` - `updateUserConfigSettings()`

---

## 6. BUILD & DEPLOYMENT

### 6.1 Build Scripts

**File**: `app/package.json`

```bash
npm run build              # Build frontend + package
npm run build:frontend     # Frontend only
npm run build:mwl          # Mac + Windows + Linux
npm run build:mac          # Mac (x64 + ARM)
npm run build:lin:x64      # Linux x64
npm run build:win:x64      # Windows x64
```

### 6.2 Build Configuration

**Vite Config**: `app/electron.vite.config.ts`
**Electron Builder Config**: `app/build/electron-builder-config.js`

### 6.3 Development Setup

```bash
# Monorepo workspace
yarn dev              # Dev server with hot reload
yarn dev:silent       # Dev without warnings
yarn build:libs       # Build shared packages first
yarn lint             # Lint all code
yarn format           # Format with Prettier
```

---

## 7. KEY CONFIGURATION FILES

### 7.1 User Data Paths

```
Platform-specific userData directory:
- macOS: ~/Library/Application Support/Surf/
- Windows: %APPDATA%/Surf/
- Linux: ~/.config/Surf/

Critical files:
- user.json              # User settings
- permissions.json       # Permission decisions
- seen_announcements.json # Announcement state
- sffs_backend/          # All data storage
```

### 7.2 Environment Variables (Build-time)

**Main Process**:
- `M_VITE_PRODUCT_NAME` - App name
- `M_VITE_APP_VERSION` - Version
- `M_VITE_USE_TMP_DATA_DIR` - Use temp directory
- `M_VITE_SENTRY_DSN` - Error tracking
- `M_VITE_ANNOUNCEMENTS_URL` - Announcements endpoint

**Renderer**:
- `R_VITE_SENTRY_DSN` - Renderer error tracking

### 7.3 Protocol Registration

**Custom Protocol**: `surf://`

**Handlers**:
- `surf://surf/resource/{id}` - Resource viewer
- `surf://surf/notebook/{id}` - Notebook viewer
- App registered as default protocol handler

---

## 8. CUSTOMIZATION POINTS

### 8.1 Text Customization (For Localization)

**Strategy**: Direct text in Svelte components requires:
1. Identify all text strings in `.svelte` files
2. Extract to centralized translation system
3. Implement dynamic text loading

**Current Approach**: English strings hardcoded in components

**Locations to update for Korean (ko) localization**:
- `Settings/Settings.svelte` - 20+ settings labels
- `Settings/components/*.svelte` - Component descriptions
- `Core/components/*.svelte` - UI labels
- Dialog titles and button labels in TypeScript files

### 8.2 Styling Customization

**System**: Tailwind CSS + SCSS

**Files**:
- `app/src/app.css` - Global styles
- `app/tailwind.config.ts` - Tailwind configuration
- Component-specific styles in `.svelte` files

**Theme Variables**:
```css
--color-text
--color-background
--tab-title-fontFamily
--tab-title-fontWeight
--t-12-6 (font sizes)
```

### 8.3 Configuration Customization

**User Settings Structure** (`packages/types/src/config.types.ts`):
- Add new setting to `UserSettings` type
- Provide default value in `config.ts`
- Add migration logic for existing users
- Create UI control in Settings components

---

## 9. FILE ORGANIZATION SUMMARY

```
/Users/moon/Desktop/surf-main/
├── app/                          # Electron app
│   ├── src/
│   │   ├── main/                # Main process (Node.js)
│   │   │   ├── index.ts         # Entry point
│   │   │   ├── config.ts        # Configuration management
│   │   │   ├── sffs.ts          # SFFS abstraction
│   │   │   ├── ipcHandlers.ts   # IPC event handlers
│   │   │   └── ...
│   │   ├── preload/             # Preload scripts (IPC bridge)
│   │   └── renderer/            # Svelte UI
│   │       ├── Settings/        # Settings window
│   │       ├── Core/            # Core components
│   │       ├── Resource/        # Resource views
│   │       └── ...
│   ├── electron.vite.config.ts
│   └── package.json
├── packages/
│   ├── backend/                 # Rust backend
│   │   └── src/
│   │       ├── lib.rs           # Entry point
│   │       ├── api/             # JavaScript API
│   │       ├── store/           # Database layer
│   │       └── ai/              # AI features
│   ├── types/                   # TypeScript types
│   │   └── src/
│   │       ├── config.types.ts
│   │       ├── resources.types.ts
│   │       └── ...
│   ├── ui/                      # UI component library
│   ├── editor/                  # Code/text editor
│   ├── services/                # Shared services (IPC, etc.)
│   └── ...
└── package.json                 # Root workspace
```

---

## 10. DEVELOPMENT NOTES

### 10.1 Monorepo Setup

**Tool**: Yarn workspaces + Turbo

**Commands**:
```bash
yarn          # Install all dependencies
yarn dev      # Start development server
yarn build    # Build everything
yarn lint     # Lint all packages
```

### 10.2 IPC Security

**Validation**: All IPC messages validated via `validateIPCSender()`

**Token System**: Secure file access via temporary tokens (`token.ts`)

**Path Safety**: `isPathSafe()` prevents path traversal attacks

### 10.3 Database Migrations

**File**: `packages/backend/src/store/migrations.rs`

**Automatic**: Migrations run on startup if needed

**Backup**: Automatic backup created before migration

---

## SUMMARY

Surf uses a sophisticated **local-first architecture** with:
- **SFFS**: Custom file system combining SQLite metadata + file storage
- **Rust Backend**: Native performance via NEON bindings
- **Electron**: Cross-platform desktop delivery
- **Svelte**: Modern reactive UI
- **JSON Configuration**: User settings in `userData` directory
- **IPC Security**: Validated message passing with token-based file access

For Korean localization, focus on:
1. Svelte component text strings
2. Settings labels and descriptions  
3. Type definitions with enum values
4. Dialog titles and button labels
