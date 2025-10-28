# Deta Surf - Key File Paths & Reference Guide

## CRITICAL FILES FOR CUSTOMIZATION

### 1. USER CONFIGURATION & DEFAULTS
- **Location**: `/Users/moon/Desktop/surf-main/app/src/main/config.ts`
- **Purpose**: User settings storage, defaults, migrations
- **Key Functions**:
  - `getUserConfig()` - Load user settings
  - `setUserConfig()` - Save user settings  
  - `updateUserConfigSettings()` - Update specific settings
  - Default values defined at lines 78-126

### 2. DATA STORAGE LAYER
- **Location**: `/Users/moon/Desktop/surf-main/packages/backend/src/store/`
- **Key Files**:
  - `db.rs` - SQLite connection & pragma configuration
  - `resources.rs` - Resource CRUD operations
  - `resource_tags.rs` - Tag management
  - `history_entries.rs` - Browser history
  - `migrations.rs` - Database migrations
  - `kv.rs` - Key-value store

### 3. RUST BACKEND API
- **Location**: `/Users/moon/Desktop/surf-main/packages/backend/src/api/`
- **Key Files**:
  - `mod.rs` - Function registration
  - `store.rs` - Store API functions (lines 6-80 show all exports)
  - `ai.rs` - AI operations
  - `worker.rs` - Background worker tasks
  - `kv.rs` - Key-value operations

### 4. ELECTRON MAIN PROCESS
- **Location**: `/Users/moon/Desktop/surf-main/app/src/main/`
- **Critical Files**:
  - `index.ts` - App initialization & SFFS setup
  - `config.ts` - User configuration (13.5KB)
  - `sffs.ts` - SFFS abstraction layer
  - `ipcHandlers.ts` - IPC event handlers (18.9KB)
  - `mainWindow.ts` - Window management (20.1KB)
  - `viewManager.ts` - Tab & view management (41.8KB)
  - `surfBackend.ts` - Rust process management
  - `surfProtocolHandlers.ts` - Custom protocol handling

### 5. UI COMPONENTS (SVELTE)
- **Location**: `/Users/moon/Desktop/surf-main/app/src/renderer/`
- **Settings UI**: `/Users/moon/Desktop/surf-main/app/src/renderer/Settings/`
  - `Settings.svelte` - Main settings page
  - `components/AppStylePicker.svelte` - Theme selection
  - `components/SettingsOption.svelte` - Settings template
  - `components/TeletypeDefaultActionPicker.svelte` - Command bar
  - `components/DefaultSearchEnginePicker.svelte` - Search engine
  - `components/ModelSettings.svelte` - AI model config
  - `components/SmartNotesOptions.svelte` - Notes features

- **Core Components**: `/Users/moon/Desktop/surf-main/app/src/renderer/Core/`
  - `components/Tabs/` - Tab system (16 files)
  - `stores/index.svelte.ts` - State management

- **Other UI**: `/Users/moon/Desktop/surf-main/app/src/renderer/`
  - `Resource/` - Resource viewing
  - `PDF/` - PDF viewer
  - `Overlay/` - Overlay components

### 6. TYPE DEFINITIONS
- **Location**: `/Users/moon/Desktop/surf-main/packages/types/src/`
- **Key Files**:
  - `config.types.ts` - User settings type (UserSettings, UserConfig)
  - `resources.types.ts` - Resource types (SFFSResource, etc.)
  - `horizon.types.ts` - General types
  - `ai.types.ts` - AI model types

### 7. BUILD & CONFIGURATION
- **Electron Config**: `/Users/moon/Desktop/surf-main/app/electron.vite.config.ts`
- **App Package**: `/Users/moon/Desktop/surf-main/app/package.json`
- **Root Package**: `/Users/moon/Desktop/surf-main/package.json`
- **Turbo Config**: `/Users/moon/Desktop/surf-main/turbo.json`

### 8. STYLING
- **Global Styles**: `/Users/moon/Desktop/surf-main/app/src/app.css`
- **Tailwind Config**: `/Users/moon/Desktop/surf-main/app/tailwind.config.ts`
- **Output CSS**: `/Users/moon/Desktop/surf-main/app/src/output.css` (25.7KB)

---

## DATA STORAGE LOCATION

### User Data Directory
```
macOS:  ~/Library/Application Support/Surf/
Windows: %APPDATA%/Surf/
Linux:   ~/.config/Surf/
```

### File Structure in userData
```
userData/
├── user.json                    # User settings & preferences
├── permissions.json             # Permission decisions cache
├── seen_announcements.json      # Announcements state
├── sffs_backend/
│   ├── resources/               # Raw resource files
│   └── sqlite/
│       ├── database.db          # Main SQLite database
│       ├── database.db-shm      # WAL shared memory
│       └── database.db-wal      # WAL log
```

---

## TEXT STRINGS & LOCALIZATION POINTS

### Settings Labels (Primary targets for Korean translation)
**File**: `/Users/moon/Desktop/surf-main/app/src/renderer/Settings/Settings.svelte`

```
- "Dark Mode"
- "Turntable Favicons"
- "Custom Prompts"
- "Save to Active Context"
- "Save Downloads to System Downloads Folder"
- "Automatic Picture-in-Picture"
- "Automatic Filename Cleanup"
- "Auto Generate Chat Prompts"
- "Auto Tag Images with AI"
- [20+ more settings labels and descriptions]
```

### Component Descriptions
**File**: `/Users/moon/Desktop/surf-main/app/src/renderer/Settings/components/TeletypeDefaultActionPicker.svelte`

```
- "Auto (Smart)" - "Automatically select based on query type"
- "Ask Surf" - "Always default to Ask Surf action"
- "Search Web" - "Always default to Search Web action"
- "Choose how the command bar selects actions by default"
```

### Configuration Enum Values
**File**: `/Users/moon/Desktop/surf-main/packages/types/src/config.types.ts`

```
- 'vertical' / 'horizontal' (tabs_orientation)
- 'light' / 'dark' (app_style)
- 'google' / [other search engines] (search_engine)
- 'auto' / 'always_ask' / 'always_search' (teletype_default_action)
- 'english_small', 'english_large', 'multilingual_small', 'multilingual_large'
```

---

## BACKEND INTEGRATION POINTS

### JavaScript-to-Rust API Calls
**Primary File**: `/Users/moon/Desktop/surf-main/app/src/main/sffs.ts`

Key method calls:
```typescript
this.sffs.js__store_create_resource(resource)
this.sffs.js__store_get_resource(id)
this.sffs.js__store_update_resource(resource)
this.sffs.js__store_search_resources(query)
this.sffs.js__backend_set_surf_backend_health(boolean)
this.sffs.js__backend_run_migration()
```

### IPC Communication
**Primary File**: `/Users/moon/Desktop/surf-main/app/src/main/ipcHandlers.ts`

Key handlers:
```typescript
IPC_EVENTS_MAIN.tokenCreate
IPC_EVENTS_MAIN.webviewReadResourceData
IPC_EVENTS_MAIN.updateUserConfigSettings
// ... many more handlers
```

---

## COMPONENT HIERARCHY

```
Settings.svelte (root)
├── SettingsOption.svelte (reusable setting item)
├── AppStylePicker.svelte
├── DefaultSearchEnginePicker.svelte
├── TeletypeDefaultActionPicker.svelte
├── ModelSettings.svelte
├── SmartNotesOptions.svelte
└── LayoutPicker.svelte
```

---

## BUILD COMMANDS

```bash
# Development
yarn dev                    # Full dev with hot reload
yarn dev:silent            # Dev without warnings

# Build
yarn build                 # Build all (frontend + backend)
yarn build:frontend        # Frontend only
yarn build:packages        # Packages only
yarn build:mwl             # Mac + Windows + Linux
yarn build:mac             # macOS (x64 + ARM)
yarn build:lin:x64         # Linux x64
yarn build:win:x64         # Windows x64

# Maintenance
yarn lint                  # Lint all code
yarn format                # Format with Prettier
```

---

## CONFIGURATION SYSTEM

### How Settings Work

1. **Default Values** - Set in `/Users/moon/Desktop/surf-main/app/src/main/config.ts` (lines 78-126)

2. **Storage** - Persisted to `userData/user.json` via `setUserConfig()`

3. **UI Binding** - Svelte components bind to settings:
   ```svelte
   <SettingsOption bind:value={userConfigSettings.setting_name} />
   ```

4. **Update Flow**:
   ```
   UI Change → handleSettingsUpdate() → window.api.updateUserConfigSettings() 
   → Main Process → setUserConfig() → Save to user.json → Broadcast to windows
   ```

### Adding a New Setting

1. Add to `UserSettings` type in `packages/types/src/config.types.ts`
2. Add default value in `app/src/main/config.ts` (lines 78-126)
3. Add migration logic if needed (lines 130-350 in config.ts)
4. Create UI control in Settings components
5. Bind UI to setting value

---

## KEY MEASUREMENTS

- **Total Svelte Components**: 94
- **TypeScript Files**: 62
- **Config File Size**: 13.5 KB (config.ts)
- **IPC Handlers Size**: 18.9 KB (ipcHandlers.ts)
- **View Manager Size**: 41.8 KB (viewManager.ts) - Most complex
- **Monorepo Packages**: 14+ packages in workspace

---

## SECURITY NOTES

### Path Traversal Prevention
- All file operations validated via `isPathSafe(base_path, requested_path)`
- Located in: `/Users/moon/Desktop/surf-main/app/src/main/utils.ts`

### IPC Validation
- All IPC senders validated via `validateIPCSender()`
- File access via temporary tokens (`token.ts`)
- Messages only accepted from known window IDs

### Database Security
- WAL mode enabled for concurrent access
- 60-second lock timeout handles multi-tab scenarios
- Automatic backups before migrations

---

## ENVIRONMENT VARIABLES

**Build-time (Build Configuration)**:
- `M_VITE_PRODUCT_NAME` - App display name
- `M_VITE_APP_VERSION` - Version string
- `M_VITE_SENTRY_DSN` - Error tracking
- `M_VITE_ANNOUNCEMENTS_URL` - Announcements endpoint
- `M_VITE_USE_TMP_DATA_DIR` - Use temp directory for testing
- `M_VITE_DISABLE_AUTO_UPDATE` - Disable updates
- `M_VITE_EMBEDDING_MODEL_MODE` - Embedding model selection
- `M_VITE_CREATE_SETUP_WINDOW` - Force setup window
- `M_VITE_APP_UPDATES_PROXY_URL` - Updates proxy
- `M_VITE_APP_UPDATES_CHANNEL` - Update channel

---

## NEXT STEPS FOR KOREAN LOCALIZATION

1. **Extract strings** from all `.svelte` files in Settings/
2. **Create i18n system** (i18next or similar)
3. **Add Korean translations** to all UI text
4. **Update Settings components** to use translation keys
5. **Test with Korean fonts** and input methods
6. **Verify RTL support** (not needed for Korean)
7. **Update dialog titles** in TypeScript files

Priority files:
- `/Users/moon/Desktop/surf-main/app/src/renderer/Settings/` (80% of UI text)
- `/Users/moon/Desktop/surf-main/app/src/main/` (Dialog titles, notifications)
- `/Users/moon/Desktop/surf-main/packages/types/src/` (Enum labels)

