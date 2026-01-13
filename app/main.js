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
var Storage = require("./app/modules/storage.js");
var Permission = require("./app/modules/permission.js");
var Launcher = require("./app/modules/launcher.js");
var Scheduler = require("./app/modules/scheduler.js");
var History = require("./app/modules/history.js");
var PushPlus = require("./app/modules/pushplus.js");
var Utils = require("./app/modules/utils.js");

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
                <input id="pkg" hint="如: YourApp" textSize="13sp" marginBottom="8"/>

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
                <horizontal marginBottom="8">
                    <text text="定时打卡" textSize="14sp" textColor="#333333" textStyle="bold" layout_weight="1"/>
                    <Switch id="schedule_switch" checked="false"/>
                </horizontal>

                {/* 上班打卡 */}
                <horizontal marginTop="4" marginBottom="4" bg="#F5F5F5" padding="8" cardCornerRadius="4dp">
                    <text text="🌅 上班打卡" textSize="12sp" textColor="#666666" layout_weight="1"/>
                    <button id="time_work_btn" text="09:00" style="Widget.AppCompat.Button.Borderless" textSize="14sp" textColor="#2196F3" minWidth="80dp"/>
                </horizontal>

                {/* 下班打卡 */}
                <horizontal marginTop="4" marginBottom="4" bg="#F5F5F5" padding="8" cardCornerRadius="4dp">
                    <text text="🌆 下班打卡" textSize="12sp" textColor="#666666" layout_weight="1"/>
                    <button id="time_offwork_btn" text="18:00" style="Widget.AppCompat.Button.Borderless" textSize="14sp" textColor="#2196F3" minWidth="80dp"/>
                </horizontal>

                <text id="next_exec" text="" textSize="11sp" textColor="#999999" marginTop="4"/>
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
            <button id="save_btn" text="保存配置" w="0" layout_weight="1" marginRight="4" textColor="#FFFFFF" bg="#2196F3" h="48dp" textSize="14sp"/>
            <button id="run_btn" text="立即执行" w="0" layout_weight="1" marginLeft="4" textColor="#FFFFFF" bg="#4CAF50" h="48dp" textSize="14sp"/>
        </horizontal>
    </vertical>
    </ScrollView>
);

// ================= 初始化 =================

// 加载配置
function loadConfig() {
    var config = Storage.getAll();
    ui.token.setText(config.pushplusToken || "45552f26c7f949d09a135ff0caec71f6");
    ui.pkg.setText(config.targetAppPackage || "YourApp");
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

    // 设置UI
    if (workSchedule) {
        ui.time_work_btn.setText(Scheduler.formatTime(workSchedule.hour, workSchedule.minute));
    }

    if (offworkSchedule) {
        ui.time_offwork_btn.setText(Scheduler.formatTime(offworkSchedule.hour, offworkSchedule.minute));
    }

    // 检查是否有任务启用
    var hasEnabled = (workSchedule && workSchedule.enabled) || (offworkSchedule && offworkSchedule.enabled);
    ui.schedule_switch.setChecked(hasEnabled === true);

    // 显示下次执行时间
    if (hasEnabled) {
        var nextTimes = [];

        if (workSchedule && workSchedule.enabled) {
            var workNext = Scheduler.getNextExecutionTime(workSchedule.hour, workSchedule.minute);
            var workHour = workNext.getHours();
            var workMin = workNext.getMinutes();
            nextTimes.push("上班: " + (workHour < 10 ? "0" : "") + workHour + ":" + (workMin < 10 ? "0" : "") + workMin);
        }

        if (offworkSchedule && offworkSchedule.enabled) {
            var offworkNext = Scheduler.getNextExecutionTime(offworkSchedule.hour, offworkSchedule.minute);
            var offworkHour = offworkNext.getHours();
            var offworkMin = offworkNext.getMinutes();
            nextTimes.push("下班: " + (offworkHour < 10 ? "0" : "") + offworkHour + ":" + (offworkMin < 10 ? "0" : "") + offworkMin);
        }

        ui.next_exec.setText("下次执行: " + nextTimes.join(" | "));
    } else {
        ui.next_exec.setText("");
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

    // 查找上班和下班任务
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
        // 创建或启用上班打卡任务
        if (!workSchedule) {
            var workTime = ui.time_work_btn.getText().split(":");
            Scheduler.addSchedule({
                hour: parseInt(workTime[0]),
                minute: parseInt(workTime[1]),
                enabled: true,
                label: "上班打卡"
            });
        } else {
            Scheduler.updateSchedule(workSchedule.id, { enabled: true });
        }

        // 创建或启用下班打卡任务
        if (!offworkSchedule) {
            var offworkTime = ui.time_offwork_btn.getText().split(":");
            Scheduler.addSchedule({
                hour: parseInt(offworkTime[0]),
                minute: parseInt(offworkTime[1]),
                enabled: true,
                label: "下班打卡"
            });
        } else {
            Scheduler.updateSchedule(offworkSchedule.id, { enabled: true });
        }

        // 更新显示
        loadSchedule();
        toast("✅ 定时打卡已启用");
    } else {
        // 禁用所有任务
        if (workSchedule) {
            Scheduler.updateSchedule(workSchedule.id, { enabled: false });
        }
        if (offworkSchedule) {
            Scheduler.updateSchedule(offworkSchedule.id, { enabled: false });
        }

        ui.next_exec.setText("");
        toast("❌ 定时打卡已关闭");
    }
});

// 上班时间选择
ui.time_work_btn.click(function() {
    var currentTime = String(ui.time_work_btn.getText());
    threads.start(function() {
        var text = rawInput("设置上班打卡时间 (HH:MM)", currentTime);
        if (text === null || text === "") return;

        var parts = String(text).split(":");
        if (parts.length === 2) {
            var hour = parseInt(parts[0]);
            var minute = parseInt(parts[1]);

            if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
                var schedules = Scheduler.getSchedules();
                for (var i = 0; i < schedules.length; i++) {
                    if (schedules[i].label === "上班打卡") {
                        Scheduler.updateSchedule(schedules[i].id, { hour: hour, minute: minute });
                        break;
                    }
                }

                var timeStr = Scheduler.formatTime(hour, minute);
                ui.run(function() {
                    ui.time_work_btn.setText(timeStr);
                    if (ui.schedule_switch.isChecked()) {
                        loadSchedule();
                    }
                });
                toast("上班时间已设置: " + timeStr);
            } else {
                toast("时间无效，小时0-23，分钟0-59");
            }
        } else {
            toast("格式错误，请输入 HH:MM");
        }
    });
});

// 下班时间选择
ui.time_offwork_btn.click(function() {
    var currentTime = String(ui.time_offwork_btn.getText());
    threads.start(function() {
        var text = rawInput("设置下班打卡时间 (HH:MM)", currentTime);
        if (text === null || text === "") return;

        var parts = String(text).split(":");
        if (parts.length === 2) {
            var hour = parseInt(parts[0]);
            var minute = parseInt(parts[1]);

            if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
                var schedules = Scheduler.getSchedules();
                for (var i = 0; i < schedules.length; i++) {
                    if (schedules[i].label === "下班打卡") {
                        Scheduler.updateSchedule(schedules[i].id, { hour: hour, minute: minute });
                        break;
                    }
                }

                var timeStr = Scheduler.formatTime(hour, minute);
                ui.run(function() {
                    ui.time_offwork_btn.setText(timeStr);
                    if (ui.schedule_switch.isChecked()) {
                        loadSchedule();
                    }
                });
                toast("下班时间已设置: " + timeStr);
            } else {
                toast("时间无效，小时0-23，分钟0-59");
            }
        } else {
            toast("格式错误，请输入 HH:MM");
        }
    });
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
