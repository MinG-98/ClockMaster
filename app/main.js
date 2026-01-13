/**
 * Project ClockMaster - Main Entry (v3.0)
 * 智能打卡助手 - 主入口程序
 *
 * 功能特性:
 * - 完整的配置界面
 * - PushPlus 推送通知
 * - 执行历史记录
 * - 定时任务调度
 * - 热更新引擎
 * - 权限管理向导
 */

"ui";

// 加载模块
var Storage = require("./modules/storage.js");
var Permission = require("./modules/permission.js");
var Launcher = require("./modules/launcher.js");
var Scheduler = require("./modules/scheduler.js");
var History = require("./modules/history.js");
var PushPlus = require("./modules/pushplus.js");
var Utils = require("./modules/utils.js");

// 应用启动检查
log("========== ClockMaster v3.0 启动 ==========");

// 主UI界面
ui.layout(
    <ScrollView>
    <vertical padding="16" bg="#f5f5f5">
        <text text="ClockMaster" textSize="24sp" textStyle="bold" gravity="center" textColor="#333333" margin="0 20"/>
        <text text="智能打卡助手 v3.0.0" textSize="12sp" gravity="center" textColor="#999999" margin="0 0 0 20"/>

        {/* 状态卡片 */}
        <card cardCornerRadius="8dp" cardElevation="4dp" margin="0 5" bg="#ffffff">
            <vertical padding="16">
                <horizontal>
                    <text text="执行状态" textSize="14sp" textColor="#333333" textStyle="bold" layout_weight="1"/>
                    <text id="status" text="就绪" textSize="12sp" textColor="#4CAF50"/>
                </horizontal>
                <text id="last_exec" text="上次执行: 无" textSize="11sp" textColor="#666666" marginTop="4"/>
                <text id="stats" text="成功率: --%" textSize="11sp" textColor="#666666" marginTop="2"/>
            </vertical>
        </card>

        {/* 基础配置卡片 */}
        <card cardCornerRadius="8dp" cardElevation="4dp" margin="0 5" bg="#ffffff">
            <vertical padding="16">
                <text text="基础配置" textSize="14sp" textColor="#333333" textStyle="bold" marginBottom="10"/>

                <text text="PushPlus Token" textSize="11sp" textColor="#666666"/>
                <input id="token" hint="用于推送通知" textSize="13sp" marginBottom="8"/>

                <text text="目标App包名/名称" textSize="11sp" textColor="#666666"/>
                <input id="pkg" hint="如: 农商云办公" textSize="13sp" marginBottom="8"/>

                <text text="云端脚本URL" textSize="11sp" textColor="#666666"/>
                <input id="url" hint="GitHub/Gitee Raw URL" textSize="13sp" lines="2" marginBottom="8"/>

                <horizontal marginTop="4">
                    <text text="最大随机延迟" textSize="11sp" textColor="#666666" layout_weight="1"/>
                    <text id="delay_text" text="5 分钟" textSize="11sp" textColor="#2196F3"/>
                </horizontal>
                <seekbar id="delay" max="30" marginTop="4"/>
            </vertical>
        </card>

        {/* 定时任务卡片 */}
        <card cardCornerRadius="8dp" cardElevation="4dp" margin="0 5" bg="#ffffff">
            <vertical padding="16">
                <horizontal>
                    <text text="定时任务" textSize="14sp" textColor="#333333" textStyle="bold" layout_weight="1"/>
                    <Switch id="schedule_switch" checked="false"/>
                </horizontal>
                <horizontal marginTop="8">
                    <text text="执行时间:" textSize="12sp" textColor="#666666"/>
                    <button id="time_btn" text="09:00" style="Widget.AppCompat.Button.Borderless" textSize="14sp" textColor="#2196F3"/>
                </horizontal>
                <text id="next_exec" text="" textSize="11sp" textColor="#999999" marginTop="2"/>
            </vertical>
        </card>

        {/* 高级选项卡片 */}
        <card cardCornerRadius="8dp" cardElevation="4dp" margin="0 5" bg="#ffffff">
            <vertical padding="16">
                <text text="高级选项" textSize="14sp" textColor="#333333" textStyle="bold" marginBottom="8"/>

                <horizontal marginBottom="4">
                    <text text="调试模式" textSize="12sp" textColor="#333333" layout_weight="1"/>
                    <Switch id="debug_switch" checked="false"/>
                </horizontal>

                <horizontal>
                    <button id="test_push_btn" text="测试推送" style="Widget.AppCompat.Button.Borderless" textSize="12sp" layout_weight="1"/>
                    <button id="update_btn" text="强制更新" style="Widget.AppCompat.Button.Borderless" textSize="12sp" layout_weight="1"/>
                    <button id="history_btn" text="查看历史" style="Widget.AppCompat.Button.Borderless" textSize="12sp" layout_weight="1"/>
                </horizontal>
            </vertical>
        </card>

        {/* 权限状态卡片 */}
        <card cardCornerRadius="8dp" cardElevation="4dp" margin="0 5" bg="#ffffff">
            <vertical padding="16">
                <text text="权限状态" textSize="14sp" textColor="#333333" textStyle="bold" marginBottom="8"/>
                <text id="perm_accessibility" text="无障碍服务: 检查中..." textSize="11sp" textColor="#666666" marginBottom="2"/>
                <text id="perm_overlay" text="悬浮窗权限: 检查中..." textSize="11sp" textColor="#666666" marginBottom="2"/>
                <text id="perm_storage" text="存储权限: 检查中..." textSize="11sp" textColor="#666666"/>
                <button id="perm_btn" text="检查权限" style="Widget.AppCompat.Button.Borderless" textSize="12sp" marginTop="4"/>
            </vertical>
        </card>

        {/* 操作按钮 */}
        <horizontal marginTop="8">
            <button id="save_btn" text="保存配置" style="Widget.AppCompat.Button.Colored" layout_weight="1" marginRight="6"/>
            <button id="run_btn" text="立即执行" style="Widget.AppCompat.Button.Colored" layout_weight="1" marginLeft="6" bg="#4CAF50"/>
        </horizontal>
    </vertical>
    </ScrollView>
);

// ================= 初始化 =================

// 加载配置
function loadConfig() {
    var config = Storage.getAll();
    ui.token.setText(config.pushplusToken || "45552f26c7f949d09a135ff0caec71f6");
    ui.pkg.setText(config.targetAppPackage || "农商云办公");
    ui.url.setText(config.cloudScriptUrl || "file:///sdcard/脚本/ClockMaster/cloud/core_task.js");

    var delay = config.maxRandomDelay || 5;
    ui.delay.setProgress(delay);
    ui.delay_text.setText(delay + " 分钟");

    ui.debug_switch.setChecked(config.debugMode || false);
}

// 更新状态显示
function updateStatus() {
    var stats = History.getStats();
    var latest = History.getLatest();

    ui.stats.setText("成功率: " + stats.successRate + "% (共 " + stats.total + " 次)");

    if (latest) {
        var statusText = latest.success ? "成功" : "失败";
        var statusColor = latest.success ? "#4CAF50" : "#F44336";
        ui.last_exec.setText("上次执行: " + latest.date + " " + latest.time + " - " + statusText);
        ui.status.setText(statusText);
        ui.status.setTextColor(colors.parseColor(statusColor));
    } else {
        ui.last_exec.setText("上次执行: 无");
    }
}

// 更新权限状态
function updatePermissionStatus() {
    var status = Permission.checkAll();
    var greenColor = "#4CAF50";
    var redColor = "#F44336";

    ui.perm_accessibility.setText("无障碍服务: " + (status.accessibility ? "已开启" : "未开启"));
    ui.perm_accessibility.setTextColor(colors.parseColor(status.accessibility ? greenColor : redColor));

    ui.perm_overlay.setText("悬浮窗权限: " + (status.overlay ? "已授予" : "未授予"));
    ui.perm_overlay.setTextColor(colors.parseColor(status.overlay ? greenColor : redColor));

    ui.perm_storage.setText("存储权限: " + (status.storage ? "已授予" : "未授予"));
    ui.perm_storage.setTextColor(colors.parseColor(status.storage ? greenColor : redColor));
}

// 加载定时任务设置
function loadSchedule() {
    var schedules = Scheduler.getSchedules();
    if (schedules.length > 0) {
        var schedule = schedules[0];
        ui.schedule_switch.setChecked(schedule.enabled);
        ui.time_btn.setText(Scheduler.formatTime(schedule.hour, schedule.minute));

        if (schedule.enabled) {
            var nextTime = Scheduler.getNextExecutionTime(schedule.hour, schedule.minute);
            ui.next_exec.setText("下次执行: " + nextTime.toLocaleString());
        }
    }
}

// 初始化
loadConfig();
updateStatus();
updatePermissionStatus();
loadSchedule();

// ================= 事件绑定 =================

// 滑块变化
ui.delay.setOnSeekBarChangeListener({
    onProgressChanged: function(seekBar, progress, fromUser) {
        ui.delay_text.setText(progress + " 分钟");
    }
});

// 保存配置
ui.save_btn.click(function() {
    var config = {
        pushplusToken: ui.token.text().trim(),
        targetAppPackage: ui.pkg.text().trim(),
        cloudScriptUrl: ui.url.text().trim(),
        maxRandomDelay: ui.delay.getProgress(),
        debugMode: ui.debug_switch.isChecked()
    };

    Storage.setAll(config);
    toast("✅ 配置已保存");
    log("配置已保存");
});

// 立即执行
ui.run_btn.click(function() {
    // 先保存配置
    ui.save_btn.performClick();

    // 验证配置
    var validation = Storage.validate();
    if (!validation.valid) {
        dialogs.alert("配置不完整", "请填写以下必填项:\n" + validation.missing.join("\n"));
        return;
    }

    // 检查权限
    if (!Permission.isAllGranted()) {
        dialogs.confirm("权限不足", "部分权限未授予，是否前往设置？").then(function(confirmed) {
            if (confirmed) {
                Permission.runWizard(function(allGranted) {
                    if (allGranted) {
                        executeTask();
                    }
                });
            }
        });
        return;
    }

    // 执行任务
    executeTask();
});

// 执行任务
function executeTask() {
    log("开始执行任务...");

    // 设置状态回调
    Launcher.setStatusCallback(function(status) {
        ui.run(function() {
            ui.status.setText(status);
        });
    });

    // 启动任务
    threads.start(function() {
        var success = Launcher.launch();

        if (success) {
            log("任务启动成功");
            ui.run(function() {
                toast("任务已启动");
                updateStatus();
            });
        } else {
            log("任务启动失败");
            ui.run(function() {
                toast("任务启动失败");
            });
        }
    });
}

// 定时开关
ui.schedule_switch.on("check", function(checked) {
    var schedules = Scheduler.getSchedules();
    var hour = 9;
    var minute = 0;

    if (schedules.length > 0) {
        hour = schedules[0].hour;
        minute = schedules[0].minute;
    }

    if (checked) {
        if (schedules.length === 0) {
            Scheduler.addSchedule({
                hour: hour,
                minute: minute,
                enabled: true,
                label: "每日打卡"
            });
        } else {
            Scheduler.updateSchedule(schedules[0].id, { enabled: true });
        }

        var nextTime = Scheduler.getNextExecutionTime(hour, minute);
        ui.next_exec.setText("下次执行: " + nextTime.toLocaleString());
        toast("定时任务已启用");
    } else {
        if (schedules.length > 0) {
            Scheduler.updateSchedule(schedules[0].id, { enabled: false });
        }
        ui.next_exec.setText("");
        toast("定时任务已关闭");
    }
});

// 时间选择
ui.time_btn.click(function() {
    dialogs.build({
        title: "选择执行时间",
        content: "请输入时间 (格式: HH:MM)",
        inputHint: "09:00",
        inputPrefill: ui.time_btn.getText(),
        positive: "确定",
        negative: "取消"
    }).on("positive", function(text) {
        var match = text.match(/^(\d{1,2}):(\d{2})$/);
        if (match) {
            var hour = parseInt(match[1]);
            var minute = parseInt(match[2]);

            if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
                ui.time_btn.setText(Scheduler.formatTime(hour, minute));

                var schedules = Scheduler.getSchedules();
                if (schedules.length > 0) {
                    Scheduler.updateSchedule(schedules[0].id, {
                        hour: hour,
                        minute: minute
                    });
                }

                if (ui.schedule_switch.isChecked()) {
                    var nextTime = Scheduler.getNextExecutionTime(hour, minute);
                    ui.next_exec.setText("下次执行: " + nextTime.toLocaleString());
                }

                toast("时间已设置");
            } else {
                toast("时间格式错误");
            }
        } else {
            toast("请输入正确格式 (HH:MM)");
        }
    }).show();
});

// 测试推送
ui.test_push_btn.click(function() {
    var token = ui.token.text().trim();
    if (!token) {
        toast("请先填写 PushPlus Token");
        return;
    }

    toast("正在发送测试推送...");

    threads.start(function() {
        var result = PushPlus.sendTest();
        ui.run(function() {
            if (result.success) {
                toast("✅ 推送发送成功");
            } else {
                toast("❌ 推送失败: " + result.message);
            }
        });
    });
});

// 强制更新
ui.update_btn.click(function() {
    var url = ui.url.text().trim();
    if (!url) {
        toast("请先填写云端脚本URL");
        return;
    }

    dialogs.confirm("强制更新", "确定要强制更新云端脚本吗？").then(function(confirmed) {
        if (confirmed) {
            toast("正在更新...");

            threads.start(function() {
                var success = Launcher.forceUpdate(url);
                ui.run(function() {
                    if (success) {
                        toast("✅ 更新成功");
                    } else {
                        toast("❌ 更新失败");
                    }
                });
            });
        }
    });
});

// 查看历史
ui.history_btn.click(function() {
    var history = History.getAll();
    var stats = History.getStats();

    if (history.length === 0) {
        dialogs.alert("执行历史", "暂无执行记录");
        return;
    }

    var items = [];
    var maxShow = Math.min(history.length, 20);

    for (var i = 0; i < maxShow; i++) {
        var record = history[i];
        var status = record.success ? "✓" : "✗";
        var line = status + " " + record.date + " " + record.time;
        if (record.errorMsg) {
            line += " - " + record.errorMsg.substring(0, 20);
        }
        items.push(line);
    }

    dialogs.build({
        title: "执行历史 (成功率: " + stats.successRate + "%)",
        items: items,
        positive: "关闭",
        neutral: "清除历史"
    }).on("neutral", function() {
        dialogs.confirm("确认清除", "确定要清除所有历史记录吗？").then(function(confirmed) {
            if (confirmed) {
                History.clear();
                toast("历史已清除");
                updateStatus();
            }
        });
    }).show();
});

// 权限检查
ui.perm_btn.click(function() {
    Permission.runWizard(function(allGranted) {
        updatePermissionStatus();
        if (allGranted) {
            toast("✅ 所有权限已就绪");
        } else {
            toast("❌ 部分权限未授予");
        }
    });
});

// ================= 定时任务初始化 =================

// 初始化所有启用的定时任务
threads.start(function() {
    sleep(1000);
    var count = Scheduler.initAllSchedules();
    if (count > 0) {
        log("已初始化 " + count + " 个定时任务");
    }
});

// ================= 退出处理 =================

events.on("exit", function() {
    log("应用退出，取消所有定时任务");
    Scheduler.cancelAllSchedules();
});

log("ClockMaster 初始化完成");
