# Git 配置说明

## ✅ 当前配置状态

### 远程仓库
- **GitHub**: git@github.com:MinG-98/ClockMaster.git
- **Gitee**: git@gitee.com:MinG-98/ClockMaster.git

### SSH 密钥
- ✅ 已配置 SSH 密钥
- ✅ GitHub 认证成功
- ✅ Gitee 认证成功
- 🔑 密钥类型: ed25519

### 自动认证
- ✅ 推送到 GitHub 无需密码
- ✅ 推送到 Gitee 无需密码
- ✅ 开发工具可以自动连接

---

## 📝 SSH 公钥信息

**位置**: `~/.ssh/id_ed25519.pub`

**公钥内容**:
```
ssh-ed25519 AAAA...your_public_key... your_email@example.com
```

**已添加到**:
- ✅ GitHub: https://github.com/settings/keys
- ✅ Gitee: https://gitee.com/profile/sshkeys

---

## 🚀 使用方法

### 方式1: 使用一键同步脚本（推荐）

```bash
cd /home/m1n6/ClockMaster
./sync_all.sh
```

脚本会自动：
1. 检查是否有未提交的更改
2. 添加所有更改到暂存区
3. 提示输入提交信息
4. 自动推送到 GitHub
5. 自动推送到 Gitee

### 方式2: 手动 Git 命令

```bash
cd /home/m1n6/ClockMaster

# 查看状态
git status

# 添加更改
git add .

# 提交
git commit -m "提交信息"

# 推送到 GitHub
git push origin main

# 推送到 Gitee
git push gitee main

# 或者一次推送到所有远程仓库
git push --all
```

### 方式3: 自动化工具操作

使用开发工具时，可以直接：
- ✅ 读取代码
- ✅ 修改代码
- ✅ 提交更改
- ✅ 推送到 GitHub 和 Gitee
- ✅ 全程无需输入密码

---

## 🔄 日常工作流程

### 1. 修改代码
```bash
# 编辑文件
vim cloud/core_task.js

# 或使用其他编辑器
```

### 2. 同步到远程
```bash
# 使用一键脚本
./sync_all.sh

# 或手动推送
git add .
git commit -m "更新打卡逻辑"
git push origin main
git push gitee main
```

### 3. 部署到手机（如果使用本地模式）
```bash
adb push cloud/core_task.js /sdcard/脚本/ClockMaster/cloud/
```

### 4. 部署到手机（如果使用云端模式）
- 无需操作！
- 在手机上点击"强制更新"即可自动拉取最新版本

---

## 🔧 故障排查

### SSH 连接测试

```bash
# 测试 GitHub
ssh -T git@github.com

# 测试 Gitee
ssh -T git@gitee.com
```

**预期输出**:
```
# GitHub
Hi MinG-98! You've successfully authenticated...

# Gitee
Hi MinG(@MinG-98)! You've successfully authenticated...
```

### 如果连接失败

1. **检查 SSH 密钥是否存在**:
   ```bash
   ls -la ~/.ssh/id_ed25519*
   ```

2. **检查公钥是否添加到平台**:
   - GitHub: https://github.com/settings/keys
   - Gitee: https://gitee.com/profile/sshkeys

3. **重新生成密钥（如果需要）**:
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

4. **添加到 SSH agent**:
   ```bash
   eval "$(ssh-agent -s)"
   ssh-add ~/.ssh/id_ed25519
   ```

---

## 📊 仓库同步状态

可以随时查看两个仓库的同步状态：

```bash
# 查看远程仓库
git remote -v

# 查看分支状态
git branch -vv

# 查看最近提交
git log --oneline -5
```

---

## 🌐 访问地址

### GitHub
- 仓库: https://github.com/MinG-98/ClockMaster
- Raw URL: https://raw.githubusercontent.com/MinG-98/ClockMaster/main/cloud/core_task.js

### Gitee
- 仓库: https://gitee.com/MinG-98/ClockMaster
- Raw URL: https://gitee.com/MinG-98/ClockMaster/raw/main/cloud/core_task.js

---

## 💡 提示

- ✅ SSH 密钥永久有效，无需每次输入密码
- ✅ 开发工具可以自动推送，无需手动操作
- ✅ 一键脚本简化日常工作流程
- ✅ 国内用户推荐使用 Gitee Raw URL（速度更快）

---

**最后更新**: 2026-01-13
