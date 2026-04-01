module.exports = {
  apps: [
    {
      name:         "leadmine-creative",
      script:       "node_modules/.bin/tsx",
      args:         "scripts/creative-worker.ts",
      cron_restart: "0 */6 * * *",
      autorestart:  false,
      watch:        false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
