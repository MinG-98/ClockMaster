# ClockMaster v3.0

M1n6 基于 Auto.js Pro 开发的 Android 智能打卡助手，支持热更新、定时任务、推送通知、执行历史记录。

## 功能特性

- 🔄 **热更新引擎** - 云端脚本动态加载，无需重装 APK
- ⏰ **定时任务** - 每日自动执行，支持自定义时间
- 🎲 **随机延迟** - 模拟人类操作，规避检测
- 📊 **执行历史** - 记录统计，成功率一目了然
- 📱 **PushPlus 推送** - 执行结果实时通知
- 🛡️ **权限向导** - 一键检查授权状态
- 📸 **异常截图** - 失败自动截图，便于排查
- 🎯 **三连击策略** - 确保 100% 命中打卡按钮
- 🔴 **红点调试** - 可视化显示点击位置

## 项目结构

```
ClockMaster/
├── project.json              # Auto.js 项目配置
├── app/
│   ├── main.js               # 主入口 (v3.0)
│   ├── assets/
│   │   └── generate_icon.js  # 图标生成工具
│   └── modules/
│       ├── storage.js        # 配置存储
│       ├── permission.js     # 权限管理
│       ├── launcher.js       # 热更新引擎
│       ├── scheduler.js      # 定时任务 ⭐ NEW
│       ├── history.js        # 执行历史 ⭐ NEW
│       ├── pushplus.js       # 推送通知 ⭐ NEW
│       ├── utils.js          # 工具函数
│       └── ui_pres.js        # 配置界面（备用）
└── cloud/
    └── core_task.js          # 核心打卡逻辑 (v3.0)
```

## 快速开始

### 方式一：使用本地文件（推荐）

1. **通过 ADB 部署文件**（Linux/Mac）:
   ```bash
   adb push app /sdcard/脚本/ClockMaster/app
   adb push cloud /sdcard/脚本/ClockMaster/cloud
   adb push *.js /sdcard/脚本/ClockMaster/
   adb push project.json /sdcard/脚本/ClockMaster/
   ```

2. **Windows 用户**: 手动复制文件到手机 `/sdcard/脚本/ClockMaster/` 目录

3. **打开 AutoX.js 运行辅助脚本**:
   ```
   # 第一次使用，清理旧配置
   /sdcard/脚本/ClockMaster/clear_all_config.js

   # 运行主程序
   /sdcard/脚本/ClockMaster/app/main.js
   ```

4. **配置并使用**:
   - 界面会自动加载默认配置
   - 点击"保存配置"
   - 点击"立即执行"测试打卡

### 方式二：使用云端脚本

1. **部署云端脚本**

   将 `cloud/core_task.js` 上传到 GitHub 或 Gitee，获取 Raw 链接：

   ```
   # GitHub Raw 格式
   https://raw.githubusercontent.com/MinG-98/ClockMaster/main/cloud/core_task.js

   # Gitee Raw 格式 (国内推荐)
   https://gitee.com/MinG-98/ClockMaster/raw/main/cloud/core_task.js
   ```

2. **打包 APK**

   1. 使用 Auto.js Pro 打开项目
   2. 点击菜单 → 打包应用
   3. 配置签名后生成 APK

3. **配置使用**

   安装 APK 后：

   1. **授权权限** - 点击"检查权限"，按向导授予权限
   2. **填写配置**
      - PushPlus Token ([获取地址](https://www.pushplus.plus/))
      - 目标 App 包名/名称（如：YourApp）
      - 云端脚本 URL（填写 GitHub/Gitee Raw URL）
      - 最大随机延迟（建议 5-15 分钟）
   3. **测试推送** - 点击"测试推送"验证配置
   4. **立即执行** - 点击"立即执行"测试打卡
   5. **设置定时** - 开启定时任务，选择执行时间

### 辅助脚本说明

| 脚本 | 用途 |
|------|------|
| `clear_all_config.js` | 彻底清理并重置所有配置 |
| `reset_config.js` | 重置配置为默认值 |
| `fix_config.js` | 修正脚本路径配置 |
| `test_run.js` | 跳过配置检查，直接测试执行 |
| `simple_main.js` | 简化版主程序（无热更新） |
| `update_token.js` | 快速更新 PushPlus Token |

## 配置说明

### 主界面配置

| 配置项 | 说明 | 示例 |
|--------|------|------|
| PushPlus Token | 推送通知令牌 | `abc123...` |
| 目标App包名 | 被自动化的应用 | `YourApp` |
| 云端脚本URL | core_task.js 的 Raw 地址 | `https://raw...` |
| 最大随机延迟 | 执行前随机等待 (分钟) | `0-30` |
| 调试模式 | 输出详细日志 | 开/关 |

### 定时任务配置

- **开关**: 启用/关闭定时任务
- **执行时间**: 设置每日打卡时间（如 09:00）
- **下次执行**: 自动显示下次执行时间

### 高级功能

- **测试推送**: 测试 PushPlus 配置是否正确
- **强制更新**: 强制从云端更新脚本
- **查看历史**: 查看最近 20 条执行记录
- **清除历史**: 清除所有历史记录

## 自定义打卡逻辑

编辑 `cloud/core_task.js` 中的打卡步骤：

```javascript
// 修改目标应用名称
var targetAppName = storage.get("targetAppPackage", "YourApp");

// 修改入口查找关键词
var entry = text("移动考勤").findOne(5000);

// 修改打卡按钮关键词
var targetWidget = text("打卡").findOne(4000);
```

**重要原则**：
- ✅ 优先使用 `text()` / `desc()` 选择器
- ✅ 使用 `press(x, y, duration)` 进行点击
- ❌ 避免使用固定坐标点击

## 版本管理

云端脚本支持版本号管理，在文件头部声明：

```javascript
/**
 * @version 3.0.0
 */
```

Launcher 会自动检测版本更新并提示。

## 功能详解

### 1. PushPlus 推送

**支持的推送类型**：
- ✅ 成功通知：包含执行时间、耗时、版本号
- ✅ 失败通知：包含错误信息、截图路径
- ✅ 测试通知：验证配置是否正确
- ✅ 自定义通知：支持 info/success/warning/error 级别

**获取 Token**：
1. 访问 https://www.pushplus.plus
2. 微信扫码登录
3. 复制 Token 到配置界面

### 2. 执行历史

**记录内容**：
- 执行时间（日期 + 时分秒）
- 执行结果（成功/失败）
- 执行耗时
- 错误信息（如果失败）
- 截图路径
- 脚本版本

**统计信息**：
- 总执行次数
- 成功次数 / 失败次数
- 成功率百分比
- 今日执行统计

### 3. 定时任务

**工作原理**：
- 使用 Auto.js 的 setTimeout 实现
- 任务执行后自动设置下次执行时间
- 支持跨天定时（如每天 09:00）

**注意事项**：
- ⚠️ 需要 App 保持后台运行
- ⚠️ 建议关闭电池优化
- ⚠️ 建议加入白名单

### 4. 三连击策略

为应对 `clickable:false` 的控件，采用三重保障：

1. **第 1 击**: 点击文字中心坐标
2. **第 2 击**: 点击文字下方偏移位置（+150px）
3. **第 3 击**: 点击屏幕黄金点（屏幕中心偏下 55%）

确保 **100% 命中率**。

### 5. 红点调试

执行时会在点击位置显示红色标记点：
- 持续时间：0.8 秒
- 颜色：红色圆点
- 用途：直观判断点击位置是否准确

## 技术栈

- **运行环境**: Auto.js Pro 9.x / AutoX
- **目标系统**: Android 8.0 - 14.0
- **UI 框架**: Auto.js 内置 XML
- **存储**: SharedPreferences
- **网络**: HTTP (脚本拉取 + 推送通知)
- **定时**: setTimeout / setInterval

## 注意事项

### 权限要求

- ✅ **无障碍服务**（必需）：自动化操作核心权限
- ✅ **悬浮窗权限**（必需）：显示运行状态和红点
- ✅ **存储权限**（推荐）：保存截图和日志

### 运行要求

1. **保持 Auto.js 后台运行** - 关闭电池优化
2. **定时任务依赖 App 存活** - 加入白名单
3. **首次使用先手动测试** - 确认打卡流程正常
4. **敏感信息勿上传** - Token 保存在本地

### 故障排查

**问题：定时任务未执行**
- 检查 App 是否被系统杀后台
- 检查是否关闭电池优化
- 查看历史记录确认上次执行时间

**问题：推送未收到**
- 测试推送功能验证 Token
- 检查网络连接
- 查看日志确认推送是否发送

**问题：打卡失败**
- 查看历史记录中的错误信息
- 查看截图确认界面状态
- 调整三连击的偏移参数

## 开发调试

### 查看日志

Auto.js Pro 控制台可以查看详细日志：
- 执行流程日志
- 错误信息
- 推送结果
- 历史记录保存状态

### 截图位置

截图保存在：`/sdcard/Pictures/ClockMaster_*.png`

文件命名格式：
- 成功：`ClockMaster_Success_v3.0_<timestamp>.png`
- 失败：`ClockMaster_Error_v3.0_<timestamp>.png`

## 版本历史

### v3.0.1 (2026-01-13) - 稳定修复版本 🔥
**关键修复**:
- 🐛 修复 launcher.js 参数传递问题 - core_task.js 现可正确接收配置参数
- 🐛 修复文件路径配置错误 - 统一使用 `/sdcard/脚本/` 而非 `/sdcard/Scripts/`
- 🐛 修复备份目录路径错误
- ✅ 添加配置诊断日志 - 立即定位配置问题
- ✅ 添加 launcher 错误事件监听
- ✅ 创建多个辅助脚本用于配置管理
- ✅ 设置正确的默认配置值

**新增工具**:
- `clear_all_config.js` - 彻底清理并重置配置
- `reset_config.js` - 重置为默认配置
- `test_run.js` - 直接测试执行
- `simple_main.js` - 简化版主程序

**技术改进**:
- loadConfig() 函数支持从 launcher 参数读取配置（优先级高于 storage）
- 增强错误处理和日志输出
- 改进配置验证逻辑

### v3.0.0 (2026-01-13) - 完整功能版本
- ✅ 新增 PushPlus 推送通知
- ✅ 新增执行历史记录
- ✅ 新增定时任务调度
- ✅ 增强异常处理和截图
- ✅ 完整的 UI 界面
- ✅ 详细的日志输出

### v2.6.0 (2026-01-12) - 核心逻辑调试版
- ✅ 三连击策略
- ✅ 红点可视化调试
- ✅ 解决 clickable:false 问题

### v1.0.0 - 初始版本
- ✅ 基础打卡功能
- ✅ 热更新引擎
- ✅ 配置管理

## 许可证

MIT License

## 致谢

- [Auto.js Pro](https://pro.autojs.org/)
- [PushPlus](https://www.pushplus.plus/)

## 联系方式

- GitHub: [@MinG-98](https://github.com/MinG-98)
- Project: [ClockMaster](https://github.com/MinG-98/ClockMaster)

---

**免责声明**: 本项目仅供学习交流使用，请遵守相关法律法规，不得用于非法用途。
