/**
 * Project ClockMaster - Core Task (v5.2 重构版)
 * 特性：纯UI控件定位、无截图权限、自动处理失败弹窗
 * @version 5.2.0
 */

var floatyWindow = null;
var debugDot = null;
var startTime = Date.now();
var executionId = "exec_" + startTime;
var SCRIPT_VERSION = "5.2.0";

// 检测配置
var CHECK_CONFIG = {
    TIMEOUT_SEC: 10,
    SUCCESS_KEYWORDS: ["打卡成功", "已打卡", "更新打卡"],
    FAIL_TITLE: "打卡失败",
    FAIL_REASONS: ["范围", "无效", "定位", "异常"],
    CONFIRM_BTN: "确定"
};

// ================= 主函数 =================
(function main() {
    var success = false;
    var errorMsg = null;

    try {
        showFloaty("v5.2 启动中...");
        var config = loadConfig();

        // 配置诊断
        log("========== 配置诊断 ==========");
        log("targetAppName: " + (config.targetAppName || "UNDEFINED"));
        log("maxDelay: " + (config.maxDelay || 0));
        log("pushplusToken: " + (config.pushplusToken ? "已设置" : "未设置"));
        log("==============================");

        if (!config.targetAppName) {
            throw new Error("致命错误：targetAppName 未配置！");
        }

        log("========== ClockMaster v5.2 开始执行 ==========");
        log("目标应用: " + config.targetAppName);
        log("屏幕尺寸: " + device.width + "x" + device.height);

        // 权限检查（无需截图权限）
        auto.waitFor();
        device.keepScreenOn(300000);

        // 随机延迟
        if (config.maxDelay > 0) {
            var delayMinutes = randomInt(0, config.maxDelay);
            if (delayMinutes > 0) {
                showFloaty("随机延迟 " + delayMinutes + " 分钟");
                log("随机延迟: " + delayMinutes + " 分钟");
                for (var i = delayMinutes * 60; i > 0; i--) {
                    var mins = Math.floor(i / 60);
                    var secs = i % 60;
                    showFloaty("等待 " + mins + ":" + (secs < 10 ? "0" : "") + secs);
                    sleep(1000);
                }
            }
        }

        // 启动应用
        showFloaty("启动应用...");
        log("正在启动: " + config.targetAppName);
        home();
        sleep(1000);

        if (!launchApp(config.targetAppName)) {
            var pkg = getPackageName(config.targetAppName);
            if (pkg) {
                launch(pkg);
            } else {
                throw new Error("无法启动应用");
            }
        }

        // 等待加载
        showFloaty("等待加载...");
        var pkg = getPackageName(config.targetAppName);
        if (pkg) waitForPackage(pkg, 15000);
        sleep(5000);

        // 进入打卡页面
        showFloaty("查找考勤入口...");
        enterAttendancePage();
        sleep(5000);

        // 等待定位
        showFloaty("等待定位...");
        log("等待定位加载 (8秒)");
        sleep(8000);

        // ========== 核心：执行打卡点击 ==========
        showFloaty("执行打卡...");
        log("========== 执行打卡点击 ==========");
        clickClockIn();

        // ========== 核心：轮询检测结果 ==========
        showFloaty("检测结果...");
        log("========== 轮询检测结果 ==========");
        var result = waitForResult();

        // 处理结果
        if (result.status === "success") {
            success = true;
            showFloaty("打卡成功!");
            log("结果: 成功 - " + result.message);
        } else if (result.status === "fail") {
            success = false;
            errorMsg = result.message;
            showFloaty("失败: " + errorMsg);
            log("结果: 失败 - " + errorMsg);

            // 自动关闭失败弹窗
            handleFailDialog();
        } else {
            success = false;
            errorMsg = "检测超时";
            showFloaty("超时未知");
            log("结果: 超时");
        }

    } catch (e) {
        success = false;
        errorMsg = e.message || String(e);
        console.error("异常: " + errorMsg);
        showFloaty("错误: " + errorMsg);
        log("异常: " + errorMsg);
    } finally {
        var duration = Date.now() - startTime;
        log("耗时: " + formatDuration(duration));

        // 保存历史
        try {
            saveHistory(success, duration, errorMsg);
        } catch (e) {
            log("保存历史失败: " + e.message);
        }

        // 发送推送
        try {
            var config = loadConfig();
            if (config.pushplusToken) {
                if (success) {
                    sendSuccessPush(config.pushplusToken, duration);
                } else {
                    sendFailurePush(config.pushplusToken, errorMsg);
                }
            }
        } catch (e) {
            log("推送失败: " + e.message);
        }

        // 清理
        device.cancelKeepingAwake();
        sleep(2000);
        if (floatyWindow) try { floatyWindow.close(); } catch(e) {}
        if (debugDot) try { debugDot.close(); } catch(e) {}

        log("========== v5.2 执行结束 ==========");
        exit();
    }
})();

// ================= 进入考勤页面 =================
function enterAttendancePage() {
    var entry = textMatches(/移动考勤|打卡/).findOne(5000);
    if (!entry) {
        throw new Error("未找到考勤入口");
    }

    log("找到入口: " + entry.text());

    // 向上查找可点击父控件
    var target = entry;
    for (var i = 0; i < 5; i++) {
        if (target.clickable()) break;
        var p = target.parent();
        if (p) target = p; else break;
    }

    var b = target.bounds();
    var x = b.centerX();
    var y = b.centerY();
    log("点击入口: (" + x + ", " + y + ")");
    showRedDot(x, y);
    click(x, y);
}

// ================= 核心：执行打卡点击 =================
function clickClockIn() {
    var centerX = device.width / 2;
    var targetX = -1;
    var targetY = -1;
    var strategy = "";

    // ========== 策略1: 直接找"打卡"控件 ==========
    log("策略1: 查找 text='打卡' 控件...");
    var clockBtn = text("打卡").findOne(3000);
    if (clockBtn) {
        var b = clockBtn.bounds();
        targetX = b.centerX();
        targetY = b.centerY();
        strategy = "直接定位";
        log("策略1成功: 找到打卡控件 (" + targetX + ", " + targetY + ")");
    }

    // ========== 策略2: 锚点"快捷打卡"，点击其下方 ==========
    if (targetX === -1) {
        log("策略2: 查找锚点 text='快捷打卡'...");
        var anchor = text("快捷打卡").findOne(2000);
        if (anchor) {
            var ab = anchor.bounds();
            targetX = centerX;
            // 打卡按钮在"快捷打卡"文字下方，偏移屏幕高度的30%
            targetY = ab.bottom + (device.height * 0.30);
            strategy = "锚点定位";
            log("策略2成功: 锚点Y=" + ab.bottom + ", 目标Y=" + targetY);
        }
    }

    // ========== 策略3: 兜底扫射 ==========
    if (targetX === -1) {
        log("策略3: 兜底扫射...");
        strategy = "兜底扫射";

        var startY = device.height * 0.50;
        var endY = device.height * 0.75;
        var step = dp2px(50);

        for (var y = startY; y < endY; y += step) {
            showRedDot(centerX, y);
            click(centerX, y);
            log("扫射: (" + centerX + ", " + Math.floor(y) + ")");
            sleep(200);
        }
        return; // 扫射完直接返回
    }

    // ========== 执行点击 ==========
    log("使用策略: " + strategy);
    showFloaty(strategy);

    // 双击确保触发
    showRedDot(targetX, targetY);
    click(targetX, targetY);
    log("第1击: (" + targetX + ", " + targetY + ")");
    sleep(300);

    showRedDot(targetX, targetY);
    click(targetX, targetY);
    log("第2击: (" + targetX + ", " + targetY + ")");
}

// ================= 核心：轮询检测结果 =================
function waitForResult() {
    for (var i = 0; i < CHECK_CONFIG.TIMEOUT_SEC; i++) {

        // --- 优先检测失败弹窗 ---
        if (text(CHECK_CONFIG.FAIL_TITLE).exists()) {
            log("检测到: 打卡失败弹窗");

            // 读取失败原因
            var reason = "未知原因";
            for (var j = 0; j < CHECK_CONFIG.FAIL_REASONS.length; j++) {
                var keyword = CHECK_CONFIG.FAIL_REASONS[j];
                var node = textContains(keyword).findOnce();
                if (node) {
                    reason = node.text();
                    break;
                }
            }

            return { status: "fail", message: reason };
        }

        // --- 检测成功关键词 ---
        for (var k = 0; k < CHECK_CONFIG.SUCCESS_KEYWORDS.length; k++) {
            var keyword = CHECK_CONFIG.SUCCESS_KEYWORDS[k];
            if (textContains(keyword).exists()) {
                log("检测到: " + keyword);
                return { status: "success", message: keyword };
            }
        }

        sleep(1000);
        log("等待结果... " + (i + 1) + "s");
    }

    return { status: "timeout", message: "10秒超时" };
}

// ================= 核心：处理失败弹窗 =================
function handleFailDialog() {
    log("处理失败弹窗...");

    // 查找"确定"按钮
    var confirmBtn = text(CHECK_CONFIG.CONFIRM_BTN).findOne(2000);
    if (confirmBtn) {
        var b = confirmBtn.bounds();
        click(b.centerX(), b.centerY());
        log("已点击[确定]关闭弹窗");
        sleep(500);
    } else {
        log("未找到确定按钮");
    }
}

// ================= 工具函数 =================

function dp2px(dp) {
    return Math.floor(dp * context.getResources().getDisplayMetrics().density + 0.5);
}

function loadConfig() {
    try {
        var args = engines.myEngine().execArgv;
        if (args && args.arguments && args.arguments.config) {
            return args.arguments.config;
        }
    } catch (e) {}

    var storage = storages.create("clockmaster_config");
    return {
        targetAppName: storage.get("targetAppPackage", ""),
        maxDelay: parseInt(storage.get("maxRandomDelay", "0")),
        pushplusToken: storage.get("pushplusToken", ""),
        debugMode: storage.get("debugMode", false)
    };
}

function saveHistory(success, duration, errorMsg) {
    var storage = storages.create("clockmaster_config");
    var history = storage.get("clockmaster_history", []);
    if (!Array.isArray(history)) history = [];

    history.unshift({
        id: executionId,
        timestamp: startTime,
        date: new Date(startTime).toLocaleDateString(),
        time: new Date(startTime).toLocaleTimeString(),
        success: success,
        duration: duration,
        errorMsg: errorMsg,
        scriptVersion: SCRIPT_VERSION
    });

    if (history.length > 50) history = history.slice(0, 50);
    storage.put("clockmaster_history", history);
}

function sendSuccessPush(token, duration) {
    var content = "<h2 style='color:#4CAF50;'>打卡成功</h2>";
    content += "<p>时间: " + new Date().toLocaleString() + "</p>";
    content += "<p>耗时: " + formatDuration(duration) + "</p>";
    content += "<p>版本: " + SCRIPT_VERSION + "</p>";
    sendPushPlus(token, "ClockMaster - 打卡成功", content);
}

function sendFailurePush(token, errorMsg) {
    var content = "<h2 style='color:#F44336;'>打卡失败</h2>";
    content += "<p>时间: " + new Date().toLocaleString() + "</p>";
    content += "<p>原因: " + (errorMsg || "未知") + "</p>";
    content += "<p>版本: " + SCRIPT_VERSION + "</p>";
    sendPushPlus(token, "ClockMaster - 打卡失败", content);
}

function sendPushPlus(token, title, content) {
    try {
        var res = http.post("http://www.pushplus.plus/send", {
            token: token, title: title, content: content, template: "html"
        }, { headers: { "Content-Type": "application/json" }, timeout: 10000 });

        if (res.statusCode === 200) {
            var r = res.body.json();
            log("推送: " + (r.code === 200 ? "成功" : r.msg));
        }
    } catch (e) {
        log("推送异常: " + e.message);
    }
}

function showRedDot(x, y) {
    if (debugDot) try { debugDot.close(); } catch(e) {}
    try {
        debugDot = floaty.rawWindow(<frame w="20" h="20" bg="#ff0000" alpha="0.9"/>);
        debugDot.setPosition(x - 10, y - 10);
        setTimeout(function() { if (debugDot) try { debugDot.close(); } catch(e) {} }, 500);
    } catch (e) {}
}

function showFloaty(text) {
    if (!floatyWindow) {
        try {
            floatyWindow = floaty.rawWindow(
                <card cardCornerRadius="8dp" alpha="0.85" bg="#222">
                    <text id="content" padding="10" textSize="14sp" textColor="#0f0"/>
                </card>
            );
            floatyWindow.setPosition(50, 200);
        } catch (e) { return; }
    }
    try { ui.run(function() { floatyWindow.content.setText(text); }); } catch (e) {}
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatDuration(ms) {
    var s = Math.floor(ms / 1000);
    var m = Math.floor(s / 60);
    s = s % 60;
    return m > 0 ? m + "分" + s + "秒" : s + "秒";
}
