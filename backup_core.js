/**
 * Project ClockMaster - Core Task (v3.0 完整版)
 * 特性：推送通知、历史记录、异常处理、红点调试
 * @version 3.0.2
 */

var floatyWindow = null;
var debugDot = null;
var startTime = Date.now();
var executionId = "exec_" + startTime;

// ================= 主函数 =================
(function main() {
    var success = false;
    var errorMsg = null;
    var screenshotPath = null;

    try {
        // 1. 初始化配置
        showFloaty("🚀 v3.0 启动中...");
        var config = loadConfig();

        // 配置诊断
        log("========== 配置诊断 ==========");
        log("targetAppName: " + (config.targetAppName || "UNDEFINED"));
        log("maxDelay: " + (config.maxDelay || "UNDEFINED"));
        log("pushplusToken: " + (config.pushplusToken ? "已设置 (长度: " + config.pushplusToken.length + ")" : "未设置"));
        log("debugMode: " + config.debugMode);
        log("==============================");

        if (!config.targetAppName) {
            throw new Error("致命错误：targetAppName 未配置！请检查配置是否正确保存。");
        }

        log("========== ClockMaster v3.0 开始执行 ==========");
        log("执行ID: " + executionId);
        log("目标应用: " + config.targetAppName);
        log("最大延迟: " + config.maxDelay + " 分钟");
        log("PushPlus: " + (config.pushplusToken ? "已配置" : "未配置"));

        // 2. 随机延迟（防风控）
        if (config.maxDelay > 0) {
            var delayMinutes = randomInt(0, config.maxDelay);
            if (delayMinutes > 0) {
                showFloaty("⏰ 随机延迟 " + delayMinutes + " 分钟");
                log("随机延迟: " + delayMinutes + " 分钟");

                // 倒计时显示
                for (var i = delayMinutes * 60; i > 0; i--) {
                    var mins = Math.floor(i / 60);
                    var secs = i % 60;
                    showFloaty("⏰ 等待中 " + mins + ":" + (secs < 10 ? "0" : "") + secs);
                    sleep(1000);
                }
            }
        }

        // 3. 启动目标应用
        showFloaty("📱 启动应用...");
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

        // 4. 等待应用加载
        showFloaty("👀 等待首页加载...");
        var pkg = getPackageName(config.targetAppName);
        if (pkg) {
            waitForPackage(pkg, 15000);
        }

        var loaded = textMatches(/移动考勤|工作台/).findOne(12000);
        if (!loaded) {
            throw new Error("首页加载超时，未找到关键元素");
        }

        log("首页加载成功");
        sleep(2000);

        // 5. 进入打卡页面
        showFloaty("🔍 查找 [移动考勤] 入口");
        log("正在查找移动考勤入口...");

        var entry = text("移动考勤").findOne(5000);
        if (!entry) {
            throw new Error("未找到 [移动考勤] 入口");
        }

        log("找到入口，准备点击");
        clickWithRedDot(entry);
        sleep(3000);

        // 6. 等待定位加载（关键步骤）
        showFloaty("📍 等待定位服务...");
        log("等待定位加载 (8秒)");
        sleep(8000); // 必须等绿球出来

        // 7. 执行打卡（三连击策略）
        showFloaty("🎯 开始打卡...");
        log("========== 开始执行三连击策略 ==========");

        var targetWidget = text("打卡").findOne(4000);

        if (targetWidget) {
            var b = targetWidget.bounds();
            var centerX = b.centerX();
            var centerY = b.centerY();

            log("找到打卡控件: (" + centerX + ", " + centerY + ")");

            // 第 1 击: 文字中心
            showFloaty("💥 第1击: 文字中心");
            log("第1击: 文字中心 (" + centerX + ", " + centerY + ")");
            showRedDot(centerX, centerY);
            press(centerX, centerY, 350);
            sleep(1000);

            // 第 2 击: 向下偏移
            showFloaty("💥 第2击: 向下偏移");
            var offsetY = centerY + 150;
            log("第2击: 向下偏移 (" + centerX + ", " + offsetY + ")");
            showRedDot(centerX, offsetY);
            press(centerX, offsetY, 350);
            sleep(1000);
        } else {
            log("警告: 未找到打卡文字控件");
            showFloaty("⚠️ 文字丢失，执行盲狙");
        }

        // 第 3 击: 屏幕绝对位置（兜底）
        showFloaty("💥 第3击: 屏幕黄金点");
        var absX = device.width / 2;
        var absY = device.height * 0.55;
        log("第3击: 屏幕黄金点 (" + absX + ", " + absY + ")");
        showRedDot(absX, absY);
        press(absX, absY, 400);

        log("========== 三连击执行完毕 ==========");

        // 8. 等待结果
        sleep(3000);
        showFloaty("📸 正在截图...");
        screenshotPath = captureSnapshot("Success_v3.0");

        if (screenshotPath) {
            log("成功截图: " + screenshotPath);
        }

        // 9. 标记成功
        success = true;
        showFloaty("✅ 打卡完成！");
        log("========== 执行成功 ==========");

    } catch (e) {
        // 异常处理
        success = false;
        errorMsg = e.message || String(e);

        console.error("执行失败: " + errorMsg);
        console.error(e.stack || e);

        showFloaty("❌ 错误: " + errorMsg);
        log("========== 执行失败 ==========");
        log("错误信息: " + errorMsg);

        // 错误截图
        try {
            screenshotPath = captureSnapshot("Error_v3.0");
            if (screenshotPath) {
                log("错误截图: " + screenshotPath);
            }
        } catch (screenshotErr) {
            log("截图失败: " + screenshotErr.message);
        }
    } finally {
        // 10. 计算执行时间
        var endTime = Date.now();
        var duration = endTime - startTime;
        log("执行耗时: " + formatDuration(duration));

        // 11. 记录历史
        try {
            saveHistory(success, duration, errorMsg, screenshotPath);
        } catch (historyErr) {
            log("保存历史失败: " + historyErr.message);
        }

        // 12. 发送推送
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

        // 13. 清理资源
        sleep(3000);
        if (floatyWindow) {
            try { floatyWindow.close(); } catch(e) {}
        }
        if (debugDot) {
            try { debugDot.close(); } catch(e) {}
        }

        log("========== ClockMaster 执行结束 ==========");
        exit();
    }
})();

// ================= 配置加载 =================
function loadConfig() {
    // Try to get config from launcher arguments first
    try {
        var launcherArgs = engines.myEngine().execArgv;
        if (launcherArgs && launcherArgs.arguments && launcherArgs.arguments.config) {
            log("✅ 使用 Launcher 传递的配置");
            return launcherArgs.arguments.config;
        }
    } catch (e) {
        log("⚠️ 无法读取 Launcher 参数，使用存储配置: " + e.message);
    }

    // Fallback to storage
    log("📂 从存储中读取配置");
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
        scriptVersion: "3.0.0",
        screenshotPath: screenshotPath
    };

    history.unshift(record);

    // 限制最多50条记录
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

    var content = "<h2 style='color:#4CAF50;'>✓ 打卡成功</h2>";
    content += "<p><strong>执行时间:</strong> " + timeText + "</p>";
    content += "<p><strong>耗时:</strong> " + durationText + "</p>";
    content += "<p><strong>脚本版本:</strong> 3.0.0</p>";
    content += "<hr>";
    content += "<p style='color:#999;font-size:12px;'>ClockMaster 自动打卡助手</p>";

    sendPushPlus(token, "✓ ClockMaster - 打卡成功", content);
}

function sendFailurePush(token, errorMsg, screenshotPath) {
    log("发送失败推送...");

    var timeText = new Date().toLocaleString();

    var content = "<h2 style='color:#F44336;'>✗ 打卡失败</h2>";
    content += "<p><strong>执行时间:</strong> " + timeText + "</p>";
    content += "<p><strong>错误信息:</strong> " + errorMsg + "</p>";
    content += "<p><strong>脚本版本:</strong> 3.0.0</p>";

    if (screenshotPath) {
        content += "<p><strong>截图:</strong> " + screenshotPath + "</p>";
    }

    content += "<hr>";
    content += "<p style='color:#999;font-size:12px;'>ClockMaster 自动打卡助手</p>";
    content += "<p style='color:#ff9800;'>请检查日志或截图排查问题</p>";

    sendPushPlus(token, "✗ ClockMaster - 打卡失败", content);
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

// 在点击位置显示红点
function showRedDot(x, y) {
    if (debugDot) {
        try { debugDot.close(); } catch(e) {}
    }

    debugDot = floaty.rawWindow(
        <frame w="30px" h="30px">
            <img w="20px" h="20px" src="file:///android_asset/modules/autojs.png" tint="#ff0000" radius="10dp" bg="#ff0000"/>
        </frame>
    );

    debugDot.setPosition(x - 15, y - 15);

    setTimeout(function() {
        if (debugDot) {
            try { debugDot.close(); } catch(e) {}
        }
    }, 800);
}

// 带红点的点击
function clickWithRedDot(widget) {
    if (!widget) return;
    var b = widget.bounds();
    var x = b.centerX();
    var y = b.centerY();
    log("点击控件: (" + x + ", " + y + ")");
    showRedDot(x, y);
    press(x, y, 100);
}

// 显示悬浮窗消息
function showFloaty(text) {
    if (!floatyWindow) {
        floatyWindow = floaty.rawWindow(
            <card cardCornerRadius="8dp" alpha="0.8" bg="#222222">
                <text id="content" text="" padding="15" textSize="16sp" textColor="#00ff00" textStyle="bold"/>
            </card>
        );
        floatyWindow.setPosition(50, 200);
    }
    ui.run(function() {
        floatyWindow.content.setText(text);
    });
}

// 截图功能
function captureSnapshot(tag) {
    try {
        if (!requestScreenCapture(false)) {
            log("截图权限请求失败");
            return null;
        }

        var timestamp = new Date().getTime();
        var fileName = "ClockMaster_" + tag + "_" + timestamp + ".png";
        var path = "/sdcard/Pictures/" + fileName;

        // 确保目录存在
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

// 生成随机整数
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 格式化持续时间
function formatDuration(ms) {
    var seconds = Math.floor(ms / 1000);
    var minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;

    if (minutes > 0) {
        return minutes + " 分 " + seconds + " 秒";
    }
    return seconds + " 秒";
}
