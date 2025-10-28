/**
 * MODIFIED FILE - electron-builder-config.js
 *
 * This file has been modified from the original Deta Surf project.
 * Changes: Updated productName, appId, and maintainer information
 *
 * Original work Copyright 2025 Deta GmbH
 * Licensed under the Apache License, Version 2.0
 *
 * Derivative work modifications Copyright 2025 김문정
 * See NOTICE file for complete modification details
 */

const productName = process.env.PRODUCT_NAME || '배움의 달인'

const params = {
  buildName: process.env.BUILD_TAG ? `${productName}-${process.env.BUILD_TAG}` : productName,
  buildResourcesDir: process.env.BUILD_RESOURCES_DIR,
  appVersion: process.env.APP_VERSION || '1.0.0'
}

function electronBuilderConfig() {
  return {
    appId: 'com.kimmonjung.learningmaster',
    productName: params.buildName,
    directories: {
      buildResources: params.buildResourcesDir || 'build/resources/prod'
    },
    extraMetadata: {
      version: params.appVersion
    },
    files: [
      '!**/backend/target*',
      '!**/backend/src/*',
      '!**/backend/migrations/*',
      '!**/backend-server/target*',
      '!**/backend-server/src/*',
      '!**/trackpad/target*',
      '!**/trackpad/src/*',
      '!**/.vscode/*',
      '!src/*',
      '!electron.vite.config.{js,ts,mjs,cjs}',
      '!{.eslintignore,.eslintrc.cjs,.prettierignore,.prettierrc.yaml,CHANGELOG.md,README.md}',
      '!{.env,.env.*,.npmrc,pnpm-lock.yaml}',
      '!{tsconfig.json,tsconfig.node.json,tsconfig.web.json}',
      '!**/*.js.map'
    ],
    asar: true,
    asarUnpack: ['resources/**', '**/*.node', '**/main/imageProcessor.js*'],
    afterPack: 'build/afterpack.js',
    protocols: [
      {
        name: 'HTTP link',
        schemes: ['http', 'https']
      },
      {
        name: 'File',
        schemes: ['file']
      }
    ],
    win: {
      executableName: params.buildName,
      target: ['nsis']
    },
    nsis: {
      artifactName: `${params.buildName}-${params.appVersion}-setup.\${ext}`,
      shortcutName: params.buildName,
      uninstallDisplayName: params.buildName,
      createDesktopShortcut: 'always',
      include: 'build/installer.nsh',
      perMachine: true,
      allowElevation: true,
      deleteAppDataOnUninstall: false
    },
    mac: {
      identity: null, // this skips code signing
      extendInfo: [
        "NSCameraUsageDescription: Application requests access to the device's camera.",
        "NSMicrophoneUsageDescription: Application requests access to the device's microphone.",
        "NSDocumentsFolderUsageDescription: Application requests access to the user's Documents folder.",
        "NSDownloadsFolderUsageDescription: Application requests access to the user's Downloads folder.",
        'NSScreenCaptureUsageDescription: Application requests access to capture the screen.'
      ]
    },
    dmg: {
      artifactName: `${params.buildName}-${params.appVersion}.\${arch}.\${ext}`
    },
    linux: {
      target: ['AppImage'],
      maintainer: '김문정',
      artifactName: `${params.buildName}-${params.appVersion}.\${arch}.\${ext}`,
      category: 'WebBrowser'
    },
    npmRebuild: true,
    fileAssociations: [
      {
        name: 'Hypertext Markup Language',
        isPackage: true,
        role: 'Editor',
        rank: 'Default',
        ext: 'html'
      }
    ]
  }
}

module.exports = electronBuilderConfig
