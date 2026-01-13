/**
 * scheduler.js - 高稳定性定时任务模块
 * ClockMaster - High Stability Scheduled Task Module
 *
 * 多重保障机制:
 * 1. Android AlarmManager 系统级定时
 * 2. 前台服务保活
 * 3. 启动时自动检测执行
 * 4. 支持外部 Intent 触发
 */

var Storage = require("./storage.js");

// Android 类引用
var Context = context;
var AlarmManager = Context.getSystemService(Context.ALARM_SERVICE);
var PendingIntent = android.app.PendingIntent;
var Intent = android.content.Intent;

// 定时任务存储键
var SCHEDULE_KEY = "clockmaster_schedules";
var LAST_TRIGGER_KEY = "clockmaster_last_trigger";

var Scheduler = {
    /**
     * 获取所有定时任务
     */
    getSchedules: function() {
        var schedules = Storage.get(SCHEDULE_KEY, []);
        return Array.isArray(schedules) ? schedules : [];
    },

    /**
     * 保存定时任务列表
     */
    saveSchedules: function(schedules) {
        Storage.set(SCHEDULE_KEY, schedules);
    },

    /**
     * 添加定时任务
     */
    addSchedule: function(schedule) {
        var schedules = this.getSchedules();
        var id = "schedule_" + Date.now();

        schedules.push({
            id: id,
            hour: schedule.hour || 9,
            minute: schedule.minute || 0,
            enabled: schedule.enabled !== false,
            label: schedule.label || "打卡任务",
            createdAt: Date.now()
        });

        this.saveSchedules(schedules);

        if (schedule.enabled !== false) {
            this.setSystemAlarm(id, schedule.hour, schedule.minute);
        }

        return id;
    },

    /**
     * 更新定时任务
     */
    updateSchedule: function(id, updates) {
        var schedules = this.getSchedules();

        for (var i = 0; i < schedules.length; i++) {
            if (schedules[i].id === id) {
                for (var key in updates) {
                    if (updates.hasOwnProperty(key)) {
                        schedules[i][key] = updates[key];
                    }
                }

                this.saveSchedules(schedules);

                if (schedules[i].enabled) {
                    this.setSystemAlarm(id, schedules[i].hour, schedules[i].minute);
                } else {
                    this.cancelSystemAlarm(id);
                }

                return true;
            }
        }

        return false;
    },

    /**
     * 删除定时任务
     */
    removeSchedule: function(id) {
        var schedules = this.getSchedules();
        var newSchedules = [];

        for (var i = 0; i < schedules.length; i++) {
            if (schedules[i].id !== id) {
                newSchedules.push(schedules[i]);
            }
        }

        this.saveSchedules(newSchedules);
        this.cancelSystemAlarm(id);
    },

    /**
     * 设置系统级闹钟 (AlarmManager)
     */
    setSystemAlarm: function(id, hour, minute) {
        try {
            var targetTime = this.getNextExecutionTime(hour, minute);
            var triggerTime = targetTime.getTime();

            log("[Scheduler] 设置系统闹钟: " + id + " -> " + hour + ":" + minute);
            log("[Scheduler] 触发时间: " + targetTime.toLocaleString());

            // 创建唤醒 Intent
            var intent = new Intent(Context, Context.getClass());
            intent.setAction("com.m1n6.clockmaster.ALARM_TRIGGER");
            intent.putExtra("schedule_id", id);
            intent.putExtra("trigger_time", triggerTime);

            // 生成唯一的请求码
            var requestCode = Math.abs(id.hashCode());

            var pendingIntent = PendingIntent.getBroadcast(
                Context,
                requestCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            // 使用精确闹钟 (Android 6.0+)
            if (android.os.Build.VERSION.SDK_INT >= 23) {
                AlarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    triggerTime,
                    pendingIntent
                );
            } else {
                AlarmManager.setExact(
                    AlarmManager.RTC_WAKEUP,
                    triggerTime,
                    pendingIntent
                );
            }

            // 同时设置内部定时器作为备份
            this.setBackupTimer(id, hour, minute, triggerTime);

            return true;
        } catch (e) {
            log("[Scheduler] 设置系统闹钟失败: " + e.message);
            // 降级使用内部定时器
            this.setBackupTimer(id, hour, minute);
            return false;
        }
    },

    /**
     * 设置备份定时器
     */
    setBackupTimer: function(id, hour, minute, triggerTime) {
        if (!this._timers) {
            this._timers = {};
        }

        if (this._timers[id]) {
            clearTimeout(this._timers[id]);
        }

        var now = Date.now();
        if (!triggerTime) {
            triggerTime = this.getNextExecutionTime(hour, minute).getTime();
        }

        var delay = triggerTime - now;
        if (delay < 0) delay = 0;

        var self = this;
        this._timers[id] = setTimeout(function() {
            self.executeScheduledTask(id);
        }, delay);

        log("[Scheduler] 备份定时器已设置: " + id + " (延迟 " + Math.round(delay / 60000) + " 分钟)");
    },

    /**
     * 取消系统闘钟
     */
    cancelSystemAlarm: function(id) {
        try {
            var intent = new Intent(Context, Context.getClass());
            intent.setAction("com.m1n6.clockmaster.ALARM_TRIGGER");

            var requestCode = Math.abs(id.hashCode());
            var pendingIntent = PendingIntent.getBroadcast(
                Context,
                requestCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            AlarmManager.cancel(pendingIntent);
            log("[Scheduler] 系统闹钟已取消: " + id);
        } catch (e) {
            log("[Scheduler] 取消系统闹钟失败: " + e.message);
        }

        // 同时取消备份定时器
        if (this._timers && this._timers[id]) {
            clearTimeout(this._timers[id]);
            delete this._timers[id];
        }
    },

    /**
     * 执行定时任务
     */
    executeScheduledTask: function(id) {
        log("[Scheduler] ========== 定时任务触发 ==========");
        log("[Scheduler] 任务ID: " + id);
        log("[Scheduler] 触发时间: " + new Date().toLocaleString());

        try {
            // 记录触发时间
            Storage.set(LAST_TRIGGER_KEY, {
                id: id,
                time: Date.now()
            });

            // 唤醒设备
            device.wakeUpIfNeeded();
            sleep(1000);

            // 验证配置
            var validation = Storage.validate();
            if (!validation.valid) {
                log("[Scheduler] 配置不完整，跳过执行: " + validation.missing.join(", "));
                return false;
            }

            // 启动核心任务
            var Launcher = require("./launcher.js");
            var success = Launcher.launch();

            // 设置下一天的闹钟
            var schedules = this.getSchedules();
            for (var i = 0; i < schedules.length; i++) {
                if (schedules[i].id === id && schedules[i].enabled) {
                    this.setSystemAlarm(id, schedules[i].hour, schedules[i].minute);
                    break;
                }
            }

            return success;
        } catch (e) {
            log("[Scheduler] 执行定时任务失败: " + e.message);
            return false;
        }
    },

    /**
     * 启动时检查是否需要执行任务
     * (用于处理 APP 被杀死后重新启动的情况)
     */
    checkAndExecuteOnStartup: function() {
        log("[Scheduler] 检查启动时是否需要执行任务...");

        var schedules = this.getSchedules();
        var now = new Date();
        var currentMinutes = now.getHours() * 60 + now.getMinutes();

        for (var i = 0; i < schedules.length; i++) {
            var schedule = schedules[i];
            if (!schedule.enabled) continue;

            var scheduleMinutes = schedule.hour * 60 + schedule.minute;

            // 检查是否在任务时间的 5 分钟窗口内
            var diff = currentMinutes - scheduleMinutes;
            if (diff >= 0 && diff <= 5) {
                // 检查今天是否已经执行过
                var lastTrigger = Storage.get(LAST_TRIGGER_KEY, null);
                var today = now.toDateString();

                if (!lastTrigger || new Date(lastTrigger.time).toDateString() !== today) {
                    log("[Scheduler] 发现未执行的定时任务: " + schedule.label);
                    toast("检测到定时任务，正在执行: " + schedule.label);
                    this.executeScheduledTask(schedule.id);
                    return true;
                }
            }
        }

        return false;
    },

    /**
     * 初始化所有启用的定时任务
     */
    initAllSchedules: function() {
        var schedules = this.getSchedules();
        var count = 0;

        for (var i = 0; i < schedules.length; i++) {
            if (schedules[i].enabled) {
                this.setSystemAlarm(
                    schedules[i].id,
                    schedules[i].hour,
                    schedules[i].minute
                );
                count++;
            }
        }

        log("[Scheduler] 初始化定时任务: " + count + " 个");

        // 启动时检查是否有遗漏的任务
        this.checkAndExecuteOnStartup();

        return count;
    },

    /**
     * 取消所有定时任务
     */
    cancelAllSchedules: function() {
        var schedules = this.getSchedules();
        for (var i = 0; i < schedules.length; i++) {
            this.cancelSystemAlarm(schedules[i].id);
        }

        if (this._timers) {
            for (var id in this._timers) {
                if (this._timers.hasOwnProperty(id)) {
                    clearTimeout(this._timers[id]);
                }
            }
            this._timers = {};
        }

        log("[Scheduler] 所有定时任务已取消");
    },

    /**
     * 格式化时间显示
     */
    formatTime: function(hour, minute) {
        var h = hour < 10 ? "0" + hour : hour;
        var m = minute < 10 ? "0" + minute : minute;
        return h + ":" + m;
    },

    /**
     * 获取下次执行时间
     */
    getNextExecutionTime: function(hour, minute) {
        var now = new Date();
        var next = new Date();
        next.setHours(hour, minute, 0, 0);

        if (next.getTime() <= now.getTime()) {
            next.setDate(next.getDate() + 1);
        }

        return next;
    },

    /**
     * 获取所有定时任务状态信息
     */
    getStatusInfo: function() {
        var schedules = this.getSchedules();
        var info = [];

        for (var i = 0; i < schedules.length; i++) {
            var s = schedules[i];
            if (s.enabled) {
                var next = this.getNextExecutionTime(s.hour, s.minute);
                info.push({
                    label: s.label,
                    time: this.formatTime(s.hour, s.minute),
                    nextExecution: next.toLocaleString()
                });
            }
        }

        return info;
    }
};

module.exports = Scheduler;
