# Gitee 云端脚本部署指南

## 步骤 1: 创建 Gitee 仓库

1. 访问 https://gitee.com
2. 登录账号（如果没有账号需要注册）
3. 点击右上角 "+" → "新建仓库"
4. 填写仓库信息：
   - 仓库名称: `ClockMaster`
   - 路径: `clockmaster`
   - 是否开源: **公开**（必须公开才能访问 Raw）
   - 其他默认即可
5. 点击"创建"

## 步骤 2: 推送代码到 Gitee

### 方法 A: 使用 Git 命令（推荐）

```bash
cd /home/m1n6/ClockMaster

# 添加 Gitee 远程仓库
git remote add gitee git@gitee.com:你的用户名/ClockMaster.git

# 或者使用 HTTPS (需要输入密码)
git remote add gitee https://gitee.com/你的用户名/ClockMaster.git

# 推送代码
git push gitee main
```

### 方法 B: 从 GitHub 导入（最简单）

1. 在 Gitee 创建仓库时，选择"导入已有仓库"
2. 填入 GitHub URL: `https://github.com/MinG-98/ClockMaster.git`
3. 点击"导入"，Gitee 会自动同步

## 步骤 3: 获取 Gitee Raw URL

推送成功后，你的 Raw URL 格式为：

```
https://gitee.com/你的用户名/ClockMaster/raw/main/cloud/core_task.js
```

例如，如果你的 Gitee 用户名是 `ming98`：
```
https://gitee.com/ming98/ClockMaster/raw/main/cloud/core_task.js
```

## 步骤 4: 配置到 App

1. 打开 AutoX.js，运行 `app/main.js`
2. 在"云端脚本URL"输入框填入 Gitee Raw URL
3. 点击"保存配置"
4. 点击"强制更新"测试

## 步骤 5: 验证部署

测试 URL 是否可访问：
```bash
curl -I https://gitee.com/你的用户名/ClockMaster/raw/main/cloud/core_task.js
```

如果返回 `200 OK`，说明部署成功！

## 自动同步 GitHub → Gitee

如果你希望每次更新 GitHub 后自动同步到 Gitee：

### 选项 1: Gitee 仓库设置同步

1. 进入 Gitee 仓库页面
2. 点击"管理" → "仓库镜像管理"
3. 添加 GitHub 仓库地址
4. 设置定时同步（如每小时同步一次）

### 选项 2: 使用 Git 命令手动同步

```bash
# 从 GitHub 拉取最新
git pull origin main

# 推送到 Gitee
git push gitee main

# 或者一键推送到所有远程仓库
git push --all
```

## 国内访问速度对比

| 平台 | Raw URL 访问速度 | 稳定性 |
|------|----------------|--------|
| GitHub Raw | 较慢 (国际线路) | 不稳定 |
| Gitee Raw | 快速 (国内 CDN) | 稳定 ⭐ |

**建议**: 国内用户优先使用 Gitee！
