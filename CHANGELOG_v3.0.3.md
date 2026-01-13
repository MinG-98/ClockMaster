# ClockMaster v3.0.3 更新日志

**发布日期**: 2026-01-13
**主题**: 双班制打卡版本

---

## ✨ 新增功能

### 1. 独立上班和下班打卡时间

用户现在可以为上班和下班分别设置打卡时间！

**功能特性**:
- ✅ 上班打卡：设置早上打卡时间（如 09:00）
- ✅ 下班打卡：设置晚上打卡时间（如 18:00）
- ✅ 两个任务独立运行，互不影响
- ✅ 支持不同的打卡规则

**实现方式**:
- 后端：scheduler.js 支持多个定时任务，每个任务有独立的 label（"上班打卡" 或 "下班打卡"）
- 前端：main.js 分别处理两个时间选择按钮

---

## 🎨 UI/UX 改进

### 定时打卡卡片重新设计

**旧设计**:
```
定时任务           [开关]
执行时间: [09:00]
下次执行: ...
```

**新设计**:
```
定时打卡           [开关]

🌅 上班打卡      [09:00]
🌆 下班打卡      [18:00]

下次执行: 上班: 09:00 | 下班: 18:00
```

**改进点**:
- 🎯 两个时间选择按钮并排显示，清晰易用
- 🎨 添加 emoji 图标增强视觉识别
- 📱 灰色背景框突出时间选择区域
- 📊 下次执行时间同时显示上班和下班

---

## 🔧 技术细节

### 前端改动 (`app/main.js`)

#### 1. UI 布局改进

```xml
{/* 定时任务卡片 */}
<card cardCornerRadius="8dp" cardElevation="4dp" margin="0 5" bg="#ffffff">
    <vertical padding="16">
        <horizontal marginBottom="8">
            <text text="定时打卡" textSize="14sp" textColor="#333333" textStyle="bold" layout_weight="1"/>
            <Switch id="schedule_switch" checked="false"/>
        </horizontal>

        {/* 上班打卡 */}
        <horizontal marginTop="4" marginBottom="4" bg="#F5F5F5" padding="8">
            <text text="🌅 上班打卡" textSize="12sp" textColor="#666666" layout_weight="1"/>
            <button id="time_work_btn" text="09:00" style="Widget.AppCompat.Button.Borderless" textSize="14sp" textColor="#2196F3" minWidth="80dp"/>
        </horizontal>

        {/* 下班打卡 */}
        <horizontal marginTop="4" marginBottom="4" bg="#F5F5F5" padding="8">
            <text text="🌆 下班打卡" textSize="12sp" textColor="#666666" layout_weight="1"/>
            <button id="time_offwork_btn" text="18:00" style="Widget.AppCompat.Button.Borderless" textSize="14sp" textColor="#2196F3" minWidth="80dp"/>
        </horizontal>

        <text id="next_exec" text="" textSize="11sp" textColor="#999999" marginTop="4"/>
    </vertical>
</card>
```

#### 2. loadSchedule() 函数改进

```javascript
function loadSchedule() {
    var schedules = Scheduler.getSchedules();

    // 查找上班和下班的定时任务
    var workSchedule = null;
    var offworkSchedule = null;

    for (var i = 0; i < schedules.length; i++) {
        if (schedules[i].label === "上班打卡") {
            workSchedule = schedules[i];
        } else if (schedules[i].label === "下班打卡") {
            offworkSchedule = schedules[i];
        }
    }

    // 设置UI并显示下次执行时间
    if (workSchedule) {
        ui.time_work_btn.setText(Scheduler.formatTime(workSchedule.hour, workSchedule.minute));
    }

    if (offworkSchedule) {
        ui.time_offwork_btn.setText(Scheduler.formatTime(offworkSchedule.hour, offworkSchedule.minute));
    }

    // 检查是否有任务启用并显示下次执行时间
    var hasEnabled = (workSchedule && workSchedule.enabled) || (offworkSchedule && offworkSchedule.enabled);
    ui.schedule_switch.setChecked(hasEnabled);

    if (hasEnabled) {
        var nextTimes = [];
        if (workSchedule && workSchedule.enabled) {
            var workNext = Scheduler.getNextExecutionTime(workSchedule.hour, workSchedule.minute);
            nextTimes.push("上班: " + workNext.toLocaleTimeString(...));
        }
        if (offworkSchedule && offworkSchedule.enabled) {
            var offworkNext = Scheduler.getNextExecutionTime(offworkSchedule.hour, offworkSchedule.minute);
            nextTimes.push("下班: " + offworkNext.toLocaleTimeString(...));
        }
        ui.next_exec.setText("下次执行: " + nextTimes.join(" | "));
    }
}
```

#### 3. 定时开关逻辑改进

```javascript
ui.schedule_switch.on("check", function(checked) {
    var schedules = Scheduler.getSchedules();

    // 查找或创建上班和下班任务
    var workSchedule = null;
    var offworkSchedule = null;

    for (var i = 0; i < schedules.length; i++) {
        if (schedules[i].label === "上班打卡") {
            workSchedule = schedules[i];
        } else if (schedules[i].label === "下班打卡") {
            offworkSchedule = schedules[i];
        }
    }

    if (checked) {
        // 创建或启用两个任务
        if (!workSchedule) {
            Scheduler.addSchedule({
                hour: 9,
                minute: 0,
                enabled: true,
                label: "上班打卡"
            });
        } else {
            Scheduler.updateSchedule(workSchedule.id, { enabled: true });
        }

        if (!offworkSchedule) {
            Scheduler.addSchedule({
                hour: 18,
                minute: 0,
                enabled: true,
                label: "下班打卡"
            });
        } else {
            Scheduler.updateSchedule(offworkSchedule.id, { enabled: true });
        }

        loadSchedule();
        toast("✅ 定时打卡已启用");
    } else {
        // 禁用两个任务
        if (workSchedule) Scheduler.updateSchedule(workSchedule.id, { enabled: false });
        if (offworkSchedule) Scheduler.updateSchedule(offworkSchedule.id, { enabled: false });
        ui.next_exec.setText("");
        toast("❌ 定时打卡已关闭");
    }
});
```

#### 4. 分别的时间选择处理

```javascript
// 上班时间选择
ui.time_work_btn.click(function() {
    dialogs.build({
        title: "设置上班打卡时间",
        content: "请输入时间 (格式: HH:MM)",
        inputHint: "09:00",
        inputPrefill: ui.time_work_btn.getText(),
        positive: "确定",
        negative: "取消"
    }).on("positive", function(text) {
        // 验证时间格式，更新对应的定时任务
        var match = text.match(/^(\d{1,2}):(\d{2})$/);
        if (match) {
            var hour = parseInt(match[1]);
            var minute = parseInt(match[2]);

            if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
                ui.time_work_btn.setText(Scheduler.formatTime(hour, minute));

                // 更新上班打卡任务
                var schedules = Scheduler.getSchedules();
                for (var i = 0; i < schedules.length; i++) {
                    if (schedules[i].label === "上班打卡") {
                        Scheduler.updateSchedule(schedules[i].id, {
                            hour: hour,
                            minute: minute
                        });
                        break;
                    }
                }

                if (ui.schedule_switch.isChecked()) {
                    loadSchedule();
                }

                toast("✅ 上班打卡时间已设置");
            } else {
                toast("❌ 时间格式错误");
            }
        } else {
            toast("❌ 请输入正确格式 (HH:MM)");
        }
    }).show();
});

// 下班时间选择（类似逻辑）
ui.time_offwork_btn.click(function() {
    // ... 类似的实现，但针对 "下班打卡" 任务
});
```

---

## 📋 使用说明

### 第一步：设置打卡时间

1. 打开 ClockMaster
2. 找到"定时打卡"卡片
3. 点击 🌅 上班打卡 后的时间按钮
4. 输入上班打卡时间（格式: HH:MM，如 09:00）
5. 同样设置下班打卡时间（如 18:00）

### 第二步：启用定时打卡

1. 打开"定时打卡"开关
2. 系统会自动创建两个定时任务
3. 显示下次执行时间：`下次执行: 上班: 09:00 | 下班: 18:00`

### 第三步：自动打卡

- 每天 09:00 系统会自动执行上班打卡
- 每天 18:00 系统会自动执行下班打卡
- 无需手动干预

---

## 🔄 后端兼容性

### scheduler.js 说明

scheduler.js 已经完全支持多个定时任务：

- ✅ `addSchedule()` - 创建新任务，支持 label 标识
- ✅ `updateSchedule()` - 更新任务，支持修改时间和状态
- ✅ `removeSchedule()` - 删除任务
- ✅ `getSchedules()` - 获取所有任务列表

每个任务都有：
- `id` - 唯一标识符
- `hour` - 小时（0-23）
- `minute` - 分钟（0-59）
- `enabled` - 是否启用
- `label` - 任务标签（用于区分上班/下班）
- `createdAt` - 创建时间

---

## 🎯 业务逻辑

### 执行流程

```
定时任务触发 (如 09:00)
    ↓
Scheduler.executeScheduledTask(id)
    ↓
获取配置 (token, 目标应用等)
    ↓
唤醒设备
    ↓
调用 Launcher.launch(config)
    ↓
执行打卡脚本
    ↓
记录历史和推送通知
    ↓
重新设置明天同时刻的定时任务
```

---

## 🐛 已知限制

1. **App 必须保持后台运行** - Auto.js 的定时任务需要应用保活
2. **系统不会杀后台** - 建议加入电池优化白名单
3. **精度依赖系统** - 具体执行时间可能有秒级偏差

---

## 📦 版本信息

| 项目 | 变化 |
|------|------|
| versionName | 3.0.2 → **3.0.3** |
| versionCode | 5 → **6** |
| Modified Files | app/main.js, project.json, README.md |

---

## 🚀 部署

所有变更已部署：
- ✅ 本地：`/sdcard/脚本/ClockMaster/app/main.js`
- ✅ GitHub：https://github.com/MinG-98/ClockMaster
- ✅ Gitee：https://gitee.com/MinG-98/ClockMaster

---

**发布时间**: 2026-01-13
**开发者**: MinG-98
