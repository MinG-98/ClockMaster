/**
 * history.js - 执行历史记录模块
 * ClockMaster - Execution History Module
 */

var Storage = require("./storage.js");

// 历史记录存储
var HISTORY_KEY = "clockmaster_history";
var MAX_HISTORY = 50; // 最多保存50条记录

var History = {
    /**
     * 获取所有历史记录
     * @returns {Array} 历史记录列表 (最新在前)
     */
    getAll: function() {
        var history = Storage.get(HISTORY_KEY, []);
        return Array.isArray(history) ? history : [];
    },

    /**
     * 添加执行记录
     * @param {Object} record - 执行记录
     * @returns {string} 记录ID
     */
    add: function(record) {
        var history = this.getAll();
        var id = "exec_" + Date.now();

        var entry = {
            id: id,
            timestamp: Date.now(),
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            success: record.success || false,
            duration: record.duration || 0,
            errorMsg: record.errorMsg || null,
            source: record.source || "manual", // manual, scheduled
            scriptVersion: record.scriptVersion || "unknown"
        };

        // 添加到开头
        history.unshift(entry);

        // 限制数量
        if (history.length > MAX_HISTORY) {
            history = history.slice(0, MAX_HISTORY);
        }

        Storage.set(HISTORY_KEY, history);
        return id;
    },

    /**
     * 获取最近一次执行记录
     * @returns {Object|null}
     */
    getLatest: function() {
        var history = this.getAll();
        return history.length > 0 ? history[0] : null;
    },

    /**
     * 获取今日执行记录
     * @returns {Array}
     */
    getToday: function() {
        var today = new Date().toLocaleDateString();
        var history = this.getAll();
        var todayRecords = [];

        for (var i = 0; i < history.length; i++) {
            if (history[i].date === today) {
                todayRecords.push(history[i]);
            }
        }

        return todayRecords;
    },

    /**
     * 获取统计信息
     * @returns {Object}
     */
    getStats: function() {
        var history = this.getAll();
        var total = history.length;
        var success = 0;
        var failed = 0;

        for (var i = 0; i < history.length; i++) {
            if (history[i].success) {
                success++;
            } else {
                failed++;
            }
        }

        // 计算成功率
        var successRate = total > 0 ? Math.round((success / total) * 100) : 0;

        // 今日统计
        var todayRecords = this.getToday();
        var todaySuccess = 0;
        for (var j = 0; j < todayRecords.length; j++) {
            if (todayRecords[j].success) {
                todaySuccess++;
            }
        }

        return {
            total: total,
            success: success,
            failed: failed,
            successRate: successRate,
            todayTotal: todayRecords.length,
            todaySuccess: todaySuccess
        };
    },

    /**
     * 清除所有历史记录
     */
    clear: function() {
        Storage.set(HISTORY_KEY, []);
    },

    /**
     * 清除指定天数之前的记录
     * @param {number} days - 天数
     */
    clearOlderThan: function(days) {
        var cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
        var history = this.getAll();
        var newHistory = [];

        for (var i = 0; i < history.length; i++) {
            if (history[i].timestamp >= cutoff) {
                newHistory.push(history[i]);
            }
        }

        Storage.set(HISTORY_KEY, newHistory);
        return history.length - newHistory.length; // 返回删除数量
    },

    /**
     * 格式化持续时间
     * @param {number} ms - 毫秒
     * @returns {string}
     */
    formatDuration: function(ms) {
        var seconds = Math.floor(ms / 1000);
        var minutes = Math.floor(seconds / 60);
        seconds = seconds % 60;

        if (minutes > 0) {
            return minutes + "分" + seconds + "秒";
        }
        return seconds + "秒";
    },

    /**
     * 生成历史摘要文本
     * @returns {string}
     */
    getSummaryText: function() {
        var stats = this.getStats();
        var latest = this.getLatest();

        var summary = "总执行: " + stats.total + " 次\n";
        summary += "成功率: " + stats.successRate + "%\n";
        summary += "今日: " + stats.todaySuccess + "/" + stats.todayTotal + " 次成功\n";

        if (latest) {
            summary += "\n最近执行:\n";
            summary += "  时间: " + latest.date + " " + latest.time + "\n";
            summary += "  结果: " + (latest.success ? "成功" : "失败") + "\n";
            if (latest.errorMsg) {
                summary += "  错误: " + latest.errorMsg + "\n";
            }
        }

        return summary;
    }
};

module.exports = History;
