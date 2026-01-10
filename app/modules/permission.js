/**
 * permission.js - 权限检查与引导模块
 * ClockMaster - Permission Check & Wizard Module
 */

var Permission = {
    /**
     * 检查无障碍服务是否开启
     * @returns {boolean}
     */
    checkAccessibility: function() {
        return auto.service !== null;
    },

    /**
     * 检查悬浮窗权限
     * @returns {boolean}
     */
    checkOverlay: function() {
        return floaty.checkPermission();
    },

    /**
     * 检查存储权限
     * @returns {boolean}
     */
    checkStorage: function() {
        // Android 6.0+ 需要动态权限
        if (device.sdkInt >= 23) {
            return files.isDir("/sdcard/");
        }
        return true;
    },

    /**
     * 获取所有权限状态
     * @returns {Object} 权限状态对象
     */
    checkAll: function() {
        return {
            accessibility: this.checkAccessibility(),
            overlay: this.checkOverlay(),
            storage: this.checkStorage()
        };
    },

    /**
     * 检查所有必需权限是否已授予
     * @returns {boolean}
     */
    isAllGranted: function() {
        var status = this.checkAll();
        return status.accessibility && status.overlay && status.storage;
    },

    /**
     * 请求无障碍服务权限
     * @param {Function} callback - 回调函数(granted: boolean)
     */
    requestAccessibility: function(callback) {
        var self = this;

        if (this.checkAccessibility()) {
            callback && callback(true);
            return;
        }

        dialogs.build({
            title: "需要无障碍权限",
            content: "ClockMaster 需要无障碍服务权限才能自动化操作。\n\n请在设置中找到 \"ClockMaster\" 或 \"Auto.js\" 并开启服务。",
            positive: "去设置",
            negative: "取消",
            cancelable: false
        }).on("positive", function() {
            try {
                app.startActivity({
                    action: "android.settings.ACCESSIBILITY_SETTINGS"
                });
            } catch (e) {
                toast("无法打开设置，请手动开启无障碍服务");
            }

            // 轮询检查权限状态
            var checkCount = 0;
            var maxCheck = 60; // 最多等待60秒

            var checkInterval = setInterval(function() {
                checkCount++;
                if (self.checkAccessibility()) {
                    clearInterval(checkInterval);
                    toast("无障碍服务已开启");
                    callback && callback(true);
                } else if (checkCount >= maxCheck) {
                    clearInterval(checkInterval);
                    callback && callback(false);
                }
            }, 1000);

        }).on("negative", function() {
            callback && callback(false);
        }).show();
    },

    /**
     * 请求悬浮窗权限
     * @param {Function} callback - 回调函数(granted: boolean)
     */
    requestOverlay: function(callback) {
        var self = this;

        if (this.checkOverlay()) {
            callback && callback(true);
            return;
        }

        dialogs.build({
            title: "需要悬浮窗权限",
            content: "ClockMaster 需要悬浮窗权限来显示运行状态。\n\n请允许应用显示在其他应用上层。",
            positive: "去设置",
            negative: "取消",
            cancelable: false
        }).on("positive", function() {
            floaty.requestPermission();

            // 轮询检查权限状态
            var checkCount = 0;
            var maxCheck = 60;

            var checkInterval = setInterval(function() {
                checkCount++;
                if (self.checkOverlay()) {
                    clearInterval(checkInterval);
                    toast("悬浮窗权限已授予");
                    callback && callback(true);
                } else if (checkCount >= maxCheck) {
                    clearInterval(checkInterval);
                    callback && callback(false);
                }
            }, 1000);

        }).on("negative", function() {
            callback && callback(false);
        }).show();
    },

    /**
     * 请求存储权限
     * @param {Function} callback - 回调函数(granted: boolean)
     */
    requestStorage: function(callback) {
        if (this.checkStorage()) {
            callback && callback(true);
            return;
        }

        // 请求存储权限
        var granted = requestPermission("android.permission.WRITE_EXTERNAL_STORAGE");
        callback && callback(granted);
    },

    /**
     * 权限引导向导 - 依次请求所有必需权限
     * @param {Function} onComplete - 完成回调(allGranted: boolean)
     */
    runWizard: function(onComplete) {
        var self = this;

        log("开始权限检查向导...");

        // Step 1: 检查存储权限
        this.requestStorage(function(storageGranted) {
            if (!storageGranted) {
                toast("存储权限被拒绝，部分功能可能无法使用");
            }

            // Step 2: 检查悬浮窗权限
            self.requestOverlay(function(overlayGranted) {
                if (!overlayGranted) {
                    dialogs.alert("权限不足", "悬浮窗权限未授予，应用无法正常运行");
                    onComplete && onComplete(false);
                    return;
                }

                // Step 3: 检查无障碍权限
                self.requestAccessibility(function(accessGranted) {
                    if (!accessGranted) {
                        dialogs.alert("权限不足", "无障碍服务未开启，应用无法自动化操作");
                        onComplete && onComplete(false);
                        return;
                    }

                    log("所有权限检查完成");
                    onComplete && onComplete(true);
                });
            });
        });
    },

    /**
     * 快速检查并提示缺失权限
     * @returns {Object} {passed: boolean, message: string}
     */
    quickCheck: function() {
        var status = this.checkAll();
        var missing = [];

        if (!status.accessibility) missing.push("无障碍服务");
        if (!status.overlay) missing.push("悬浮窗权限");
        if (!status.storage) missing.push("存储权限");

        if (missing.length === 0) {
            return { passed: true, message: "所有权限已就绪" };
        } else {
            return {
                passed: false,
                message: "缺少权限: " + missing.join(", ")
            };
        }
    }
};

module.exports = Permission;
