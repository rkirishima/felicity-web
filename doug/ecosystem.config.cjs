module.exports = {
  apps: [
    {
      name: 'telegram',
      script: 'telegram.js',
      cwd: '/Users/doug/Projects/felicity-web/doug',
      interpreter: 'node',
      env_file: '.env',
      restart_delay: 5000,
      max_restarts: 10,
    },
    {
      // Runs at 21:00 JST (end of business day) — checks for unclosed clockins
      name: 'cron-attendance',
      script: 'cron.js',
      cwd: '/Users/doug/Projects/felicity-web/doug',
      interpreter: 'node',
      env_file: '.env',
      env: { CRON_JOB: 'staff_attendance' },
      cron_restart: '0 21 * * *',  // 9pm JST daily
      autorestart: false,
      watch: false,
    },
  ],
};
