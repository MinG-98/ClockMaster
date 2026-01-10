/**
 * utils.js - 通用工具模块
 * ClockMaster - Utility Module
 */

var Utils = {
    /**
     * 生成指定范围内的随机整数
     * @param {number} min - 最小值
     * @param {number} max - 最大值
     * @returns {number}
     */
    randomInt: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * 随机延迟
     * @param {number} minMs - 最小毫秒
     * @param {number} maxMs - 最大毫秒
     */
    randomSleep: function(minMs, maxMs) {
        var delay = this.randomInt(minMs || 500, maxMs || 1500);
        sleep(delay);
    },

    /**
     * 格式化时间戳为日期字符串
     * @param {number} timestamp - 时间戳
     * @param {string} format - 格式 (date/time/datetime)
     * @returns {string}
     */
    formatTime: function(timestamp, format) {
        var date = new Date(timestamp);
        format = format || "datetime";

        var dateStr = date.toLocaleDateString();
        var timeStr = date.toLocaleTimeString();

        switch (format) {
            case "date": return dateStr;
            case "time": return timeStr;
            default: return dateStr + " " + timeStr;
        }
    },

    /**
     * 格式化持续时间
     * @param {number} ms - 毫秒
     * @returns {string}
     */
    formatDuration: function(ms) {
        var seconds = Math.floor(ms / 1000);
        var minutes = Math.floor(seconds / 60);
        var hours = Math.floor(minutes / 60);

        seconds = seconds % 60;
        minutes = minutes % 60;

        if (hours > 0) {
            return hours + "小时" + minutes + "分" + seconds + "秒";
        } else if (minutes > 0) {
            return minutes + "分" + seconds + "秒";
        }
        return seconds + "秒";
    },

    /**
     * 安全执行函数，捕获异常
     * @param {Function} fn - 要执行的函数
     * @param {*} defaultValue - 异常时的默认返回值
     * @returns {*}
     */
    safeCall: function(fn, defaultValue) {
        try {
            return fn();
        } catch (e) {
            log("SafeCall Error: " + e.message);
            return defaultValue;
        }
    },

    /**
     * 重试执行函数
     * @param {Function} fn - 要执行的函数
     * @param {number} maxRetries - 最大重试次数
     * @param {number} delay - 重试间隔(毫秒)
     * @returns {*}
     */
    retry: function(fn, maxRetries, delay) {
        maxRetries = maxRetries || 3;
        delay = delay || 1000;

        for (var i = 0; i < maxRetries; i++) {
            try {
                return fn();
            } catch (e) {
                log("Retry " + (i + 1) + "/" + maxRetries + " failed: " + e.message);
                if (i < maxRetries - 1) {
                    sleep(delay);
                }
            }
        }

        throw new Error("所有重试均失败");
    },

    /**
     * 检查是否在指定时间范围内
     * @param {number} startHour - 开始小时
     * @param {number} endHour - 结束小时
     * @returns {boolean}
     */
    isInTimeRange: function(startHour, endHour) {
        var now = new Date();
        var currentHour = now.getHours();

        if (startHour <= endHour) {
            return currentHour >= startHour && currentHour < endHour;
        } else {
            // 跨夜情况
            return currentHour >= startHour || currentHour < endHour;
        }
    },

    /**
     * 获取设备信息
     * @returns {Object}
     */
    getDeviceInfo: function() {
        return {
            brand: device.brand,
            model: device.model,
            android: device.release,
            sdk: device.sdkInt,
            width: device.width,
            height: device.height,
            serial: device.serial
        };
    },

    /**
     * 确保目录存在
     * @param {string} dirPath - 目录路径
     */
    ensureDir: function(dirPath) {
        if (!files.exists(dirPath)) {
            files.createWithDirs(dirPath + "/placeholder");
            files.remove(dirPath + "/placeholder");
        }
    },

    /**
     * 安全读取JSON文件
     * @param {string} filePath - 文件路径
     * @param {*} defaultValue - 默认值
     * @returns {*}
     */
    readJson: function(filePath, defaultValue) {
        try {
            if (files.exists(filePath)) {
                var content = files.read(filePath);
                return JSON.parse(content);
            }
        } catch (e) {
            log("ReadJson Error: " + e.message);
        }
        return defaultValue;
    },

    /**
     * 安全写入JSON文件
     * @param {string} filePath - 文件路径
     * @param {*} data - 数据
     * @returns {boolean}
     */
    writeJson: function(filePath, data) {
        try {
            var content = JSON.stringify(data, null, 2);
            files.write(filePath, content);
            return true;
        } catch (e) {
            log("WriteJson Error: " + e.message);
            return false;
        }
    },

    /**
     * 唤醒并解锁设备
     * @returns {boolean}
     */
    wakeUpDevice: function() {
        try {
            device.wakeUpIfNeeded();
            sleep(500);

            if (device.isScreenOn()) {
                // 尝试解锁
                if (context.getSystemService(context.KEYGUARD_SERVICE).isKeyguardLocked()) {
                    // 滑动解锁
                    swipe(device.width / 2, device.height * 0.8, device.width / 2, device.height * 0.2, 300);
                    sleep(500);
                }
                return true;
            }
            return false;
        } catch (e) {
            log("WakeUp Error: " + e.message);
            return false;
        }
    },

    /**
     * 生成简单唯一ID
     * @returns {string}
     */
    generateId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    },

    /**
     * 截取字符串，超出显示省略号
     * @param {string} str - 字符串
     * @param {number} maxLen - 最大长度
     * @returns {string}
     */
    truncate: function(str, maxLen) {
        if (!str) return "";
        if (str.length <= maxLen) return str;
        return str.substring(0, maxLen - 3) + "...";
    },

    /**
     * 判断是否为工作日
     * @returns {boolean}
     */
    isWorkday: function() {
        var day = new Date().getDay();
        return day >= 1 && day <= 5;
    },

    /**
     * 获取今天的日期字符串 (YYYY-MM-DD)
     * @returns {string}
     */
    getTodayStr: function() {
        var now = new Date();
        var year = now.getFullYear();
        var month = ("0" + (now.getMonth() + 1)).slice(-2);
        var day = ("0" + now.getDate()).slice(-2);
        return year + "-" + month + "-" + day;
    }
};

module.exports = Utils;
