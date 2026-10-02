module.exports = {
  apps: [
    {
      name: "server",
      script: "./dist/server.js",

      instances: 1,
      exec_mode: "fork",

      max_memory_restart: "512M",

      autorestart: true,
      restart_delay: 3000,

      error_file: "/app/logger/error.log",
      out_file: "/app/logger/out.log",
      log_file: "/app/logger/combined.log",

      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
