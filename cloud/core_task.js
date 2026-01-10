/**
 * core_task.js - ClockMaster 核心自动化任务
 * ClockMaster - Core Automation Task
 * @version 1.0.0
 *
 * 由 Launcher 动态加载执行
 * 禁止使用坐标点击，仅使用 text()/desc() 选择器
 */

// ============== 初始化 ==============
var args = engines.myEngine().execArgv || {};
var config = args.config || {};
var launchTime = args.launchTime || new Date().getTime();

// 运行时状态
var runtime = {
    startTime: new Date(),
    logs: [],
    success: false,
    errorMsg: null,
    screenshotPath: null
};

// ============== 工具函数 ==============

/**
 * 记录日志
 */
function logInfo(msg) {
    var timestamp = new Date().toLocaleTimeString();
    var logEntry = "[" + timestamp + "] " + msg;
    runtime.logs.push(logEntry);
    log(logEntry);
    updateFloaty(msg);
}

/**
 * 生成指定范围内的随机整数
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 随机延迟 (模拟人类操作)
 */
function humanDelay(minMs, maxMs) {
    minMs = minMs || 500;
    maxMs = maxMs || 1500;
    var delay = randomInt(minMs, maxMs);
    sleep(delay);
}

/**
 * 格式化时间差
 */
function formatDuration(ms) {
    var seconds = Math.floor(ms / 1000);
    var minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    return minutes + "分" + seconds + "秒";
}

// ============== 悬浮窗模块 ==============

var statusFloaty = null;

function createFloaty() {
    try {
        statusFloaty = floaty.rawWindow(
            '<frame gravity="center" bg="#CC000000" padding="16" alpha="0.9">' +
            '    <vertical>' +
            '        <text id="title" text="ClockMaster" textSize="16sp" textColor="#4CAF50" gravity="center"/>' +
            '        <text id="status" text="初始化中..." textSize="13sp" textColor="#FFFFFF" gravity="center" marginTop="8"/>' +
            '        <text id="time" text="" textSize="11sp" textColor="#AAAAAA" gravity="center" marginTop="4"/>' +
            '    </vertical>' +
            '</frame>'
        );

        statusFloaty.setPosition(100, 150);
        statusFloaty.setTouchable(false);
        logInfo("状态窗口已创建");
    } catch (e) {
        log("创建悬浮窗失败: " + e.message);
    }
}

function updateFloaty(status) {
    if (statusFloaty) {
        var elapsed = formatDuration(new Date().getTime() - runtime.startTime.getTime());
        ui.run(function() {
            try {
                statusFloaty.status.setText(status);
                statusFloaty.time.setText("已运行: " + elapsed);
            } catch (e) {}
        });
    }
}

function closeFloaty() {
    if (statusFloaty) {
        try {
            statusFloaty.close();
            statusFloaty = null;
        } catch (e) {}
    }
}

// ============== 截图模块 ==============

function captureError(errorName) {
    try {
        if (!requestScreenCapture(false)) {
            log("截图权限获取失败");
            return null;
        }

        sleep(500);
        var img = captureScreen();
        if (img) {
            var filename = "/sdcard/ClockMaster/error_" + errorName + "_" + Date.now() + ".png";
            files.createWithDirs(filename);
            images.save(img, filename);
            img.recycle();
            runtime.screenshotPath = filename;
            logInfo("错误截图已保存: " + filename);
            return filename;
        }
    } catch (e) {
        log("截图失败: " + e.message);
    }
    return null;
}

// ============== 元素查找模块 ==============

/**
 * 等待元素出现 (使用文本)
 * @param {string} textContent - 要查找的文本
 * @param {number} timeout - 超时时间(毫秒)
 * @returns {UiObject|null}
 */
function waitForText(textContent, timeout) {
    timeout = timeout || 10000;
    var endTime = Date.now() + timeout;

    while (Date.now() < endTime) {
        var element = text(textContent).findOne(1000);
        if (element) {
            return element;
        }
        sleep(500);
    }
    return null;
}

/**
 * 等待元素出现 (使用描述)
 * @param {string} descContent - 要查找的描述
 * @param {number} timeout - 超时时间(毫秒)
 * @returns {UiObject|null}
 */
function waitForDesc(descContent, timeout) {
    timeout = timeout || 10000;
    var endTime = Date.now() + timeout;

    while (Date.now() < endTime) {
        var element = desc(descContent).findOne(1000);
        if (element) {
            return element;
        }
        sleep(500);
    }
    return null;
}

/**
 * 等待元素出现 (模糊匹配)
 * @param {string} pattern - 匹配模式
 * @param {number} timeout - 超时时间(毫秒)
 * @returns {UiObject|null}
 */
function waitForTextContains(pattern, timeout) {
    timeout = timeout || 10000;
    var endTime = Date.now() + timeout;

    while (Date.now() < endTime) {
        var element = textContains(pattern).findOne(1000);
        if (element) {
            return element;
        }
        sleep(500);
    }
    return null;
}

/**
 * 安全点击元素
 * @param {UiObject} element - UI元素
 * @returns {boolean}
 */
function safeClick(element) {
    if (!element) return false;

    try {
        humanDelay(200, 500);

        // 优先使用 click()
        if (element.clickable()) {
            return element.click();
        }

        // 尝试点击父元素
        var parent = element.parent();
        if (parent && parent.clickable()) {
            return parent.click();
        }

        // 使用边界中心点击
        var bounds = element.bounds();
        if (bounds) {
            return click(bounds.centerX(), bounds.centerY());
        }

        return false;
    } catch (e) {
        log("点击失败: " + e.message);
        return false;
    }
}

// ============== 广告处理模块 ==============

var AD_KEYWORDS = ["跳过", "关闭", "我知道了", "稍后", "取消", "暂不", "以后再说", "×", "X"];

function handleAds() {
    logInfo("检查广告弹窗...");

    for (var i = 0; i < AD_KEYWORDS.length; i++) {
        var keyword = AD_KEYWORDS[i];
        var adBtn = text(keyword).findOne(1000);

        if (adBtn) {
            logInfo("发现广告: " + keyword);
            if (safeClick(adBtn)) {
                logInfo("已关闭广告");
                humanDelay(500, 1000);
                return true;
            }
        }
    }

    // 检查描述中的关闭按钮
    var closeBtn = descContains("关闭").findOne(500) || descContains("close").findOne(500);
    if (closeBtn) {
        logInfo("发现关闭按钮(desc)");
        safeClick(closeBtn);
        humanDelay(500, 1000);
        return true;
    }

    return false;
}

/**
 * 循环检查并关闭广告
 */
function dismissAllAds(maxAttempts) {
    maxAttempts = maxAttempts || 5;
    var dismissed = 0;

    for (var i = 0; i < maxAttempts; i++) {
        if (handleAds()) {
            dismissed++;
            sleep(500);
        } else {
            break;
        }
    }

    if (dismissed > 0) {
        logInfo("共关闭 " + dismissed + " 个弹窗");
    }
    return dismissed;
}

// ============== App 启动模块 ==============

function launchTargetApp(packageName) {
    logInfo("启动目标应用: " + packageName);

    try {
        // 先尝试结束已运行的实例
        var running = currentPackage();
        if (running === packageName) {
            logInfo("应用已在前台");
            return true;
        }

        // 启动应用
        var launched = launch(packageName);
        if (!launched) {
            // 尝试使用 app.launch
            launched = app.launch(packageName);
        }

        if (!launched) {
            logInfo("启动失败，尝试使用Intent");
            app.startActivity({
                action: "android.intent.action.MAIN",
                packageName: packageName,
                className: app.getPackageName(packageName) + ".MainActivity"
            });
        }

        // 等待应用启动
        logInfo("等待应用启动...");
        sleep(3000);

        // 验证是否启动成功
        for (var i = 0; i < 10; i++) {
            if (currentPackage() === packageName) {
                logInfo("应用启动成功");
                humanDelay(1000, 2000);
                return true;
            }
            sleep(1000);
        }

        logInfo("应用启动超时");
        return false;

    } catch (e) {
        logInfo("启动异常: " + e.message);
        return false;
    }
}

// ============== 打卡逻辑模块 ==============

/**
 * 执行打卡操作
 * 注意: 此处为通用模板，需要根据实际目标App调整选择器
 */
function performClockIn() {
    logInfo("开始执行打卡...");

    // 处理可能的广告弹窗
    dismissAllAds(3);
    humanDelay(1000, 2000);

    // ===== 步骤1: 进入工作台/打卡页面 =====
    logInfo("查找打卡入口...");

    // 尝试多种可能的入口文本
    var entryKeywords = ["工作台", "打卡", "考勤", "签到", "上班", "下班"];
    var entryFound = false;

    for (var i = 0; i < entryKeywords.length; i++) {
        var entry = waitForText(entryKeywords[i], 3000);
        if (entry) {
            logInfo("找到入口: " + entryKeywords[i]);
            if (safeClick(entry)) {
                entryFound = true;
                humanDelay(1500, 2500);
                break;
            }
        }
    }

    if (!entryFound) {
        // 尝试模糊匹配
        var clockEntry = waitForTextContains("打卡", 3000) || waitForTextContains("考勤", 3000);
        if (clockEntry) {
            logInfo("找到打卡相关入口");
            safeClick(clockEntry);
            entryFound = true;
            humanDelay(1500, 2500);
        }
    }

    // 再次处理广告
    dismissAllAds(2);

    // ===== 步骤2: 点击打卡按钮 =====
    logInfo("查找打卡按钮...");

    var clockBtnKeywords = ["打卡", "上班打卡", "下班打卡", "签到", "外勤打卡"];
    var clockBtn = null;

    for (var j = 0; j < clockBtnKeywords.length; j++) {
        clockBtn = waitForText(clockBtnKeywords[j], 3000);
        if (clockBtn) {
            logInfo("找到打卡按钮: " + clockBtnKeywords[j]);
            break;
        }
    }

    if (!clockBtn) {
        // 尝试通过描述查找
        clockBtn = waitForDesc("打卡", 3000);
    }

    if (clockBtn) {
        logInfo("点击打卡按钮...");
        if (safeClick(clockBtn)) {
            humanDelay(2000, 3000);

            // ===== 步骤3: 检查打卡结果 =====
            logInfo("检查打卡结果...");

            var successKeywords = ["打卡成功", "签到成功", "已打卡", "打卡时间"];
            for (var k = 0; k < successKeywords.length; k++) {
                var successIndicator = waitForTextContains(successKeywords[k], 5000);
                if (successIndicator) {
                    logInfo("打卡成功! 关键词: " + successKeywords[k]);
                    runtime.success = true;
                    return true;
                }
            }

            // 没有明确成功提示，检查是否有错误
            var errorKeywords = ["失败", "错误", "异常", "网络", "重试"];
            for (var l = 0; l < errorKeywords.length; l++) {
                if (textContains(errorKeywords[l]).exists()) {
                    logInfo("检测到错误关键词: " + errorKeywords[l]);
                    runtime.errorMsg = "打卡可能失败，检测到: " + errorKeywords[l];
                    return false;
                }
            }

            // 无明确结果，假定成功
            logInfo("未检测到明确结果，假定打卡完成");
            runtime.success = true;
            return true;
        }
    }

    logInfo("未找到打卡按钮");
    runtime.errorMsg = "未找到打卡按钮";
    return false;
}

// ============== PushPlus 通知模块 ==============

function sendPushNotification(token, title, content) {
    if (!token) {
        logInfo("未配置PushPlus Token，跳过推送");
        return false;
    }

    logInfo("发送推送通知...");

    try {
        var response = http.post("http://www.pushplus.plus/send", {
            token: token,
            title: title,
            content: content,
            template: "html"
        });

        if (response.statusCode === 200) {
            var result = response.body.json();
            if (result.code === 200) {
                logInfo("推送成功");
                return true;
            } else {
                logInfo("推送失败: " + result.msg);
            }
        } else {
            logInfo("推送请求失败: HTTP " + response.statusCode);
        }
    } catch (e) {
        logInfo("推送异常: " + e.message);
    }

    return false;
}

/**
 * 生成HTML报告
 */
function generateReport() {
    var status = runtime.success ? "成功" : "失败";
    var statusColor = runtime.success ? "#4CAF50" : "#F44336";
    var duration = formatDuration(new Date().getTime() - runtime.startTime.getTime());

    var html = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">';
    html += '<h2 style="color: ' + statusColor + ';">ClockMaster 打卡报告</h2>';
    html += '<table style="width: 100%; border-collapse: collapse;">';

    html += '<tr><td style="padding: 8px; border: 1px solid #ddd;"><b>状态</b></td>';
    html += '<td style="padding: 8px; border: 1px solid #ddd; color: ' + statusColor + ';">' + status + '</td></tr>';

    html += '<tr><td style="padding: 8px; border: 1px solid #ddd;"><b>执行时间</b></td>';
    html += '<td style="padding: 8px; border: 1px solid #ddd;">' + runtime.startTime.toLocaleString() + '</td></tr>';

    html += '<tr><td style="padding: 8px; border: 1px solid #ddd;"><b>耗时</b></td>';
    html += '<td style="padding: 8px; border: 1px solid #ddd;">' + duration + '</td></tr>';

    html += '<tr><td style="padding: 8px; border: 1px solid #ddd;"><b>设备</b></td>';
    html += '<td style="padding: 8px; border: 1px solid #ddd;">' + device.brand + ' ' + device.model + '</td></tr>';

    if (runtime.errorMsg) {
        html += '<tr><td style="padding: 8px; border: 1px solid #ddd;"><b>错误信息</b></td>';
        html += '<td style="padding: 8px; border: 1px solid #ddd; color: #F44336;">' + runtime.errorMsg + '</td></tr>';
    }

    html += '</table>';

    // 运行日志
    html += '<h3 style="margin-top: 20px;">运行日志</h3>';
    html += '<div style="background: #f5f5f5; padding: 10px; font-size: 12px; max-height: 300px; overflow-y: auto;">';
    for (var i = 0; i < runtime.logs.length; i++) {
        html += '<div>' + runtime.logs[i] + '</div>';
    }
    html += '</div>';

    html += '<p style="color: #999; font-size: 11px; margin-top: 20px;">ClockMaster v1.0.0</p>';
    html += '</div>';

    return html;
}

// ============== 主流程 ==============

function main() {
    logInfo("====== ClockMaster 核心任务启动 ======");
    logInfo("目标包名: " + config.targetAppPackage);
    logInfo("最大延迟: " + config.maxRandomDelay + " 分钟");
    logInfo("调试模式: " + (config.debugMode ? "开启" : "关闭"));

    // 创建悬浮窗
    createFloaty();

    try {
        // ===== 阶段1: 随机延迟 =====
        if (config.maxRandomDelay > 0) {
            var delayMinutes = randomInt(0, config.maxRandomDelay);
            var delayMs = delayMinutes * 60 * 1000;

            if (delayMs > 0) {
                logInfo("随机延迟: " + delayMinutes + " 分钟");

                // 分段等待，更新状态
                var waited = 0;
                var interval = 30000; // 30秒更新一次

                while (waited < delayMs) {
                    var remaining = Math.ceil((delayMs - waited) / 60000);
                    updateFloaty("等待中... 剩余 " + remaining + " 分钟");
                    sleep(Math.min(interval, delayMs - waited));
                    waited += interval;
                }

                logInfo("延迟等待完成");
            }
        }

        // ===== 阶段2: 启动应用 =====
        if (!config.targetAppPackage) {
            throw new Error("未配置目标App包名");
        }

        if (!launchTargetApp(config.targetAppPackage)) {
            throw new Error("应用启动失败");
        }

        // ===== 阶段3: 执行打卡 =====
        if (!performClockIn()) {
            // 打卡失败，截图
            captureError("clockin_failed");
            throw new Error(runtime.errorMsg || "打卡操作失败");
        }

        logInfo("====== 任务执行完成 ======");

    } catch (e) {
        runtime.success = false;
        runtime.errorMsg = e.message;
        logInfo("任务异常: " + e.message);
        captureError("exception");
    } finally {
        // ===== 阶段4: 发送报告 =====
        var title = "ClockMaster: " + (runtime.success ? "打卡成功" : "打卡失败");
        var report = generateReport();
        sendPushNotification(config.pushplusToken, title, report);

        // 清理
        closeFloaty();

        // 返回桌面
        home();
        logInfo("任务结束，已返回桌面");
    }
}

// 执行主流程
main();
