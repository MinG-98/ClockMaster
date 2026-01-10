/**
 * main.js - ClockMaster 主入口
 * ClockMaster - Main Entry Point
 *
 * 流程: 权限检查 -> 显示UI -> 用户配置 -> 执行任务
 */

"ui";

// 模块导入
var Permission = require("./modules/permission.js");
var Storage = require("./modules/storage.js");
var UIPresenter = require("./modules/ui_pres.js");
var Launcher = require("./modules/launcher.js");
var History = require("./modules/history.js");
var Scheduler = require("./modules/scheduler.js");

// 全局状态
var floatyWindow = null;
var isRunning = false;
var currentExecution = null;

/**
 * 创建状态悬浮窗
 * @returns {Object} 悬浮窗对象
 */
function createStatusFloaty() {
    if (floatyWindow) {
        try {
            floatyWindow.close();
        } catch (e) {}
    }

    floatyWindow = floaty.rawWindow(
        '<frame gravity="center" bg="#AA000000" padding="12">' +
        '    <text id="status" text="ClockMaster" textSize="14sp" textColor="#FFFFFF"/>' +
        '</frame>'
    );

    floatyWindow.setPosition(50, 200);
    floatyWindow.setTouchable(false);

    return floatyWindow;
}

/**
 * 更新悬浮窗状态
 * @param {string} status - 状态文本
 */
function updateFloatyStatus(status) {
    if (floatyWindow) {
        ui.run(function() {
            try {
                floatyWindow.status.setText(status);
            } catch (e) {}
        });
    }
}

/**
 * 关闭悬浮窗
 */
function closeFloaty() {
    if (floatyWindow) {
        try {
            floatyWindow.close();
            floatyWindow = null;
        } catch (e) {}
    }
}

/**
 * 执行核心任务
 * @param {Object} config - 配置对象
 * @param {string} source - 触发来源 (manual/scheduled)
 */
function executeTask(config, source) {
    source = source || "manual";

    if (isRunning) {
        toast("任务正在执行中...");
        return;
    }

    isRunning = true;
    var startTime = Date.now();

    // 确认对话框
    dialogs.build({
        title: "确认执行",
        content: "即将开始执行打卡任务。\n\n" +
                 "目标App: " + (config.targetAppPackage || "未设置") + "\n" +
                 "最大延迟: " + config.maxRandomDelay + " 分钟",
        positive: "开始执行",
        negative: "取消"
    }).on("positive", function() {
        // 创建状态悬浮窗
        createStatusFloaty();

        // 设置Launcher状态回调
        Launcher.setStatusCallback(function(status) {
            updateFloatyStatus(status);
        });

        // 启动任务
        threads.start(function() {
            var success = false;
            var errorMsg = null;

            try {
                success = Launcher.launch(config);

                if (success) {
                    updateFloatyStatus("任务已启动，请等待...");
                } else {
                    updateFloatyStatus("启动失败");
                    errorMsg = "Launcher启动失败";
                }
            } catch (e) {
                console.error(e);
                updateFloatyStatus("错误: " + e.message);
                errorMsg = e.message;
                success = false;
            } finally {
                // 记录执行历史
                var duration = Date.now() - startTime;
                History.add({
                    success: success,
                    duration: duration,
                    errorMsg: errorMsg,
                    source: source,
                    scriptVersion: Launcher.checkAvailability().version || "unknown"
                });

                // 延迟关闭悬浮窗
                setTimeout(function() {
                    closeFloaty();
                    isRunning = false;

                    // 更新UI状态
                    ui.run(function() {
                        UIPresenter.updateStatusDisplay();
                    });
                }, 3000);
            }
        });

    }).on("negative", function() {
        isRunning = false;
    }).show();
}

/**
 * 强制更新脚本
 * @param {string} url - 脚本URL
 */
function forceUpdateScript(url) {
    var loadingDialog = UIPresenter.showLoading("正在更新脚本...");

    threads.start(function() {
        var success = Launcher.forceUpdate(url);

        ui.run(function() {
            loadingDialog.dismiss();

            if (success) {
                var info = Launcher.checkAvailability();
                dialogs.alert("更新成功", "脚本已更新到 v" + info.version);
            } else {
                dialogs.alert("更新失败", "无法获取云端脚本，请检查网络和URL");
            }
        });
    });
}

/**
 * 运行权限检查向导
 */
function runPermissionWizard() {
    Permission.runWizard(function(allGranted) {
        if (allGranted) {
            toast("所有权限已就绪");
            UIPresenter.updatePermissionStatus(Permission.checkAll());
        } else {
            dialogs.alert("权限不足", "部分必要权限未授予，可能影响正常使用。");
        }
    });
}

/**
 * 应用初始化
 */
function initialize() {
    log("====== ClockMaster 启动 ======");
    log("设备: " + device.brand + " " + device.model);
    log("Android: " + device.release + " (SDK " + device.sdkInt + ")");

    // 检查权限状态
    var permStatus = Permission.quickCheck();
    log("权限状态: " + permStatus.message);

    // 初始化定时任务
    var scheduleCount = Scheduler.initAllSchedules();
    log("定时任务: " + scheduleCount + " 个");

    // 如果权限不完整，先运行向导
    if (!permStatus.passed) {
        Permission.runWizard(function(allGranted) {
            showMainUI();
            if (!allGranted) {
                toast("部分权限未授予，可能影响功能");
            }
        });
    } else {
        showMainUI();
    }
}

/**
 * 显示主界面
 */
function showMainUI() {
    UIPresenter.show({
        // 保存配置回调
        onSave: function(config) {
            log("配置已保存");
        },

        // 执行任务回调
        onRun: function(config) {
            var permStatus = Permission.quickCheck();
            if (!permStatus.passed) {
                dialogs.alert("权限不足", permStatus.message + "\n\n请先授予必要权限。");
                return;
            }
            executeTask(config, "manual");
        },

        // 权限检查回调
        onPermission: function() {
            runPermissionWizard();
        },

        // 强制更新回调
        onForceUpdate: function(url) {
            forceUpdateScript(url);
        }
    });

    // 显示脚本状态
    var availability = Launcher.checkAvailability();
    if (availability.available) {
        log("本地脚本: v" + availability.version + " (" + availability.lastUpdateStr + ")");
    } else {
        log("本地脚本: 无备份");
    }

    // 显示历史统计
    var stats = History.getStats();
    log("执行统计: " + stats.total + " 次, 成功率 " + stats.successRate + "%");
}

/**
 * 清理资源
 */
function cleanup() {
    closeFloaty();
    Scheduler.cancelAllSchedules();
    log("====== ClockMaster 已退出 ======");
}

// 监听退出事件
events.on("exit", function() {
    cleanup();
});

// 启动应用
initialize();
