// Wandlungen – Electron main process. SPDX-License-Identifier: MIT
'use strict';

const { app, BrowserWindow, Menu, shell, nativeTheme, session } = require('electron');
const path = require('node:path');
const pkg = require('../package.json');

const isMac = process.platform === 'darwin';
const APP_DIR = path.join(__dirname, '..', 'app');
const german = () => (app.getLocale() || '').toLowerCase().startsWith('de');

let mainWindow = null;

function openExternal(url) {
  if (/^https?:\/\//i.test(url)) shell.openExternal(url);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 840,
    minWidth: 360,
    minHeight: 520,
    title: 'Wandlungen',
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#141c2b' : '#edf1ea',
    icon: path.join(APP_DIR, 'img', 'icon.png'),
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      spellcheck: true,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.loadFile(path.join(APP_DIR, 'index.html'));

  // Links to the web open in the default browser, never inside the app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) {
      event.preventDefault();
      openExternal(url);
    }
  });
  mainWindow.on('closed', () => { mainWindow = null; });
}

function buildMenu() {
  const de = german();
  const L = de
    ? { file: 'Ablage', quit: 'Beenden', close: 'Fenster schließen', edit: 'Bearbeiten', view: 'Darstellung', reload: 'Neu laden',
      zoomReset: 'Originalgröße', zoomIn: 'Vergrößern', zoomOut: 'Verkleinern', full: 'Vollbild', window: 'Fenster', help: 'Hilfe',
      source: 'Quellcode und Hilfe', about: 'Über Wandlungen' }
    : { file: 'File', quit: 'Quit', close: 'Close window', edit: 'Edit', view: 'View', reload: 'Reload',
      zoomReset: 'Actual size', zoomIn: 'Zoom in', zoomOut: 'Zoom out', full: 'Full screen', window: 'Window', help: 'Help',
      source: 'Source code and help', about: 'About Wandlungen' };

  const helpItems = [];
  if (pkg.homepage) helpItems.push({ label: L.source, click: () => openExternal(pkg.homepage) });
  if (!isMac) {
    helpItems.push({
      label: L.about,
      click: () => mainWindow && mainWindow.webContents.executeJavaScript("location.hash = '#/about'"),
    });
  }

  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    { label: L.file, submenu: [isMac ? { role: 'close', label: L.close } : { role: 'quit', label: L.quit }] },
    { role: 'editMenu', label: L.edit },
    {
      label: L.view,
      submenu: [
        { role: 'reload', label: L.reload },
        ...(app.isPackaged ? [] : [{ role: 'toggleDevTools' }]),
        { type: 'separator' },
        { role: 'resetZoom', label: L.zoomReset },
        { role: 'zoomIn', label: L.zoomIn },
        { role: 'zoomOut', label: L.zoomOut },
        { type: 'separator' },
        { role: 'togglefullscreen', label: L.full },
      ],
    },
    { role: 'windowMenu', label: L.window },
    ...(helpItems.length ? [{ role: 'help', label: L.help, submenu: helpItems }] : []),
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.on('web-contents-created', (_event, contents) => {
    contents.on('will-attach-webview', (event) => event.preventDefault());
  });

  app.whenReady().then(() => {
    // The app needs no camera, microphone, location or notifications – only clipboard writes.
    session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
      callback(permission === 'clipboard-sanitized-write');
    });
    app.setAboutPanelOptions({
      applicationName: 'Wandlungen',
      applicationVersion: pkg.version,
      copyright: 'MIT License. I Ging nach Richard Wilhelm (1924), gemeinfrei.',
      website: pkg.homepage,
      iconPath: path.join(APP_DIR, 'img', 'icon.png'),
    });
    buildMenu();
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (!isMac) app.quit();
  });
}
