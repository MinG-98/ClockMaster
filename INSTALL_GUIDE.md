# ClockMaster 安装指南

## 步骤 1: 下载 AutoX.js（免费开源）

### 方法 A：手机直接下载（推荐）

1. **在手机浏览器中打开以下链接：**
   ```
   https://github.com/kkevsekk1/AutoX/releases/latest
   ```

2. **找到并下载对应版本：**
   - 如果手机是 **64位**：下载 `AutoJs6-vX.X.X-arm64-v8a-release.apk`
   - 如果手机是 **32位**：下载 `AutoJs6-vX.X.X-armeabi-v7a-release.apk`
   - **不确定？** 下载 universal 版本（通用版）

3. **安装 APK**
   - 下载完成后点击安装
   - 如果提示"不允许安装未知来源应用"，需要在设置中允许

### 方法 B：国内镜像（速度更快）

使用蓝奏云下载（免登录）：
```
https://wws.lanzoub.com/b00sxmjra
密码: 7890
```

### 方法 C：Gitee 镜像

```
https://gitee.com/ven6/AutoX/releases
```

---

## 步骤 2: 安装并授权

1. **安装 AutoX.js**
   - 点击下载的 APK 文件
   - 允许"从此来源安装应用"
   - 点击"安装"

2. **打开 AutoX.js 并授予权限**
   - 首次打开会请求权限
   - 授予 **存储权限**
   - 授予 **悬浮窗权限**
   - 授予 **无障碍服务**

---

## 步骤 3: 导入 ClockMaster 项目

### 方法 1: 使用 ADB 传输（电脑操作）

在电脑上运行：
```bash
cd /home/m1n6/ClockMaster
./deploy.sh
```

### 方法 2: 手动复制文件

1. 将 ClockMaster 文件夹通过 USB 复制到手机的：
   ```
   /sdcard/脚本/ClockMaster/
   ```

2. 或者压缩后通过微信/QQ 传到手机再解压

---

## 步骤 4: 运行 ClockMaster

1. 打开 AutoX.js
2. 浏览到 `/脚本/ClockMaster/`
3. 点击 `app/main.js`
4. 首次运行会请求权限，全部允许
5. 在界面中配置 Token 和目标应用
6. 点击"立即执行"测试

---

## 备用方案：使用 Auto.js 4.1.1（旧版免费）

如果 AutoX.js 不兼容，可以使用旧版 Auto.js：

**下载地址：**
```
https://github.com/hyb1996/Auto.js/releases/tag/V4.1.1.Alpha2
```

下载 `autojs-4.1.1-alpha2.apk`

---

## 常见问题

### Q: GitHub 打不开？
A: 使用国内镜像或蓝奏云链接

### Q: 提示"应用未安装"？
A: 检查手机存储空间，或先卸载旧版本

### Q: 无法授予无障碍权限？
A: 进入 设置 → 辅助功能 → 已安装的服务 → AutoX.js → 开启

### Q: AutoX.js 和 Auto.js Pro 有什么区别？
A: AutoX.js 免费开源，功能基本一致，完全满足需求

---

## 推荐配置

- **Android 版本**: 7.0 及以上
- **内存**: 2GB 及以上
- **存储**: 至少 100MB 可用空间

---

## 联系支持

如有问题，可以：
1. 查看 AutoX.js 官方文档：https://pro.autojs.org/docs/
2. 提交 Issue：https://github.com/kkevsekk1/AutoX/issues
