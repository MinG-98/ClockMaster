/**
 * Project ClockMaster - Core Task B (v5.2B 无截图版)
 * 特性：无障碍节点检测、策略B（桌面快捷打卡）、自动处理失败弹窗
 * @version 5.2.0
 */

var floatyWindow = null;
var debugDot = null;
var startTime = Date.now();
var executionId = "exec_" + startTime;
var SCRIPT_VERSION = "5.2.0-B";

// 检测配置
var CHECK_CONFIG = {
    TIMEOUT_SEC: 10,
    TEXT_FAIL_TITLE: "打卡失败",
    TEXT_FAIL_CONFIRM: "确定",
    TEXT_SUCCESS_MARK: "打卡成功"
};

// ================= 主函数 =================
(function main() {
    var success = false;
    var errorMsg = null;
    var screenshotPath = null;

    try {
        // 1. 初始化配置
        showFloaty("v5.2B 启动中...");
        var config = loadConfig();

        // 配置诊断
        log("========== 配置诊断 ==========");
        log("targetAppName: " + (config.targetAppName || "UNDEFINED"));
        log("maxDelay: " + (config.maxDelay || "UNDEFINED"));
        log("pushplusToken: " + (config.pushplusToken ? "已设置" : "未设置"));
        log("==============================");

        if (!config.targetAppName) {
            throw new Error("致命错误：targetAppName 未配置！");
        }

        log("========== ClockMaster v5.2B 开始执行 ==========");
        log("执行ID: " + executionId);
        log("目标应用: " + config.targetAppName);
        log("屏幕尺寸: " + device.width + "x" + device.height);

        // 2. 权限检查（无需截图权限）
        auto.waitFor();
        device.keepScreenOn(300000);

        // 3. 随机延迟（防风控）
        if (config.maxDelay > 0) {
            var delayMinutes = randomInt(0, config.maxDelay);
            if (delayMinutes > 0) {
                showFloaty("随机延迟 " + delayMinutes + " 分钟");
                log("随机延迟: " + delayMinutes + " 分钟");

                for (var i = delayMinutes * 60; i > 0; i--) {
                    var mins = Math.floor(i / 60);
                    var secs = i % 60;
                    showFloaty("等待中 " + mins + ":" + (secs < 10 ? "0" : "") + secs);
                    sleep(1000);
                }
            }
        }

        // 4. 执行桌面快捷打卡（v5.2B）
        showFloaty("桌面快捷打卡...");
        log("========== 执行v5.2B桌面快捷打卡 ==========");
        if (!performClockInAction()) {
            throw new Error("桌面快捷打卡失败：未找到图标或快捷入口");
        }
        sleep(3000);
        log("========== 打卡点击完毕 ==========");

        // 9. 轮询检测结果（核心改动：无截图检测）
        showFloaty("检测结果中...");
        log("========== 开始轮询检测结果 ==========");
        var result = waitForResult();
        log("检测结果: " + result.status + " - " + result.message);

        // 10. 处理结果
        if (result.status === "success") {
            success = true;
            showFloaty("打卡成功！");
            log("========== 执行成功 ==========");
        } else if (result.status === "fail") {
            success = false;
            errorMsg = result.message;
            showFloaty("打卡失败: " + errorMsg);
            log("========== 执行失败 ==========");
            log("失败原因: " + errorMsg);

            // 自动关闭失败弹窗
            handleFailDialog();
        } else {
            // 超时，状态未知
            success = false;
            errorMsg = "检测超时，状态未知";
            showFloaty("超时未知");
            log("========== 超时未知 ==========");
        }

    } catch (e) {
        success = false;
        errorMsg = e.message || String(e);

        console.error("执行失败: " + errorMsg);
        console.error(e.stack || e);

        showFloaty("错误: " + errorMsg);
        log("========== 异常错误 ==========");
        log("错误信息: " + errorMsg);
    } finally {
        var endTime = Date.now();
        var duration = endTime - startTime;
        log("执行耗时: " + formatDuration(duration));

        // 记录历史
        try {
            saveHistory(success, duration, errorMsg, screenshotPath);
        } catch (historyErr) {
            log("保存历史失败: " + historyErr.message);
        }

        // 发送推送
        try {
            var config = loadConfig();
            if (config.pushplusToken) {
                if (success) {
                    sendSuccessPush(config.pushplusToken, duration);
                } else {
                    sendFailurePush(config.pushplusToken, errorMsg, screenshotPath);
                }
            } else {
                log("PushPlus Token 未配置，跳过推送");
            }
        } catch (pushErr) {
            log("发送推送失败: " + pushErr.message);
        }

        // 清理资源
        device.cancelKeepingAwake();
        sleep(3000);
        if (floatyWindow) {
            try { floatyWindow.close(); } catch(e) {}
        }
        if (debugDot) {
            try { debugDot.close(); } catch(e) {}
        }

        log("========== ClockMaster v5.2B 执行结束 ==========");
        exit();
    }
})();

// ================= v5.2B 辅助：考勤入口查找（未使用） =================
function findAndEnterAttendance() {
    var entry = textMatches(/移动考勤|打卡/).findOne(5000);
    if (entry) {
        log("找到考勤入口: " + entry.text());

        var target = entry;
        for (var i = 0; i < 5; i++) {
            if (target.clickable()) {
                log("找到可点击控件，层级: " + i);
                break;
            }
            var parent = target.parent();
            if (parent) {
                target = parent;
            } else {
                break;
            }
        }

        var b = target.bounds();
        var x = b.centerX();
        var y = b.centerY();
        log("点击考勤入口: (" + x + ", " + y + ")");
        showRedDot(x, y);
        press(x, y, 300);
    } else {
        throw new Error("未找到考勤入口");
    }
}

// ================= v5.2B 核心：桌面快捷打卡 =================
function performClockInAction() {
    var appName = "农商云办公";
    var shortcutText = "打卡";

    log("策略B: 回到桌面长按 " + appName + " 图标...");
    home();
    sleep(800);

    var icon = text(appName).findOne(3000);
    if (!icon) {
        log("策略B失败: 未找到桌面图标 " + appName);
        return false;
    }

    var b = icon.bounds();
    var x = b.centerX();
    var y = b.centerY();
    log("桌面图标坐标: (" + x + ", " + y + ")");

    // 优先尝试节点长按，避免坐标点击异常
    var longClicked = false;
    try {
        if (icon.longClickable && icon.longClickable()) {
            longClicked = icon.longClick();
        } else {
            var parent = icon.parent();
            for (var i = 0; i < 5 && parent; i++) {
                if (parent.longClickable && parent.longClickable()) {
                    longClicked = parent.longClick();
                    break;
                }
                parent = parent.parent();
            }
        }
    } catch (e) {
        log("节点长按异常: " + e.message);
    }

    if (!longClicked) {
        try {
            showRedDot(x, y);
            press(x, y, 800);
            longClicked = true;
        } catch (e) {
            log("坐标长按异常: " + e.message);
        }
    }

    if (!longClicked) {
        log("策略B失败: 长按图标未触发快捷菜单");
        return false;
    }

    sleep(800);

    var shortcut = text(shortcutText).findOne(3000);
    if (!shortcut) {
        log("策略B失败: 未找到快捷菜单 " + shortcutText);
        return false;
    }

    var sb = shortcut.bounds();
    clickTwiceAt(sb.centerX(), sb.centerY(), "策略B-快捷菜单打卡");
    log("策略B执行完毕");
    return true;
}

function clickTwiceAt(x, y, strategyName) {
    log("使用策略: " + strategyName);
    log("点击坐标: (" + x + ", " + y + ")");
    showFloaty(strategyName);

    showRedDot(x, y);
    click(x, y);
    log("第1击完成");
    sleep(300);

    showRedDot(x, y);
    click(x, y);
    log("第2击完成");
}

// ================= v5.2B 核心：轮询检测结果（无截图） =================
function waitForResult() {
    var checkCount = 0;

    while (checkCount < CHECK_CONFIG.TIMEOUT_SEC) {
        // --- 检测失败弹窗（优先级高） ---
        if (text(CHECK_CONFIG.TEXT_FAIL_TITLE).exists()) {
            log("检测到失败弹窗");

            // 尝试读取失败原因
            var reasonNode = textContains("范围").findOnce()
                          || textContains("无效").findOnce()
                          || textContains("定位").findOnce()
                          || textContains("异常").findOnce();
            var failReason = reasonNode ? reasonNode.text() : "未知原因";

            return { status: "fail", message: failReason };
        }

        // --- 检测成功标志 ---
        if (textContains(CHECK_CONFIG.TEXT_SUCCESS_MARK).exists()) {
            log("检测到成功标志");
            return { status: "success", message: "检测到打卡成功" };
        }

        // --- 检测已打卡状态 ---
        if (textContains("已打卡").exists() || textContains("更新打卡").exists()) {
            log("检测到已打卡状态");
            return { status: "success", message: "检测到已打卡状态" };
        }

        sleep(1000);
        checkCount++;
        log("等待结果... " + checkCount + "s");
    }

    return { status: "timeout", message: "检测超时，界面未发生预期变化" };
}

// ================= v5.2B 核心：处理失败弹窗 =================
function handleFailDialog() {
    log("尝试关闭失败弹窗...");

    var confirmBtn = text(CHECK_CONFIG.TEXT_FAIL_CONFIRM).findOne(2000);
    if (confirmBtn) {
        var b = confirmBtn.bounds();
        press(b.centerX(), b.centerY(), 200);
        log("已点击[确定]关闭失败弹窗");
    } else {
        log("未找到关闭弹窗的按钮");
    }
}

// ================= DPI 自适应 =================
function dp2px(dp) {
    var density = context.getResources().getDisplayMetrics().density;
    return Math.floor(dp * density + 0.5);
}

// ================= 配置加载 =================
function loadConfig() {
    try {
        var launcherArgs = engines.myEngine().execArgv;
        if (launcherArgs && launcherArgs.arguments && launcherArgs.arguments.config) {
            log("使用 Launcher 传递的配置");
            return launcherArgs.arguments.config;
        }
    } catch (e) {
        log("无法读取 Launcher 参数: " + e.message);
    }

    log("从存储中读取配置");
    var storage = storages.create("clockmaster_config");

    return {
        targetAppName: storage.get("targetAppPackage", "目标应用"),
        maxDelay: parseInt(storage.get("maxRandomDelay", "0")),
        pushplusToken: storage.get("pushplusToken", ""),
        debugMode: storage.get("debugMode", false)
    };
}

// ================= 历史记录 =================
function saveHistory(success, duration, errorMsg, screenshotPath) {
    var storage = storages.create("clockmaster_config");
    var history = storage.get("clockmaster_history", []);

    if (!Array.isArray(history)) {
        history = [];
    }

    var record = {
        id: executionId,
        timestamp: startTime,
        date: new Date(startTime).toLocaleDateString(),
        time: new Date(startTime).toLocaleTimeString(),
        success: success,
        duration: duration,
        errorMsg: errorMsg,
        source: "auto",
        scriptVersion: SCRIPT_VERSION,
        screenshotPath: screenshotPath
    };

    history.unshift(record);

    if (history.length > 50) {
        history = history.slice(0, 50);
    }

    storage.put("clockmaster_history", history);
    log("历史记录已保存");
}

// ================= PushPlus 推送 =================
function sendSuccessPush(token, duration) {
    log("发送成功推送...");

    var durationText = formatDuration(duration);
    var timeText = new Date().toLocaleString();

    var content = "<h2 style='color:#4CAF50;'>打卡成功</h2>";
    content += "<p><strong>执行时间:</strong> " + timeText + "</p>";
    content += "<p><strong>耗时:</strong> " + durationText + "</p>";
    content += "<p><strong>脚本版本:</strong> " + SCRIPT_VERSION + "</p>";
    content += "<hr>";
    content += "<p style='color:#999;font-size:12px;'>ClockMaster 自动打卡助手</p>";

    sendPushPlus(token, "ClockMaster - 打卡成功", content);
}

function sendFailurePush(token, errorMsg, screenshotPath) {
    log("发送失败推送...");

    var timeText = new Date().toLocaleString();

    var content = "<h2 style='color:#F44336;'>打卡失败</h2>";
    content += "<p><strong>执行时间:</strong> " + timeText + "</p>";
    content += "<p><strong>错误信息:</strong> " + errorMsg + "</p>";
    content += "<p><strong>脚本版本:</strong> " + SCRIPT_VERSION + "</p>";
    content += "<hr>";
    content += "<p style='color:#999;font-size:12px;'>ClockMaster 自动打卡助手</p>";
    content += "<p style='color:#ff9800;'>请检查日志排查问题</p>";

    sendPushPlus(token, "ClockMaster - 打卡失败", content);
}

function sendPushPlus(token, title, content) {
    try {
        var response = http.post("http://www.pushplus.plus/send", {
            token: token,
            title: title,
            content: content,
            template: "html"
        }, {
            headers: {
                "Content-Type": "application/json"
            },
            timeout: 10000
        });

        if (response.statusCode === 200) {
            var result = response.body.json();
            if (result.code === 200) {
                log("推送成功: " + result.msg);
            } else {
                log("推送失败: " + result.msg);
            }
        } else {
            log("推送请求失败: HTTP " + response.statusCode);
        }
    } catch (e) {
        log("推送异常: " + e.message);
    }
}

// ================= 工具函数 =================

function showRedDot(x, y) {
    if (debugDot) {
        try { debugDot.close(); } catch(e) {}
    }

    try {
        debugDot = floaty.rawWindow(
            <frame w="24" h="24" bg="#ff0000" alpha="0.9"/>
        );
        debugDot.setPosition(x - 12, y - 12);

        setTimeout(function() {
            if (debugDot) {
                try { debugDot.close(); } catch(e) {}
            }
        }, 600);
    } catch (e) {
        log("红点显示失败: " + e.message);
    }
}

function showFloaty(text) {
    if (!floatyWindow) {
        try {
            floatyWindow = floaty.rawWindow(
                <card cardCornerRadius="8dp" alpha="0.85" bg="#222222">
                    <text id="content" text="" padding="12" textSize="14sp" textColor="#00ff00" textStyle="bold"/>
                </card>
            );
            floatyWindow.setPosition(50, 200);
        } catch (e) {
            log("悬浮窗创建失败: " + e.message);
            return;
        }
    }

    try {
        ui.run(function() {
            floatyWindow.content.setText(text);
        });
    } catch (e) {
        log("悬浮窗更新失败: " + e.message);
    }
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatDuration(ms) {
    var seconds = Math.floor(ms / 1000);
    var minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;

    if (minutes > 0) {
        return minutes + " 分 " + seconds + " 秒";
    }
    return seconds + " 秒";
}
