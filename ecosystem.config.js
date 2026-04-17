module.exports = {
  apps: [
    {
      name: "makyn-bot",
      script: "./dist/src/index.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: { NODE_ENV: "production" },
      error_file: "/var/log/makyn/error.log",
      out_file: "/var/log/makyn/out.log",
      time: true
    }
  ]
};

