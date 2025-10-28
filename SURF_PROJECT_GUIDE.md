# Deta Surf Project Analysis - Quick Start Guide

## Project at a Glance

**Surf** is a sophisticated Electron-based desktop productivity application with deep local storage capabilities.

```
Surf Architecture Overview:

┌─────────────────────────────────────────────────────────────┐
│                    Surf Desktop App                         │
│                   (Electron + Svelte)                       │
└─────────────────────────────────────────────────────────────┘
         │
         ├─ Main Process (Node.js)
         │  ├─ IPC Event Handlers
         │  ├─ Window Management
         │  ├─ File Operations
         │  └─ User Configuration
         │
         ├─ Renderer Process (Svelte UI)
         │  ├─ Settings Interface
         │  ├─ Resource Viewer
         │  ├─ PDF Viewer
         │  └─ 94 Components
         │
         └─ Backend (Rust via NEON)
            ├─ SFFS Storage
            ├─ SQLite Database
            ├─ Resource Management
            ├─ AI/Embeddings
            └─ Background Workers
```

---

## Quick Navigation

### For Data Storage Questions
- Read: `/Users/moon/Desktop/surf-main/ARCHITECTURE_ANALYSIS.md` (Section 2)
- Files: `/Users/moon/Desktop/surf-main/packages/backend/src/store/`
- Database: `app.getPath('userData')/sffs_backend/sqlite/database.db`

### For UI/Text Questions
- Read: `/Users/moon/Desktop/surf-main/ARCHITECTURE_ANALYSIS.md` (Section 4)
- Files: `/Users/moon/Desktop/surf-main/app/src/renderer/Settings/`
- Config Types: `/Users/moon/Desktop/surf-main/packages/types/src/config.types.ts`

### For Configuration Questions
- Read: `/Users/moon/Desktop/surf-main/KEY_FILES_REFERENCE.md` (Section 7)
- Main File: `/Users/moon/Desktop/surf-main/app/src/main/config.ts`
- Storage: `userData/user.json`

### For Backend Integration
- Read: `/Users/moon/Desktop/surf-main/ARCHITECTURE_ANALYSIS.md` (Section 5)
- API File: `/Users/moon/Desktop/surf-main/packages/backend/src/api/store.rs`
- Integration: `/Users/moon/Desktop/surf-main/app/src/main/sffs.ts`

### For Build/Deployment
- Read: `/Users/moon/Desktop/surf-main/ARCHITECTURE_ANALYSIS.md` (Section 6)
- Scripts: `/Users/moon/Desktop/surf-main/app/package.json`

---

## 5-Minute Summary

### What is SFFS?
**SFFS (Surf File File System)** is the core storage:
- Hybrid system combining SQLite metadata + file storage
- Stores resources (documents, images, links) with metadata
- Located in `userData/sffs_backend/`
- Supports tagging, annotations, AI embeddings

### How is Data Organized?
```
Database (SQLite):
├── resources          - Resource metadata
├── resource_metadata  - Names, sources, descriptions
├── resource_tags      - Key-value tags for organization
├── resource_text_content - Indexed text for search
├── embedding_resources - AI embeddings
└── [8 other tables for history, spaces, jobs, etc.]

File System:
└── resources/
    ├── {resource-id-1}  - Raw file content
    ├── {resource-id-2}
    └── {resource-id-3}
```

### How are Settings Configured?
1. **Defaults** defined in `config.ts` (lines 78-126)
2. **Stored** as JSON in `user.json`
3. **UI** components bind directly to settings
4. **Updated** via IPC from renderer to main process
5. **Persisted** to disk immediately

### How Does the App Work?
```
User Action → Svelte Component → IPC Event → Main Process 
→ Rust Backend → SQLite → File System → Result Back to UI
```

---

## Key Numbers

| Metric | Value |
|--------|-------|
| Svelte Components | 94 |
| TypeScript Files | 62 |
| Rust Backend Modules | 7 major modules |
| Database Tables | 11+ tables |
| User Settings | 40+ configurable options |
| Monorepo Packages | 14+ workspaces |

---

## Critical Files by Purpose

### Data Storage & Backend
```
packages/backend/src/store/
├── db.rs                    # SQLite setup & configuration
├── resources.rs             # Resource CRUD
├── resource_tags.rs         # Tag management
├── migrations.rs            # Database migrations
└── [6 more storage files]
```

### Main Process & IPC
```
app/src/main/
├── config.ts                # User settings (430 lines)
├── sffs.ts                  # SFFS wrapper class
├── ipcHandlers.ts           # IPC event handlers
├── mainWindow.ts            # Window management
└── [12 more main files]
```

### UI Components
```
app/src/renderer/Settings/
├── Settings.svelte          # Main settings page
├── components/
│   ├── SettingsOption.svelte
│   ├── AppStylePicker.svelte
│   ├── TeletypeDefaultActionPicker.svelte
│   └── [5 more component files]
```

### Type Definitions
```
packages/types/src/
├── config.types.ts          # UserSettings interface
├── resources.types.ts       # SFFSResource interface
└── [more type files]
```

---

## Common Tasks

### Add a New Setting
1. Add field to `UserSettings` type (packages/types/src/config.types.ts)
2. Add default value (app/src/main/config.ts, lines 78-126)
3. Create UI control (Settings/components/)
4. Bind to setting: `bind:value={userConfigSettings.field_name}`

### Find Where Text is Defined
1. Check all `.svelte` files in `app/src/renderer/Settings/`
2. Look for `title=` and `description=` attributes
3. Check TypeScript files for dialog titles and messages
4. Enum values in `packages/types/src/`

### Understand the Database Schema
1. Examine `packages/backend/src/store/migrations.rs` for schema
2. Review individual store files (resources.rs, resource_tags.rs, etc.)
3. Check SQL queries in each module for table structure
4. Database files located in `userData/sffs_backend/sqlite/`

### Customize User Configuration
1. Edit default values in `app/src/main/config.ts` (lines 78-126)
2. Add migration logic if changing existing settings (lines 130-350)
3. Update type definitions in `packages/types/src/config.types.ts`
4. Settings automatically persisted to `userData/user.json`

---

## For Korean Localization

**Primary Translation Points** (80% of work):
1. Settings labels in `Settings.svelte` (25+ strings)
2. Component descriptions in `Settings/components/` (10+ files)
3. Enum values and option labels in type files
4. Dialog titles and notifications in main process

**Files to Translate** (Priority Order):
1. `/Users/moon/Desktop/surf-main/app/src/renderer/Settings/` (HIGHEST)
2. `/Users/moon/Desktop/surf-main/packages/types/src/config.types.ts`
3. `/Users/moon/Desktop/surf-main/app/src/main/` (Dialog texts)
4. `/Users/moon/Desktop/surf-main/app/src/renderer/Core/` (UI labels)

**Implementation Strategy**:
- Extract all strings to translation file
- Use i18n library (suggest: i18next)
- Create Korean translation JSON
- Update components to use translation keys
- Test with Korean input methods and fonts

---

## Development Commands

```bash
# Setup
yarn install              # Install dependencies

# Development
yarn dev                 # Start dev server with hot reload
yarn dev:silent          # Dev without warnings
yarn lint                # Check code quality
yarn format              # Auto-format code

# Build
yarn build               # Build all (desktop + backend)
yarn build:frontend      # Build UI only
yarn build:mac           # macOS build
yarn build:win:x64       # Windows x64 build
yarn build:lin:x64       # Linux x64 build
```

---

## Security Notes

- **IPC Validation**: All messages from renderer validated via `validateIPCSender()`
- **File Access**: Protected via temporary tokens and path safety checks
- **Database**: WAL mode with 60-second lock timeout for multi-tab support
- **Backups**: Automatic database backups before migrations

---

## File Location Summary

```
Project Root: /Users/moon/Desktop/surf-main/

Key Directories:
- app/                    # Electron application
  - src/main/             # Main process (Node.js)
  - src/renderer/         # UI (Svelte)
  - build/                # Build configuration
  
- packages/
  - backend/              # Rust backend
  - types/                # TypeScript definitions
  - services/             # Shared IPC services
  - ui/                   # UI components library
  
User Data (Runtime):
- macOS: ~/Library/Application Support/Surf/
- Windows: %APPDATA%/Surf/
- Linux: ~/.config/Surf/
```

---

## Documentation Files

- **ARCHITECTURE_ANALYSIS.md** - Complete technical overview (10 sections)
- **KEY_FILES_REFERENCE.md** - Quick file paths and customization guide
- **SURF_PROJECT_GUIDE.md** - This file

---

## Next Steps

1. **Understand the Architecture**
   - Read ARCHITECTURE_ANALYSIS.md sections 1-3
   - Explore the data storage structure
   - Review the Electron process model

2. **Identify Customization Points**
   - Check KEY_FILES_REFERENCE.md section 8
   - Map out localization targets
   - Plan modification strategy

3. **Set Up Development**
   - Run `yarn install` and `yarn dev`
   - Explore the Settings UI
   - Make test changes to understand the flow

4. **Implement Changes**
   - Follow the configuration system (KEY_FILES_REFERENCE.md section 7)
   - Use the security patterns (path validation, IPC validation)
   - Test thoroughly before deployment

---

## Getting Help

- **Data Storage Issues**: Check Section 2 of ARCHITECTURE_ANALYSIS.md
- **UI/Text Issues**: Check Section 4 of ARCHITECTURE_ANALYSIS.md
- **Configuration Issues**: Check KEY_FILES_REFERENCE.md Section 7
- **Backend Integration**: Check ARCHITECTURE_ANALYSIS.md Section 5
- **File Locations**: Check KEY_FILES_REFERENCE.md Sections 1-6

