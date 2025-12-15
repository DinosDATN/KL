module.exports = {
    apps: [
        {
            name: 'api-backend',
            script: 'src/app.js',
            cwd: '/var/www/KL/api',    // 🔄 Thay KL bằng tên thư mục dự án
            instances: 'max',                    // Sử dụng tất cả CPU cores
            exec_mode: 'cluster',                // Cluster mode cho performance tốt hơn
            env: {
                NODE_ENV: 'production',
                PORT: 3000
            },
            error_file: '/var/log/pm2/api-backend-error.log',
            out_file: '/var/log/pm2/api-backend-out.log',
            log_file: '/var/log/pm2/api-backend.log',
            time: true,
            autorestart: true,
            max_restarts: 10,
            min_uptime: '10s',
            max_memory_restart: '1G'
        },
        {
            name: 'ai-service',
            script: '/var/www/KL/ai/venv/bin/python',
            args: '-m uvicorn service:app --host 0.0.0.0 --port 8000',
            cwd: '/var/www/KL/ai',
            instances: 1,
            exec_mode: 'fork',
            env_file: '/var/www/KL/ai/.env',
            env: {
                PYTHONPATH: '/var/www/KL/ai',
                NODE_API_URL: 'http://localhost:3000',
                OPENROUTER_API_KEY: 'your_openrouter_api_key_here'  // 🔄 Thay bằng API key thật
            },
            error_file: '/var/log/pm2/ai-service-error.log',
            out_file: '/var/log/pm2/ai-service-out.log',
            log_file: '/var/log/pm2/ai-service.log',
            time: true,
            autorestart: true,
            max_restarts: 10,
            min_uptime: '10s',
            max_memory_restart: '2G'
        }
    ]
};