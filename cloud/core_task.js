/**
 * Project ClockMaster - Core Task (v5.0 终极完整版)
 * 特性：三策略Y轴定位、X轴绝对居中、DPI自适应、穿透点击
 * @version 5.0.0
 */

var floatyWindow = null;
var debugDot = null;
var startTime = Date.now();
var executionId = "exec_" + startTime;
var SCRIPT_VERSION = "5.0.0";

// ================= 主函数 =================
(function main() {
    var success = false;
    var errorMsg = null;
    var screenshotPath = null;

    try {
        // 1. 初始化配置
        showFloaty("v5.0 启动中...");
        var config = loadConfig();

        // 配置诊断
        log("========== 配置诊断 ==========");
        log("targetAppName: " + (config.targetAppName || "UNDEFINED"));
        log("maxDelay: " + (config.maxDelay || "UNDEFINED"));
        log("pushplusToken: " + (config.pushplusToken ? "已设置 (长度: " + config.pushplusToken.length + ")" : "未设置"));
        log("debugMode: " + config.debugMode);
        log("==============================");

        if (!config.targetAppName) {
            throw new Error("致命错误：targetAppName 未配置！");
        }

        log("========== ClockMaster v5.0 开始执行 ==========");
        log("执行ID: " + executionId);
        log("目标应用: " + config.targetAppName);
        log("屏幕尺寸: " + device.width + "x" + device.height);
        log("屏幕密度: " + context.getResources().getDisplayMetrics().density);

        // 2. 权限检查
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

        // 4. 启动目标应用
        showFloaty("启动应用...");
        log("正在启动应用: " + config.targetAppName);

        home();
        sleep(1000);

        if (!launchApp(config.targetAppName)) {
            var pkg = getPackageName(config.targetAppName);
            if (pkg) {
                log("通过包名启动: " + pkg);
                launch(pkg);
            } else {
                throw new Error("无法启动应用: " + config.targetAppName);
            }
        }

        // 5. 等待应用加载
        showFloaty("等待首页加载...");
        var pkg = getPackageName(config.targetAppName);
        if (pkg) {
            waitForPackage(pkg, 15000);
        }
        sleep(5000);

        // 6. 进入打卡页面
        showFloaty("查找考勤入口...");
        log("正在查找考勤入口...");
        findAndEnterAttendance();
        sleep(5000);

        // 7. 等待定位加载
        showFloaty("等待定位服务...");
        log("等待定位加载 (8秒)");
        sleep(8000);

        // 8. 请求截图权限
        requestScreenCapture(false);
        sleep(500);

        // 9. 执行打卡（v5.0 三策略）
        showFloaty("开始打卡...");
        log("========== 执行v5.0三策略定位 ==========");
        performClockInAction();
        log("========== 打卡执行完毕 ==========");

        // 10. 等待结果
        sleep(3000);
        showFloaty("正在截图...");
        screenshotPath = captureSnapshot("Success_v5.0");

        if (screenshotPath) {
            log("成功截图: " + screenshotPath);
        }

        // 11. 标记成功
        success = true;
        showFloaty("打卡完成！");
        log("========== 执行成功 ==========");

    } catch (e) {
        success = false;
        errorMsg = e.message || String(e);

        console.error("执行失败: " + errorMsg);
        console.error(e.stack || e);

        showFloaty("错误: " + errorMsg);
        log("========== 执行失败 ==========");
        log("错误信息: " + errorMsg);

        try {
            screenshotPath = captureSnapshot("Error_v5.0");
            if (screenshotPath) {
                log("错误截图: " + screenshotPath);
            }
        } catch (screenshotErr) {
            log("截图失败: " + screenshotErr.message);
        }
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

        log("========== ClockMaster v5.0 执行结束 ==========");
        exit();
    }
})();

// ================= v5.0 核心：考勤入口查找 =================
function findAndEnterAttendance() {
    var entry = textMatches(/移动考勤|打卡/).findOne(5000);
    if (entry) {
        log("找到考勤入口: " + entry.text());

        // 向上查找可点击的父控件
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

        // 使用穿透点击
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

// ================= v5.0 核心：三策略打卡定位 =================
function performClockInAction() {
    var targetX = -1;
    var targetY = -1;
    var strategy = "未知";

    // X轴永远居中
    var centerX = device.width / 2;

    // ========== 策略A: 锚点定位 ==========
    log("尝试策略A: 锚点定位...");
    var anchor = text("快捷打卡").findOne(2000);
    if (anchor) {
        targetX = centerX;
        targetY = anchor.bounds().bottom + (device.height * 0.30);
        strategy = "A-锚点定位";
        log("策略A成功: 锚点Y=" + anchor.bounds().bottom + ", 目标Y=" + targetY);
    }

    // ========== 策略B: 颜色定位 ==========
    if (targetX === -1) {
        log("尝试策略B: 颜色定位...");
        try {
            var img = captureScreen();
            if (img) {
                // 扫描区域：屏幕中下部
                var regionX = Math.floor(device.width * 0.3);
                var regionY = Math.floor(device.height * 0.4);
                var regionW = Math.floor(device.width * 0.4);
                var regionH = Math.floor(device.height * 0.4);

                var p = findColor(img, "#2abf68", {
                    region: [regionX, regionY, regionW, regionH],
                    threshold: 40
                });

                if (p) {
                    targetX = centerX;
                    targetY = p.y;
                    strategy = "B-颜色定位";
                    log("策略B成功: 找到绿色点 (" + p.x + ", " + p.y + ")");
                } else {
                    log("策略B: 未找到目标颜色");
                }
                img.recycle();
            }
        } catch (e) {
            log("策略B异常: " + e.message);
        }
    }

    // ========== 执行点击 ==========
    if (targetX > 0 && targetY > 0) {
        log("使用" + strategy + ": (" + targetX + ", " + targetY + ")");
        showFloaty(strategy);

        // 双击确保
        showRedDot(targetX, targetY);
        press(targetX, targetY, 400);
        log("第1击完成");
        sleep(300);

        showRedDot(targetX, targetY);
        press(targetX, targetY, 400);
        log("第2击完成");
    } else {
        // ========== 策略C: 加特林扫射兜底 ==========
        log("策略A/B失败，执行策略C: 加特林扫射");
        showFloaty("C-扫射兜底");
        strategy = "C-加特林扫射";

        var startY = device.height * 0.50;
        var endY = device.height * 0.75;
        var step = dp2px(60);

        log("扫射范围: Y=" + startY + " 到 " + endY + ", 步长=" + step);

        var clickCount = 0;
        for (var y = startY; y < endY; y += step) {
            var clickX = centerX;
            var clickY = Math.floor(y);

            showRedDot(clickX, clickY);
            press(clickX, clickY, 200);
            clickCount++;
            log("扫射点 #" + clickCount + ": (" + clickX + ", " + clickY + ")");
            sleep(150);
        }

        log("加特林扫射完成，共" + clickCount + "击");
    }

    log("打卡策略执行完毕: " + strategy);
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

    if (screenshotPath) {
        content += "<p><strong>截图:</strong> " + screenshotPath + "</p>";
    }

    content += "<hr>";
    content += "<p style='color:#999;font-size:12px;'>ClockMaster 自动打卡助手</p>";
    content += "<p style='color:#ff9800;'>请检查日志或截图排查问题</p>";

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

function captureSnapshot(tag) {
    try {
        var timestamp = new Date().getTime();
        var fileName = "ClockMaster_" + tag + "_" + timestamp + ".png";
        var path = "/sdcard/Pictures/" + fileName;

        var dir = "/sdcard/Pictures/";
        if (!files.exists(dir)) {
            files.createWithDirs(dir);
        }

        captureScreen(path);
        log("截图保存: " + path);
        return path;
    } catch(e) {
        log("截图失败: " + e.message);
        return null;
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
