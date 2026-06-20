// metro.config.js — configured for pnpm monorepo (Turborepo)
// watchFolders lets Metro see shared packages under /packages
// nodeModulesPaths ensures symlinked deps from pnpm resolve correctly
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch the entire monorepo so changes in packages/ hot-reload in the app
config.watchFolders = [workspaceRoot];

// 2. Let Metro find modules in the monorepo root node_modules as a fallback
//    This is critical under pnpm where packages are hoisted or symlinked
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Disable the "server" package field so that browser-only overrides in
//    packages don't shadow React Native code paths
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
