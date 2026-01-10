# ClockMaster

M1n6基于mm的需求 用Auto.js Pro 的 Android 自动化打卡助手，支持热更新、定时任务、推送通知。

## 功能特性

- 🔄 **热更新引擎** - 云端脚本动态加载，无需重装 APK
- ⏰ **定时任务** - 每日自动执行，支持自定义时间
- 🎲 **随机延迟** - 模拟人类操作，规避检测
- 📊 **执行历史** - 记录统计，成功率一目了然
- 📱 **PushPlus 推送** - 执行结果实时通知
- 🛡️ **权限向导** - 一键检查授权状态
- 📸 **异常截图** - 失败自动截图，便于排查

## 项目结构

```
ClockMaster/
├── project.json              # Auto.js 项目配置
├── app/
│   ├── main.js               # 主入口
│   ├── assets/
│   │   └── generate_icon.js  # 图标生成工具
│   └── modules/
│       ├── storage.js        # 配置存储
│       ├── permission.js     # 权限管理
│       ├── ui_pres.js        # 配置界面
│       ├── launcher.js       # 热更新引擎
│       ├── scheduler.js      # 定时任务
│       ├── history.js        # 执行历史
│       └── utils.js          # 工具函数
└── cloud/
    └── core_task.js          # 核心打卡逻辑 (云端部署)
```

## 快速开始

### 1. 部署云端脚本

将 `cloud/core_task.js` 上传到 GitHub 或 Gitee，获取 Raw 链接：

```
# GitHub Raw 格式
https://raw.githubusercontent.com/MinG-98/ClockMaster/main/cloud/core_task.js

# Gitee Raw 格式 (国内推荐)
https://gitee.com/用户名/ClockMaster/raw/main/cloud/core_task.js
```

### 2. 打包 APK

1. 使用 Auto.js Pro 打开项目
2. 点击菜单 → 打包应用
3. 配置签名后生成 APK

### 3. 配置使用

安装 APK 后：

1. **授权权限** - 无障碍服务、悬浮窗、存储
2. **填写配置**
   - PushPlus Token ([获取地址](https://www.pushplus.plus/))
   - 目标 App 包名
   - 云端脚本 URL
3. **设置定时** - 开启定时任务，选择执行时间
4. **立即执行** - 测试运行

## 配置说明

| 配置项 | 说明 | 示例 |
|--------|------|------|
| PushPlus Token | 推送通知令牌 | `abc123...` |
| 目标App包名 | 被自动化的应用 | `com.example.app` |
| 云端脚本URL | core_task.js 的 Raw 地址 | `https://raw...` |
| 最大随机延迟 | 执行前随机等待 (分钟) | `0-30` |
| 调试模式 | 输出详细日志 | 开/关 |

## 自定义打卡逻辑

编辑 `cloud/core_task.js` 中的 `performClockIn()` 函数：

```javascript
function performClockIn() {
    // 根据目标 App 修改以下选择器
    var entryKeywords = ["工作台", "打卡", "考勤"];
    var clockBtnKeywords = ["打卡", "上班打卡", "签到"];

    // ... 自定义逻辑
}
```

**重要原则**：
- ✅ 使用 `text()` / `desc()` 选择器
- ❌ 禁止使用 `click(x, y)` 坐标点击

## 版本管理

云端脚本支持版本号管理，在文件头部声明：

```javascript
/**
 * @version 1.0.1
 */
```

Launcher 会自动检测版本更新。

## 技术栈

- **运行环境**: Auto.js Pro 9.x / AutoX
- **目标系统**: Android 8.0 - 14.0
- **UI 框架**: Auto.js 内置 XML
- **存储**: SharedPreferences
- **网络**: HTTP (脚本拉取 + 推送通知)

## 注意事项

1. **保持 Auto.js 后台运行** - 关闭电池优化
2. **定时任务依赖 App 存活** - 建议加入白名单
3. **首次使用先手动测试** - 确认打卡流程正常
4. **敏感信息勿上传** - Token 等保存在本地

## 许可证

MIT License

## 致谢

- [Auto.js Pro](https://pro.autojs.org/)
- [PushPlus](https://www.pushplus.plus/)
