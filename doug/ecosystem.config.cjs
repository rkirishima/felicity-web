module.exports = {
  apps: [{
    name: 'doug',
    script: 'telegram.js',
    cwd: '/Users/doug/Projects/felicity-web/doug',
    interpreter: 'node',
    env_file: '.env',
    restart_delay: 5000,
    max_restarts: 10,
  }]
};
