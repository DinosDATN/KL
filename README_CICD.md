# 🚀 Simple CI/CD Setup

## Tóm Tắt
Một workflow đơn giản để tự động deploy khi bạn push code vào branch main.

## 📁 Files Đã Tạo
```
.github/workflows/
└── deploy.yml            # Deploy tự động khi push

scripts/
└── deploy.sh             # Script deploy đơn giản

README_CICD.md           # Hướng dẫn này
```

## ⚡ Quick Setup (5 phút)

### 1. Tạo SSH Key
```bash
# Trên máy local (Git Bash hoặc WSL)
ssh-keygen -t rsa -b 4096 -C "github-actions@yourdomain.com" -f ~/.ssh/github_actions_key

# Xem public key (thêm vào VPS)
cat ~/.ssh/github_actions_key.pub

# Xem private key (thêm vào GitHub Secrets)  
cat ~/.ssh/github_actions_key
```

### 2. Thêm Public Key vào VPS
```bash
# SSH vào VPS
ssh username@your-vps-ip

# Thêm public key
echo "ssh-rsa AAAAB3NzaC1yc2E... github-actions@yourdomain.com" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 3. Thêm GitHub Secrets
Vào GitHub Repository → Settings → Secrets and variables → Actions

Thêm 4 secrets:
- `VPS_HOST`: IP VPS của bạn
- `VPS_USERNAME`: Username VPS  
- `VPS_SSH_KEY`: Nội dung private key từ bước 1
- `VPS_PORT`: 22

### 4. Chuẩn Bị VPS
```bash
# SSH vào VPS
ssh username@your-vps-ip

# Navigate to project
cd /var/www/KL

# Make deploy script executable  
chmod +x scripts/deploy.sh

# Create backup directory
sudo mkdir -p /var/backups/deployments
sudo chown -R $USER:$USER /var/backups/deployments

# Test deploy script
./scripts/deploy.sh
```

### 5. Test Deploy
```bash
# Commit và push để trigger deploy
git add .
git commit -m "feat: setup simple deploy"
git push origin main

# Xem progress tại GitHub → Actions tab
```

## 🎯 Kết Quả

Sau khi setup xong:
- ✅ Push vào `main` → Tự động deploy
- ✅ Tự động pull code mới
- ✅ Tự động build frontend
- ✅ Tự động restart services

## 🔧 Troubleshooting

**SSH connection failed:**
```bash
# Test SSH key
ssh -i ~/.ssh/github_actions_key username@vps-ip
```

**Deploy failed:**
```bash
# Check logs trên VPS
pm2 logs
tail -f /var/log/nginx/error.log

# Manual restart
pm2 restart all
```

**GitHub Actions failed:**
- Vào GitHub → Actions → Click vào failed run → Xem logs chi tiết

## 📚 Chi Tiết

Xem file `CI_CD_SETUP.md` để có hướng dẫn đầy đủ và advanced features.

---

**Thời gian deploy**: ~2-3 phút  
**Downtime**: ~10-20 giây