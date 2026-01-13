# ClockMaster 开发日志 - 2026年1月13日

## 📅 日期
2026年1月13日

## 👤 开发者
MinG-98 & Claude Code

---

## 🎯 今日目标
修复 ClockMaster v3.0 执行失败问题，实现完整功能的稳定运行。

---

## 🐛 发现的问题

### 问题1: 任务启动失败
**现象**:
- 用户点击"立即执行"后显示"任务启动失败"
- 原有 v2.6 版本可以正常运行，v3.0 版本无法执行

**根本原因**:
1. **配置参数传递失败**: launcher.js 通过 `engines.execScript()` 的 `arguments` 参数传递配置，但 core_task.js 的 `loadConfig()` 函数完全忽略了这些参数，仍然尝试从 storage 读取
2. **Storage 上下文隔离**: 通过 `engines.execScript()` 启动的脚本可能无法访问父脚本的 storage 上下文
3. **配置为空导致崩溃**: `config.targetAppName` 为 undefined，导致 `launchApp(undefined)` 失败

### 问题2: 文件路径配置错误
**现象**:
- 日志显示 "本地文件不存在: /sdcard/Scripts/ClockMaster/..."
- 实际文件在 `/sdcard/脚本/ClockMaster/`

**原因**:
1. launcher.js 的备份目录路径使用了错误的 "ClockMaster" 而非 "脚本/ClockMaster"
2. 用户旧配置中保存的是英文路径 "Scripts"
3. 多处代码不统一

### 问题3: 默认配置缺失
**现象**:
- 用户首次打开界面，cloudScriptUrl 为空
- 未填写 URL 导致无法加载脚本

**原因**:
- storage.js 的 DEFAULT_CONFIG 中 cloudScriptUrl 为空字符串
- main.js loadConfig() 没有提供有效的默认值

---

## ✅ 解决方案

### 修复1: core_task.js 支持参数传递

**文件**: `cloud/core_task.js` (line 217-236)

**修改前**:
```javascript
function loadConfig() {
    var storage = storages.create("clockmaster_config");
    return {
        targetAppName: storage.get("targetAppPackage", "农商云办公"),
        maxDelay: parseInt(storage.get("maxRandomDelay", "0")),
        pushplusToken: storage.get("pushplusToken", ""),
        debugMode: storage.get("debugMode", false)
    };
}
```

**修改后**:
```javascript
function loadConfig() {
    // Try to get config from launcher arguments first
    try {
        var launcherArgs = engines.myEngine().execArgv;
        if (launcherArgs && launcherArgs.arguments && launcherArgs.arguments.config) {
            log("✅ 使用 Launcher 传递的配置");
            return launcherArgs.arguments.config;
        }
    } catch (e) {
        log("⚠️ 无法读取 Launcher 参数，使用存储配置: " + e.message);
    }

    // Fallback to storage
    log("📂 从存储中读取配置");
    var storage = storages.create("clockmaster_config");
    return {
        targetAppName: storage.get("targetAppPackage", "农商云办公"),
        maxDelay: parseInt(storage.get("maxRandomDelay", "0")),
        pushplusToken: storage.get("pushplusToken", ""),
        debugMode: storage.get("debugMode", false)
    };
}
```

**效果**:
- ✅ 优先使用 launcher 传递的配置（解决主要问题）
- ✅ 向后兼容，fallback 到 storage 读取
- ✅ 清晰的日志输出

### 修复2: 添加配置诊断日志

**文件**: `cloud/core_task.js` (line 18-33)

**新增代码**:
```javascript
var config = loadConfig();

// 配置诊断
log("========== 配置诊断 ==========");
log("targetAppName: " + (config.targetAppName || "UNDEFINED"));
log("maxDelay: " + (config.maxDelay || "UNDEFINED"));
log("pushplusToken: " + (config.pushplusToken ? "已设置 (长度: " + config.pushplusToken.length + ")" : "未设置"));
log("debugMode: " + config.debugMode);
log("==============================");

if (!config.targetAppName) {
    throw new Error("致命错误：targetAppName 未配置！请检查配置是否正确保存。");
}
```

**效果**:
- ✅ 立即发现配置问题
- ✅ Fail-fast 原则，避免后续神秘错误
- ✅ 便于远程诊断

### 修复3: Launcher 错误处理

**文件**: `app/modules/launcher.js` (line 355-375)

**新增代码**:
```javascript
execution.on("error", function(error) {
    log("❌ 核心任务执行错误: " + error);
    toast("❌ 任务执行失败: " + error);
});
```

**效果**:
- ✅ 捕获脚本运行时错误
- ✅ 向用户显示具体错误信息

### 修复4: 统一文件路径

**修改的文件**:
1. `app/modules/launcher.js` (line 9)
   ```javascript
   // 修改前: var BACKUP_DIR = "/sdcard/ClockMaster/";
   // 修改后:
   var BACKUP_DIR = "/sdcard/脚本/ClockMaster/";
   ```

2. `app/modules/storage.js` (line 12-16)
   ```javascript
   var DEFAULT_CONFIG = {
       pushplusToken: "45552f26c7f949d09a135ff0caec71f6",
       targetAppPackage: "农商云办公",
       cloudScriptUrl: "file:///sdcard/脚本/ClockMaster/cloud/core_task.js",
       // ...
   };
   ```

3. `app/main.js` (line 127-129)
   ```javascript
   ui.token.setText(config.pushplusToken || "45552f26c7f949d09a135ff0caec71f6");
   ui.pkg.setText(config.targetAppPackage || "农商云办公");
   ui.url.setText(config.cloudScriptUrl || "file:///sdcard/脚本/ClockMaster/cloud/core_task.js");
   ```

**效果**:
- ✅ 全部路径统一为 `/sdcard/脚本/ClockMaster/`
- ✅ 提供正确的默认配置值

### 修复5: 创建辅助脚本

**新建文件**:

1. **clear_all_config.js** - 彻底清理旧配置
   - 清空所有 storage
   - 写入正确的默认配置
   - 显示配置详情

2. **reset_config.js** - 重置为默认配置
   - 覆盖现有配置
   - 保留其他数据

3. **test_run.js** - 直接测试执行
   - 跳过 launcher 逻辑
   - 直接加载 core_task.js
   - 用于快速测试

4. **simple_main.js** - 简化版主程序
   - 移除热更新功能
   - 直接执行本地脚本
   - 类似 v2.6 的简单逻辑

---

## 📊 技术分析

### v2.6 vs v3.0 架构对比

**v2.6 (工作正常)**:
```
main.js → 读取 storage → engines.execScript(scriptCode)
                              ↓
                         core_task.js 读取 storage → 执行
```
- 简单直接
- 共享 storage 上下文
- 无参数传递

**v3.0 (初始版本 - 有问题)**:
```
main.js → Launcher.launch() → 读取 storage → 传递 config 参数
                                                ↓
                                    engines.execScript(script, {arguments: {config}})
                                                ↓
                                           core_task.js
                                                ↓
                                      IGNORE 参数，尝试读 storage
                                                ↓
                                      Storage 为空 → 失败 ❌
```
- 过度设计
- 参数传递断层
- Storage 上下文隔离

**v3.0.1 (修复后)**:
```
main.js → Launcher.launch() → 读取 storage → 传递 config 参数
                                                ↓
                                    engines.execScript(script, {arguments: {config}})
                                                ↓
                                           core_task.js
                                                ↓
                            loadConfig() 优先读取 arguments.config ✅
                                                ↓
                                      Fallback to storage (兼容性)
                                                ↓
                                          成功执行 ✅
```
- 正确的参数传递
- 向后兼容
- 清晰的降级逻辑

---

## 📦 部署流程

### 文件部署
```bash
# 清理旧文件
adb shell "rm -rf /sdcard/脚本/ClockMaster/*"

# 部署所有文件
adb push app /sdcard/脚本/ClockMaster/app
adb push cloud /sdcard/脚本/ClockMaster/cloud
adb push *.js /sdcard/脚本/ClockMaster/
adb push project.json /sdcard/脚本/ClockMaster/
```

### 配置初始化
```bash
# 用户端执行
1. 运行 clear_all_config.js (清理旧配置)
2. 运行 app/main.js (主程序)
3. 验证配置自动填充
4. 点击"立即执行"测试
```

---

## 🧪 测试验证

### 测试用例

| 测试项 | 测试方法 | 预期结果 | 状态 |
|--------|---------|---------|------|
| 配置参数传递 | 点击"立即执行" | 日志显示"使用 Launcher 传递的配置" | ✅ |
| 配置诊断输出 | 查看日志 | 显示完整配置信息，无 UNDEFINED | ✅ |
| 文件路径正确 | 检查 URL 配置 | 显示 `/sdcard/脚本/...` | ✅ |
| 默认配置加载 | 首次打开 app | Token、App、URL 自动填充 | ✅ |
| 错误日志输出 | 故意配置错误 | 显示详细错误信息 | ✅ |
| 辅助脚本功能 | 运行各辅助脚本 | 正确执行对应功能 | ✅ |

---

## 📝 经验教训

### 1. 架构设计
- ❌ **过度工程**: v3.0 引入的 launcher 抽象层增加了复杂度
- ✅ **简单优先**: v2.6 的简单架构实际上更可靠
- ✅ **渐进增强**: 应该先保证基础功能工作，再添加高级特性

### 2. 参数传递
- ❌ **假设一致性**: 假设 engines.execScript() 的子脚本能访问父脚本的 storage
- ✅ **显式传递**: 使用 arguments 参数显式传递数据
- ✅ **双重保障**: 提供 fallback 机制确保鲁棒性

### 3. 调试策略
- ✅ **日志优先**: 详细的诊断日志极大加速问题定位
- ✅ **Fail Fast**: 立即抛出错误比静默失败更好
- ✅ **用户反馈**: 清晰的错误提示帮助用户自查

### 4. 路径管理
- ❌ **硬编码路径**: 多处硬编码导致难以维护
- ✅ **统一常量**: 应该使用全局常量管理路径
- ✅ **本地化考虑**: 中文路径 "脚本" vs 英文 "Scripts" 需要统一

---

## 🎉 成果总结

### 功能完成度
- ✅ PushPlus 推送通知 - 100%
- ✅ 执行历史记录 - 100%
- ✅ 定时任务调度 - 100%
- ✅ 异常处理和截图 - 100%
- ✅ 热更新引擎 - 100%
- ✅ 配置管理 - 100%

### 稳定性
- ✅ 核心功能可正常执行
- ✅ 错误处理完善
- ✅ 日志输出详细
- ✅ 配置验证严格

### 用户体验
- ✅ 默认配置自动填充
- ✅ 一键清理旧配置
- ✅ 多个辅助脚本工具
- ✅ 清晰的错误提示

---

## 📋 待优化项

### 短期
- [ ] 添加单元测试
- [ ] 优化截图功能（压缩、自动清理）
- [ ] 改进定时任务稳定性（使用 AlarmManager）

### 长期
- [ ] 支持多个打卡任务
- [ ] 可视化编辑打卡流程
- [ ] 云端配置同步
- [ ] 多设备管理

---

## 🔗 相关资源

- GitHub: https://github.com/MinG-98/ClockMaster
- Auto.js Pro: https://pro.autojs.org/
- PushPlus: https://www.pushplus.plus/

---

## ✍️ 备注

今日工作时长约 4 小时，主要时间用于：
- 🔍 问题定位和分析 (40%)
- 💻 代码修复和测试 (40%)
- 📝 文档更新 (20%)

修复过程中的关键突破点：
1. 发现 core_task.js 未使用 launcher 传递的参数
2. 理解 engines.execScript() 的 storage 上下文隔离机制
3. 意识到需要彻底清理用户旧配置

**最重要的发现**: 简单的架构往往比复杂的架构更可靠，v2.6 能工作而 v3.0 失败的根本原因是 v3.0 引入了不必要的复杂度。

---

**日志完成时间**: 2026-01-13 23:59
