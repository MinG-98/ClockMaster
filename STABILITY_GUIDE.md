# ClockMaster 高稳定性配置指南

## 多重保障机制

为确保定时打卡的高稳定性，ClockMaster 采用多重保障机制：

### 1. 系统级闹钟 (内置)
- 使用 Android AlarmManager 设置精确闹钟
- 即使 APP 被杀死，闘钟依然生效
- 自动在启动时检测并补执行遗漏任务

### 2. 前台服务保活 (可选)
运行 `keep_alive.js` 脚本:
```
在 AutoX.js 中打开并运行 keep_alive.js
```
- 启动前台服务，显示常驻通知
- 每 30 分钟心跳检测
- 自动补执行遗漏任务

### 3. 外部触发器 (推荐)

#### 方案 A: MacroDroid (推荐，简单易用)

1. **下载安装 MacroDroid** (Play Store)

2. **创建上班打卡宏:**
   - 触发器: 日期/时间 → 每天时间 → 08:55 (比打卡时间提前5分钟)
   - 动作: 应用程序 → 启动快捷方式 → AutoX.js → 运行脚本
   - 选择脚本: `/sdcard/脚本/ClockMaster/auto_clock.js`

3. **创建下班打卡宏:**
   - 触发器: 日期/时间 → 每天时间 → 17:55
   - 动作: 同上

#### 方案 B: Tasker

1. **创建 Profile:**
   - 触发条件: Time → 设置时间

2. **创建 Task:**
   - Action: Code → Run Shell
   ```
   am start -n org.autojs.autoxjs.v6/.external.open.RunIntentActivity -a android.intent.action.VIEW -d "file:///sdcard/脚本/ClockMaster/auto_clock.js"
   ```

#### 方案 C: 系统闹钟 + 自动化

1. 设置手机闹钟 (08:55, 17:55)
2. 使用 MacroDroid 监听闹钟触发事件
3. 自动运行 auto_clock.js

---

## 手机设置优化

### 三星手机

1. **设置 → 电池 → 后台使用限制**
   - 将 ClockMaster 和 AutoX.js 设为「不受限」

2. **设置 → 应用程序 → ClockMaster → 电池**
   - 选择「无限制」

3. **设置 → 电池 → 更多电池设置**
   - 关闭「将未使用的应用程序置于睡眠状态」
   - 或将 ClockMaster 添加到「永不睡眠的应用程序」

### 其他安卓手机

1. 关闭电池优化 (ClockMaster + AutoX.js)
2. 允许后台运行
3. 锁定在最近任务列表中 (上滑锁定)

---

## 文件说明

| 文件 | 用途 |
|------|------|
| `auto_clock.js` | 自动打卡脚本，供外部触发器调用 |
| `keep_alive.js` | 前台服务保活脚本 |
| `app/main.js` | 主应用程序入口 |
| `app/modules/scheduler.js` | 定时任务模块 (系统闹钟) |

---

## 故障排除

### Q: 定时任务没有执行？

1. 检查 AutoX.js 是否有后台运行权限
2. 检查是否开启了电池优化
3. 运行 `keep_alive.js` 保活服务
4. 配置 MacroDroid 作为备用触发

### Q: 打卡失败？

1. 检查无障碍服务是否开启
2. 检查悬浮窗权限
3. 检查云端脚本 URL 是否正确
4. 查看执行历史中的错误信息

### Q: 如何验证定时任务已设置？

在 ClockMaster APP 中查看「下次执行」时间，或查看 AutoX.js 日志输出。

---

## 推荐配置组合

**最高稳定性 (推荐):**
1. ✅ 开启 APP 内定时打卡
2. ✅ 运行 keep_alive.js 保活服务
3. ✅ 配置 MacroDroid 定时触发
4. ✅ 关闭电池优化

**一般稳定性:**
1. ✅ 开启 APP 内定时打卡
2. ✅ 关闭电池优化

---

*更新时间: 2026-01-13*
