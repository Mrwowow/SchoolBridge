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

// 3. Enable package "exports" resolution. react-query (and other modern libs)
//    rely on the exports map to pick ONE consistent build. With it disabled,
//    Metro falls back to legacy main/react-native fields, which can resolve the
//    QueryClientProvider and the consumer hooks to DIFFERENT builds — two
//    QueryClientContext objects → "No QueryClient set".
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
