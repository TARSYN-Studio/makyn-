module.exports = {
  apps: [
    {
      name: "makyn-bot",
      cwd: "/opt/makyn/apps/bot",
      script: "./dist/index.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
      env: { NODE_ENV: "production" },
      error_file: "/var/log/makyn/bot-error.log",
      out_file: "/var/log/makyn/bot-out.log",
      time: true
    },
    {
      name: "makyn-web",
      cwd: "/opt/makyn/apps/web",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: { NODE_ENV: "production", PORT: "3000" },
      error_file: "/var/log/makyn/web-error.log",
      out_file: "/var/log/makyn/web-out.log",
      time: true
    }
  ]
};
