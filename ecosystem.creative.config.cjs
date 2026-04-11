module.exports = {
  apps: [
    {
      name:        "leadmine-creative",
      script:      "node_modules/.bin/tsx",
      args:        "scripts/creative-worker.ts",
      autorestart: true,   // restart if it crashes
      watch:       false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};