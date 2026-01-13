/**
 * pushplus.js - PushPlus 推送通知模块
 * ClockMaster - PushPlus Notification Module
 *
 * 官方文档: https://www.pushplus.plus/doc/
 */

var Storage = require("./storage.js");

// PushPlus API 配置
var PUSHPLUS_API = "http://www.pushplus.plus/send";
var REQUEST_TIMEOUT = 10000; // 10秒超时

var PushPlus = {
    /**
     * 发送推送通知
     * @param {Object} options - {title, content, token, template}
     * @returns {Object} {success: boolean, message: string, code: number}
     */
    send: function(options) {
        var token = options.token || Storage.get("pushplusToken", "");

        if (!token || token.trim() === "") {
            log("PushPlus Token 未配置，跳过推送");
            return {
                success: false,
                message: "Token 未配置",
                code: -1
            };
        }

        var title = options.title || "ClockMaster 通知";
        var content = options.content || "";
        var template = options.template || "html"; // html, txt, json, markdown

        try {
            log("发送 PushPlus 推送: " + title);

            var response = http.post(PUSHPLUS_API, {
                token: token,
                title: title,
                content: content,
                template: template
            }, {
                headers: {
                    "Content-Type": "application/json"
                },
                timeout: REQUEST_TIMEOUT
            });

            if (response.statusCode === 200) {
                var result = response.body.json();

                if (result.code === 200) {
                    log("推送成功: " + result.msg);
                    return {
                        success: true,
                        message: result.msg || "发送成功",
                        code: result.code
                    };
                } else {
                    log("推送失败: " + result.msg);
                    return {
                        success: false,
                        message: result.msg || "发送失败",
                        code: result.code
                    };
                }
            } else {
                log("HTTP 请求失败: " + response.statusCode);
                return {
                    success: false,
                    message: "HTTP " + response.statusCode,
                    code: response.statusCode
                };
            }

        } catch (e) {
            log("推送异常: " + e.message);
            return {
                success: false,
                message: e.message,
                code: -2
            };
        }
    },

    /**
     * 发送成功通知
     * @param {Object} data - {duration, timestamp, scriptVersion}
     * @returns {Object} 发送结果
     */
    sendSuccess: function(data) {
        var duration = data.duration || 0;
        var durationText = this.formatDuration(duration);
        var timestamp = data.timestamp || Date.now();
        var timeText = new Date(timestamp).toLocaleString();
        var version = data.scriptVersion || "unknown";

        var content = "<h2 style='color:#4CAF50;'>✓ 打卡成功</h2>";
        content += "<p><strong>执行时间:</strong> " + timeText + "</p>";
        content += "<p><strong>耗时:</strong> " + durationText + "</p>";
        content += "<p><strong>脚本版本:</strong> " + version + "</p>";
        content += "<hr>";
        content += "<p style='color:#999;font-size:12px;'>ClockMaster 自动打卡助手</p>";

        return this.send({
            title: "✓ ClockMaster - 打卡成功",
            content: content,
            template: "html"
        });
    },

    /**
     * 发送失败通知
     * @param {Object} data - {error, timestamp, scriptVersion, screenshotPath}
     * @returns {Object} 发送结果
     */
    sendFailure: function(data) {
        var error = data.error || "未知错误";
        var timestamp = data.timestamp || Date.now();
        var timeText = new Date(timestamp).toLocaleString();
        var version = data.scriptVersion || "unknown";
        var screenshot = data.screenshotPath || null;

        var content = "<h2 style='color:#F44336;'>✗ 打卡失败</h2>";
        content += "<p><strong>执行时间:</strong> " + timeText + "</p>";
        content += "<p><strong>错误信息:</strong> " + error + "</p>";
        content += "<p><strong>脚本版本:</strong> " + version + "</p>";

        if (screenshot) {
            content += "<p><strong>截图路径:</strong> " + screenshot + "</p>";
        }

        content += "<hr>";
        content += "<p style='color:#999;font-size:12px;'>ClockMaster 自动打卡助手</p>";
        content += "<p style='color:#ff9800;'>请检查日志或截图排查问题</p>";

        return this.send({
            title: "✗ ClockMaster - 打卡失败",
            content: content,
            template: "html"
        });
    },

    /**
     * 发送测试通知
     * @returns {Object} 发送结果
     */
    sendTest: function() {
        var content = "<h2>测试通知</h2>";
        content += "<p>ClockMaster 推送服务已正常工作！</p>";
        content += "<p><strong>时间:</strong> " + new Date().toLocaleString() + "</p>";

        return this.send({
            title: "ClockMaster - 测试通知",
            content: content,
            template: "html"
        });
    },

    /**
     * 发送自定义通知
     * @param {string} title - 标题
     * @param {string} message - 消息内容
     * @param {string} level - 级别 (info, success, warning, error)
     * @returns {Object} 发送结果
     */
    sendCustom: function(title, message, level) {
        level = level || "info";

        var colors = {
            info: "#2196F3",
            success: "#4CAF50",
            warning: "#FF9800",
            error: "#F44336"
        };

        var icons = {
            info: "ℹ️",
            success: "✓",
            warning: "⚠️",
            error: "✗"
        };

        var color = colors[level] || colors.info;
        var icon = icons[level] || icons.info;

        var content = "<h2 style='color:" + color + ";'>" + icon + " " + title + "</h2>";
        content += "<p>" + message + "</p>";
        content += "<p style='color:#999;font-size:12px;'>" + new Date().toLocaleString() + "</p>";

        return this.send({
            title: icon + " ClockMaster - " + title,
            content: content,
            template: "html"
        });
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
            return minutes + " 分 " + seconds + " 秒";
        }
        return seconds + " 秒";
    },

    /**
     * 验证 Token 是否有效
     * @param {string} token - PushPlus Token
     * @returns {boolean}
     */
    validateToken: function(token) {
        if (!token || typeof token !== "string") {
            return false;
        }

        // PushPlus Token 格式检查 (通常是 32 位字符串)
        return token.length >= 20 && /^[a-zA-Z0-9]+$/.test(token);
    },

    /**
     * 批量发送通知（带重试）
     * @param {Array} notifications - 通知数组
     * @param {number} retries - 重试次数
     * @returns {Object} {total, success, failed}
     */
    sendBatch: function(notifications, retries) {
        retries = retries || 2;
        var results = {
            total: notifications.length,
            success: 0,
            failed: 0,
            details: []
        };

        for (var i = 0; i < notifications.length; i++) {
            var notification = notifications[i];
            var result = null;

            // 重试机制
            for (var attempt = 0; attempt < retries; attempt++) {
                result = this.send(notification);
                if (result.success) {
                    results.success++;
                    results.details.push({ index: i, success: true });
                    break;
                }

                if (attempt < retries - 1) {
                    sleep(1000); // 重试前等待1秒
                }
            }

            if (!result.success) {
                results.failed++;
                results.details.push({
                    index: i,
                    success: false,
                    error: result.message
                });
            }

            // 避免频繁请求
            if (i < notifications.length - 1) {
                sleep(500);
            }
        }

        return results;
    }
};

module.exports = PushPlus;
