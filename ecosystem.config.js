/**
 * ecosystem.config.js — PM2 process manifest.
 *
 * Single-process API server. Bump `instances` to "max" only when paired with
 * a sticky-session reverse proxy in front (Socket.IO / file uploads).
 */
module.exports = {
  apps: [
    {
      name: "server",
      script: "./dist/server.js",
      watch: false,
      ignore_watch: ["node_modules", "logs"],
      watch_options: {
        followSymlinks: false,
      },
      instances: "1",
      exec_mode: "fork",
      max_memory_restart: "1500M",
      env: {
        NODE_ENV: "development",
        TS_NODE_PROJECT: "tsconfig.json",
      },
      env_production: {
        NODE_ENV: "production",
      },
      autorestart: true,
      restart_delay: 5000,
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time: true,
      source_map_support: true,
    },
  ],
};