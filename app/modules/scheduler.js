/**
 * scheduler.js - 定时任务模块
 * ClockMaster - Scheduled Task Module
 *
 * 支持设置每日定时打卡
 */

var Storage = require("./storage.js");

// 定时任务存储键
var SCHEDULE_KEY = "clockmaster_schedules";

var Scheduler = {
    /**
     * 获取所有定时任务
     * @returns {Array} 定时任务列表
     */
    getSchedules: function() {
        var schedules = Storage.get(SCHEDULE_KEY, []);
        return Array.isArray(schedules) ? schedules : [];
    },

    /**
     * 保存定时任务列表
     * @param {Array} schedules - 定时任务列表
     */
    saveSchedules: function(schedules) {
        Storage.set(SCHEDULE_KEY, schedules);
    },

    /**
     * 添加定时任务
     * @param {Object} schedule - {hour, minute, enabled, label}
     * @returns {string} 任务ID
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
        this.setupAlarm(id, schedule.hour, schedule.minute);

        return id;
    },

    /**
     * 更新定时任务
     * @param {string} id - 任务ID
     * @param {Object} updates - 更新内容
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

                // 重新设置闹钟
                if (schedules[i].enabled) {
                    this.setupAlarm(id, schedules[i].hour, schedules[i].minute);
                } else {
                    this.cancelAlarm(id);
                }

                return true;
            }
        }

        return false;
    },

    /**
     * 删除定时任务
     * @param {string} id - 任务ID
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
        this.cancelAlarm(id);
    },

    /**
     * 设置系统闹钟
     * @param {string} id - 任务ID
     * @param {number} hour - 小时
     * @param {number} minute - 分钟
     */
    setupAlarm: function(id, hour, minute) {
        try {
            // 计算下次执行时间
            var now = new Date();
            var targetTime = new Date();
            targetTime.setHours(hour, minute, 0, 0);

            // 如果今天的时间已过，设置为明天
            if (targetTime.getTime() <= now.getTime()) {
                targetTime.setDate(targetTime.getDate() + 1);
            }

            var delay = targetTime.getTime() - now.getTime();

            log("设置定时任务: " + id + " -> " + hour + ":" + minute + " (延迟 " + Math.round(delay / 60000) + " 分钟)");

            // 使用 Timers 设置定时
            // 注意: Auto.js 的 setInterval/setTimeout 在脚本退出后不会保持
            // 这里使用 threads 保持运行

            // 存储定时器ID以便取消
            if (!this._timers) {
                this._timers = {};
            }

            // 取消旧的定时器
            if (this._timers[id]) {
                clearTimeout(this._timers[id]);
            }

            var self = this;
            this._timers[id] = setTimeout(function() {
                self.executeScheduledTask(id);
            }, delay);

            return true;
        } catch (e) {
            log("设置闹钟失败: " + e.message);
            return false;
        }
    },

    /**
     * 取消闹钟
     * @param {string} id - 任务ID
     */
    cancelAlarm: function(id) {
        if (this._timers && this._timers[id]) {
            clearTimeout(this._timers[id]);
            delete this._timers[id];
            log("取消定时任务: " + id);
        }
    },

    /**
     * 执行定时任务
     * @param {string} id - 任务ID
     */
    executeScheduledTask: function(id) {
        log("定时任务触发: " + id);

        try {
            // 获取配置
            var config = Storage.getAll();

            // 验证配置
            var validation = Storage.validate();
            if (!validation.valid) {
                log("配置不完整，跳过执行");
                return;
            }

            // 唤醒设备
            device.wakeUpIfNeeded();
            sleep(1000);

            // 启动核心任务
            var Launcher = require("./launcher.js");
            Launcher.launch(config);

            // 重新设置下一天的闘钟
            var schedules = this.getSchedules();
            for (var i = 0; i < schedules.length; i++) {
                if (schedules[i].id === id && schedules[i].enabled) {
                    this.setupAlarm(id, schedules[i].hour, schedules[i].minute);
                    break;
                }
            }

        } catch (e) {
            log("执行定时任务失败: " + e.message);
        }
    },

    /**
     * 初始化所有启用的定时任务
     */
    initAllSchedules: function() {
        var schedules = this.getSchedules();
        var count = 0;

        for (var i = 0; i < schedules.length; i++) {
            if (schedules[i].enabled) {
                this.setupAlarm(
                    schedules[i].id,
                    schedules[i].hour,
                    schedules[i].minute
                );
                count++;
            }
        }

        log("初始化定时任务: " + count + " 个");
        return count;
    },

    /**
     * 取消所有定时任务
     */
    cancelAllSchedules: function() {
        if (this._timers) {
            for (var id in this._timers) {
                if (this._timers.hasOwnProperty(id)) {
                    clearTimeout(this._timers[id]);
                }
            }
            this._timers = {};
        }
        log("所有定时任务已取消");
    },

    /**
     * 格式化时间显示
     * @param {number} hour - 小时
     * @param {number} minute - 分钟
     * @returns {string}
     */
    formatTime: function(hour, minute) {
        var h = hour < 10 ? "0" + hour : hour;
        var m = minute < 10 ? "0" + minute : minute;
        return h + ":" + m;
    },

    /**
     * 获取下次执行时间
     * @param {number} hour - 小时
     * @param {number} minute - 分钟
     * @returns {Date}
     */
    getNextExecutionTime: function(hour, minute) {
        var now = new Date();
        var next = new Date();
        next.setHours(hour, minute, 0, 0);

        if (next.getTime() <= now.getTime()) {
            next.setDate(next.getDate() + 1);
        }

        return next;
    }
};

module.exports = Scheduler;
