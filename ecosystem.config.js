module.exports = {
  apps: [
    {
      name: "ysa-backend",
      script: "main.py",
      interpreter: "python", // Eğer virtualenv (venv) kullanıyorsanız, buraya venv/Scripts/python yolunu yazın
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
