# ClockMaster v3.0.2 更新日志

**发布日期**: 2026-01-13

---

## 🔒 安全合规更新

### 移除敏感信息
为避免法律风险，移除所有特定应用名称引用：

**修改的文件**:
- `cloud/core_task.js` - 默认值改为 "目标应用"
- `app/main.js` - 示例改为 "YourApp"
- `app/modules/storage.js` - 默认值为空字符串
- `simple_main.js` - 示例改为 "YourApp"
- `reset_config.js` - 移除默认应用名
- `clear_all_config.js` - 移除默认应用名
- `quick_setup.js` - 移除默认应用名
- `README.md` - 使用通用示例
- `CHANGELOG.md` - 使用通用示例
- `CHANGELOG_2026-01-13.md` - 使用通用示例

**用户影响**:
- ✅ 首次使用需要在配置界面手动填写目标应用名称
- ✅ 项目成为通用自动化工具框架
- ✅ 可用于任何合法的自动化场景

---

## 🐛 兼容性修复

### 1. execution.on() 方法兼容性

**问题**:
```
cannot find function on in object
```

**原因**:
AutoX.js 某些版本的 `execution` 对象不支持 `.on()` 方法

**修复** (`app/modules/launcher.js`):
```javascript
// 添加类型检查和 try-catch 保护
try {
    if (typeof execution.on === "function") {
        execution.on("stop", function() {
            log("核心任务执行完毕");
        });
        execution.on("error", function(error) {
            log("❌ 核心任务执行错误: " + error);
        });
    }
} catch (e) {
    log("注意: 事件监听不可用 (" + e.message + ")");
}
```

**效果**:
- ✅ 在不支持 `.on()` 的版本中优雅降级
- ✅ 不影响核心功能执行
- ✅ 添加友好日志提示

---

### 2. 按钮 UI 布局问题

**问题**:
"保存配置" 和 "立即执行" 按钮大小不一致

**原因**:
- 使用了 `style="Widget.AppCompat.Button.Colored"` 导致渲染不一致
- `marginLeft` 和 `marginRight` 设置不对称

**修复** (`app/main.js`):
```xml
<horizontal marginTop="8">
    <button id="save_btn" text="保存配置"
            w="0" layout_weight="1"
            marginRight="4"
            textColor="#FFFFFF" bg="#2196F3"
            h="48dp" textSize="14sp"/>
    <button id="run_btn" text="立即执行"
            w="0" layout_weight="1"
            marginLeft="4"
            textColor="#FFFFFF" bg="#4CAF50"
            h="48dp" textSize="14sp"/>
</horizontal>
```

**关键改进**:
- ✅ 移除 `style` 属性，使用明确的样式定义
- ✅ 统一高度 `h="48dp"`
- ✅ 统一字体大小 `textSize="14sp"`
- ✅ 明确设置背景色和文字颜色
- ✅ 使用 `w="0"` 配合 `layout_weight="1"` 确保等宽

**效果**:
- ✅ 两个按钮大小完全一致
- ✅ 视觉更加整洁统一

---

## 📦 版本信息

### 版本号
- **versionName**: 3.0.1 → 3.0.2
- **versionCode**: 4 → 5
- **core_task.js**: @version 3.0.0 → 3.0.2

### 更新的文件
- `project.json` - 版本号更新
- `cloud/core_task.js` - 版本号和默认值
- `app/modules/launcher.js` - 兼容性修复
- `app/main.js` - UI修复和敏感信息移除
- `app/modules/storage.js` - 默认值清理
- 配置脚本 × 7 - 敏感信息移除
- 文档 × 3 - 更新示例

---

## 🚀 部署状态

### Git 仓库
- ✅ GitHub: https://github.com/MinG-98/ClockMaster
- ✅ Gitee: https://gitee.com/MinG-98/ClockMaster
- ✅ Commit: 7442ba4 (安全更新) + 后续版本号更新

### Raw URL
- GitHub: `https://raw.githubusercontent.com/MinG-98/ClockMaster/main/cloud/core_task.js`
- Gitee: `https://gitee.com/MinG-98/ClockMaster/raw/main/cloud/core_task.js`

---

## 🎯 升级指南

### 从 v3.0.1 升级

**云端模式**:
1. 在手机上打开 `app/main.js`
2. 点击"强制更新"自动拉取最新脚本

**本地模式**:
1. 通过 ADB 推送更新的文件
2. 或重新下载整个项目

**配置调整**:
- ⚠️ 首次运行需要重新填写目标应用名称
- ⚠️ 运行 `clear_all_config.js` 清理旧配置

---

## 📝 注意事项

### 法律合规
- ✅ 项目代码中不包含任何特定应用名称
- ✅ 用户需自行配置目标应用
- ✅ 仅提供通用自动化框架
- ✅ 遵守开源项目最佳实践

### 兼容性
- ✅ 支持 AutoX.js v6 及以上版本
- ✅ 优雅降级，不支持的功能不影响核心逻辑
- ✅ 跨版本兼容性增强

---

## 🐛 已知问题

无

---

## 📅 下个版本计划

- [ ] 添加单元测试
- [ ] 优化截图压缩和清理
- [ ] 改进定时任务稳定性
- [ ] 可视化配置编辑器

---

**发布时间**: 2026-01-13
**开发者**: MinG-98
