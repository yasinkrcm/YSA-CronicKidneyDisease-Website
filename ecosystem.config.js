module.exports = {
  apps: [
    {
      name: "ysa-backend",
      script: "main.py",
      interpreter: "python3", // Ubuntu'da genellikle python3 kullanılır. Eğer venv varsa: "./venv/bin/python" yazın.
      cwd: "./backend",
      env: {
        PORT: 8001,
      }
    },
    {
      name: "ysa-frontend",
      script: "npm",
      args: "run start",
      cwd: "./frontend",
      env: {
        PORT: 3000,
      }
    }
  ]
};
