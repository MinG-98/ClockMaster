/**
 * ui_pres.js - 配置界面模块
 * ClockMaster - Configuration UI Module
 */

var Storage = require("./storage.js");
var History = require("./history.js");
var Scheduler = require("./scheduler.js");

// UI 布局定义
var UI_LAYOUT = (
    '<vertical padding="16">' +
    '    <text text="ClockMaster" textSize="24sp" textColor="#333333" gravity="center" marginBottom="4"/>' +
    '    <text text="智能打卡助手 v1.0.0" textSize="12sp" textColor="#999999" gravity="center" marginBottom="16"/>' +

    // 状态卡片
    '    <card cardCornerRadius="8dp" cardElevation="2dp" marginBottom="12">' +
    '        <vertical padding="12">' +
    '            <horizontal>' +
    '                <text text="执行状态" textSize="14sp" textColor="#333333" textStyle="bold" layout_weight="1"/>' +
    '                <text id="text_status" text="就绪" textSize="12sp" textColor="#4CAF50"/>' +
    '            </horizontal>' +
    '            <text id="text_last_exec" text="上次执行: 无" textSize="11sp" textColor="#666666" marginTop="4"/>' +
    '            <text id="text_stats" text="成功率: --%" textSize="11sp" textColor="#666666" marginTop="2"/>' +
    '        </vertical>' +
    '    </card>' +

    // 基础配置卡片
    '    <card cardCornerRadius="8dp" cardElevation="2dp" marginBottom="12">' +
    '        <vertical padding="12">' +
    '            <text text="基础配置" textSize="14sp" textColor="#333333" textStyle="bold" marginBottom="10"/>' +

    '            <text text="PushPlus Token" textSize="11sp" textColor="#666666"/>' +
    '            <input id="input_token" hint="用于推送通知" inputType="text" textSize="13sp" marginBottom="8"/>' +

    '            <text text="目标App包名" textSize="11sp" textColor="#666666"/>' +
    '            <input id="input_package" hint="如: com.example.app" inputType="text" textSize="13sp" marginBottom="8"/>' +

    '            <text text="云端脚本URL" textSize="11sp" textColor="#666666"/>' +
    '            <input id="input_script_url" hint="GitHub/Gitee Raw URL" inputType="textUri" textSize="13sp" marginBottom="8"/>' +

    '            <horizontal marginTop="4">' +
    '                <text text="最大随机延迟" textSize="11sp" textColor="#666666" layout_weight="1"/>' +
    '                <text id="text_delay_value" text="5 分钟" textSize="11sp" textColor="#2196F3"/>' +
    '            </horizontal>' +
    '            <seekbar id="seekbar_delay" max="30" marginTop="4"/>' +
    '        </vertical>' +
    '    </card>' +

    // 定时任务卡片
    '    <card cardCornerRadius="8dp" cardElevation="2dp" marginBottom="12">' +
    '        <vertical padding="12">' +
    '            <horizontal>' +
    '                <text text="定时任务" textSize="14sp" textColor="#333333" textStyle="bold" layout_weight="1"/>' +
    '                <Switch id="switch_schedule" checked="false"/>' +
    '            </horizontal>' +
    '            <horizontal marginTop="8" id="schedule_time_row">' +
    '                <text text="执行时间:" textSize="12sp" textColor="#666666"/>' +
    '                <button id="btn_pick_time" text="09:00" style="Widget.AppCompat.Button.Borderless" textSize="14sp" textColor="#2196F3"/>' +
    '            </horizontal>' +
    '            <text id="text_next_exec" text="" textSize="11sp" textColor="#999999" marginTop="2"/>' +
    '        </vertical>' +
    '    </card>' +

    // 高级选项卡片
    '    <card cardCornerRadius="8dp" cardElevation="2dp" marginBottom="12">' +
    '        <vertical padding="12">' +
    '            <text text="高级选项" textSize="14sp" textColor="#333333" textStyle="bold" marginBottom="8"/>' +

    '            <horizontal marginBottom="4">' +
    '                <text text="调试模式" textSize="12sp" textColor="#333333" layout_weight="1"/>' +
    '                <Switch id="switch_debug" checked="false"/>' +
    '            </horizontal>' +

    '            <horizontal>' +
    '                <button id="btn_force_update" text="强制更新脚本" style="Widget.AppCompat.Button.Borderless" textSize="12sp" layout_weight="1"/>' +
    '                <button id="btn_view_history" text="查看历史" style="Widget.AppCompat.Button.Borderless" textSize="12sp" layout_weight="1"/>' +
    '            </horizontal>' +
    '        </vertical>' +
    '    </card>' +

    // 权限状态卡片
    '    <card cardCornerRadius="8dp" cardElevation="2dp" marginBottom="12">' +
    '        <vertical padding="12">' +
    '            <text text="权限状态" textSize="14sp" textColor="#333333" textStyle="bold" marginBottom="8"/>' +
    '            <text id="text_perm_accessibility" text="无障碍服务: 检查中..." textSize="11sp" textColor="#666666" marginBottom="2"/>' +
    '            <text id="text_perm_overlay" text="悬浮窗权限: 检查中..." textSize="11sp" textColor="#666666" marginBottom="2"/>' +
    '            <text id="text_perm_storage" text="存储权限: 检查中..." textSize="11sp" textColor="#666666"/>' +
    '            <button id="btn_permission" text="检查权限" style="Widget.AppCompat.Button.Borderless" textSize="12sp" marginTop="4"/>' +
    '        </vertical>' +
    '    </card>' +

    // 操作按钮
    '    <horizontal marginTop="8">' +
    '        <button id="btn_save" text="保存" style="Widget.AppCompat.Button.Colored" layout_weight="1" marginRight="6"/>' +
    '        <button id="btn_run" text="立即执行" style="Widget.AppCompat.Button.Colored" layout_weight="1" marginLeft="6" bg="#4CAF50"/>' +
    '    </horizontal>' +

    '</vertical>'
);

var UIPresenter = {
    // 回调函数
    onSaveCallback: null,
    onRunCallback: null,
    onPermissionCallback: null,
    onForceUpdateCallback: null,

    // 定时任务设置
    scheduleHour: 9,
    scheduleMinute: 0,

    /**
     * 初始化并显示UI
     * @param {Object} callbacks - {onSave, onRun, onPermission, onForceUpdate}
     */
    show: function(callbacks) {
        var self = this;
        this.onSaveCallback = callbacks.onSave;
        this.onRunCallback = callbacks.onRun;
        this.onPermissionCallback = callbacks.onPermission;
        this.onForceUpdateCallback = callbacks.onForceUpdate;

        // 启用UI模式
        ui.layout(UI_LAYOUT);

        // 加载已保存的配置
        this.loadConfig();

        // 加载定时任务设置
        this.loadScheduleSettings();

        // 绑定事件
        this.bindEvents();

        // 更新状态显示
        this.updateStatusDisplay();
        this.updatePermissionStatus();
    },

    /**
     * 从存储加载配置到UI
     */
    loadConfig: function() {
        var config = Storage.getAll();

        ui.input_token.setText(config.pushplusToken || "");
        ui.input_package.setText(config.targetAppPackage || "");
        ui.input_script_url.setText(config.cloudScriptUrl || "");

        var delay = config.maxRandomDelay || 5;
        ui.seekbar_delay.setProgress(delay);
        ui.text_delay_value.setText(delay + " 分钟");

        ui.switch_debug.setChecked(config.debugMode || false);
    },

    /**
     * 加载定时任务设置
     */
    loadScheduleSettings: function() {
        var schedules = Scheduler.getSchedules();

        if (schedules.length > 0) {
            var schedule = schedules[0];
            this.scheduleHour = schedule.hour;
            this.scheduleMinute = schedule.minute;
            ui.switch_schedule.setChecked(schedule.enabled);
            ui.btn_pick_time.setText(Scheduler.formatTime(schedule.hour, schedule.minute));

            if (schedule.enabled) {
                var nextTime = Scheduler.getNextExecutionTime(schedule.hour, schedule.minute);
                ui.text_next_exec.setText("下次执行: " + nextTime.toLocaleString());
            }
        }
    },

    /**
     * 从UI收集配置
     * @returns {Object} 配置对象
     */
    collectConfig: function() {
        return {
            pushplusToken: ui.input_token.getText().toString().trim(),
            targetAppPackage: ui.input_package.getText().toString().trim(),
            cloudScriptUrl: ui.input_script_url.getText().toString().trim(),
            maxRandomDelay: ui.seekbar_delay.getProgress(),
            debugMode: ui.switch_debug.isChecked()
        };
    },

    /**
     * 更新状态显示
     */
    updateStatusDisplay: function() {
        var stats = History.getStats();
        var latest = History.getLatest();

        ui.run(function() {
            // 成功率
            ui.text_stats.setText("成功率: " + stats.successRate + "% (共 " + stats.total + " 次)");

            // 最近执行
            if (latest) {
                var statusText = latest.success ? "成功" : "失败";
                var statusColor = latest.success ? "#4CAF50" : "#F44336";
                ui.text_last_exec.setText("上次执行: " + latest.date + " " + latest.time + " - " + statusText);
                ui.text_status.setText(statusText);
                ui.text_status.setTextColor(colors.parseColor(statusColor));
            } else {
                ui.text_last_exec.setText("上次执行: 无");
                ui.text_status.setText("就绪");
                ui.text_status.setTextColor(colors.parseColor("#4CAF50"));
            }
        });
    },

    /**
     * 绑定UI事件
     */
    bindEvents: function() {
        var self = this;

        // 滑块变化事件
        ui.seekbar_delay.setOnSeekBarChangeListener({
            onProgressChanged: function(seekBar, progress, fromUser) {
                ui.text_delay_value.setText(progress + " 分钟");
            },
            onStartTrackingTouch: function(seekBar) {},
            onStopTrackingTouch: function(seekBar) {}
        });

        // 定时开关
        ui.switch_schedule.on("check", function(checked) {
            self.handleScheduleToggle(checked);
        });

        // 时间选择
        ui.btn_pick_time.on("click", function() {
            self.showTimePicker();
        });

        // 保存按钮
        ui.btn_save.on("click", function() {
            var config = self.collectConfig();
            Storage.setAll(config);
            toast("配置已保存");

            if (self.onSaveCallback) {
                self.onSaveCallback(config);
            }
        });

        // 执行按钮
        ui.btn_run.on("click", function() {
            var config = self.collectConfig();
            Storage.setAll(config);

            var validation = Storage.validate();
            if (!validation.valid) {
                dialogs.alert("配置不完整", "请填写以下必填项:\n" + validation.missing.join("\n"));
                return;
            }

            if (self.onRunCallback) {
                self.onRunCallback(config);
            }
        });

        // 强制更新按钮
        ui.btn_force_update.on("click", function() {
            var url = ui.input_script_url.getText().toString().trim();
            if (!url) {
                toast("请先填写云端脚本URL");
                return;
            }

            if (self.onForceUpdateCallback) {
                self.onForceUpdateCallback(url);
            }
        });

        // 查看历史按钮
        ui.btn_view_history.on("click", function() {
            self.showHistoryDialog();
        });

        // 权限检查按钮
        ui.btn_permission.on("click", function() {
            if (self.onPermissionCallback) {
                self.onPermissionCallback();
            }
        });
    },

    /**
     * 处理定时开关
     */
    handleScheduleToggle: function(enabled) {
        var schedules = Scheduler.getSchedules();

        if (enabled) {
            if (schedules.length === 0) {
                // 创建新定时任务
                Scheduler.addSchedule({
                    hour: this.scheduleHour,
                    minute: this.scheduleMinute,
                    enabled: true,
                    label: "每日打卡"
                });
            } else {
                // 启用现有任务
                Scheduler.updateSchedule(schedules[0].id, { enabled: true });
            }

            var nextTime = Scheduler.getNextExecutionTime(this.scheduleHour, this.scheduleMinute);
            ui.text_next_exec.setText("下次执行: " + nextTime.toLocaleString());
            toast("定时任务已启用");
        } else {
            if (schedules.length > 0) {
                Scheduler.updateSchedule(schedules[0].id, { enabled: false });
            }
            ui.text_next_exec.setText("");
            toast("定时任务已关闭");
        }
    },

    /**
     * 显示时间选择器
     */
    showTimePicker: function() {
        var self = this;

        dialogs.build({
            title: "选择执行时间",
            content: "请输入时间 (格式: HH:MM)",
            inputHint: "09:00",
            inputPrefill: Scheduler.formatTime(this.scheduleHour, this.scheduleMinute),
            positive: "确定",
            negative: "取消"
        }).on("positive", function(text) {
            var match = text.match(/^(\d{1,2}):(\d{2})$/);
            if (match) {
                var hour = parseInt(match[1]);
                var minute = parseInt(match[2]);

                if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
                    self.scheduleHour = hour;
                    self.scheduleMinute = minute;

                    ui.btn_pick_time.setText(Scheduler.formatTime(hour, minute));

                    // 更新定时任务
                    var schedules = Scheduler.getSchedules();
                    if (schedules.length > 0) {
                        Scheduler.updateSchedule(schedules[0].id, {
                            hour: hour,
                            minute: minute
                        });
                    }

                    if (ui.switch_schedule.isChecked()) {
                        var nextTime = Scheduler.getNextExecutionTime(hour, minute);
                        ui.text_next_exec.setText("下次执行: " + nextTime.toLocaleString());
                    }

                    toast("时间已设置");
                } else {
                    toast("时间格式错误");
                }
            } else {
                toast("请输入正确格式 (HH:MM)");
            }
        }).show();
    },

    /**
     * 显示历史记录对话框
     */
    showHistoryDialog: function() {
        var history = History.getAll();
        var stats = History.getStats();

        if (history.length === 0) {
            dialogs.alert("执行历史", "暂无执行记录");
            return;
        }

        // 构建历史列表
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
                }
            });
        }).show();
    },

    /**
     * 更新权限状态显示
     * @param {Object} status - 可选的权限状态对象
     */
    updatePermissionStatus: function(status) {
        if (!status) {
            try {
                status = {
                    accessibility: auto.service !== null,
                    overlay: floaty.checkPermission(),
                    storage: files.isDir("/sdcard/")
                };
            } catch (e) {
                status = { accessibility: false, overlay: false, storage: false };
            }
        }

        var greenColor = "#4CAF50";
        var redColor = "#F44336";

        ui.run(function() {
            ui.text_perm_accessibility.setText("无障碍服务: " + (status.accessibility ? "已开启" : "未开启"));
            ui.text_perm_accessibility.setTextColor(colors.parseColor(status.accessibility ? greenColor : redColor));

            ui.text_perm_overlay.setText("悬浮窗权限: " + (status.overlay ? "已授予" : "未授予"));
            ui.text_perm_overlay.setTextColor(colors.parseColor(status.overlay ? greenColor : redColor));

            ui.text_perm_storage.setText("存储权限: " + (status.storage ? "已授予" : "未授予"));
            ui.text_perm_storage.setTextColor(colors.parseColor(status.storage ? greenColor : redColor));
        });
    },

    /**
     * 显示加载中对话框
     * @param {string} message - 提示信息
     * @returns {Dialog} 对话框对象
     */
    showLoading: function(message) {
        return dialogs.build({
            title: "请稍候",
            content: message || "加载中...",
            progress: { max: -1 },
            cancelable: false
        }).show();
    }
};

module.exports = UIPresenter;
