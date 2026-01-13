/**
 * auto_clock.js - 自动打卡触发脚本
 * ClockMaster - Auto Clock Trigger Script
 *
 * 用途:
 * 1. Tasker/MacroDroid 定时触发
 * 2. 快捷方式直接执行
 * 3. 命令行调用
 *
 * 使用方法:
 * - Tasker: 脚本 → 运行脚本 → 选择此文件
 * - MacroDroid: 动作 → AutoX.js → 运行脚本 → 选择此文件
 * - 命令行: am start -n org.autojs.autoxjs.v6/.external.open.RunScriptActivity -d "file:///sdcard/脚本/ClockMaster/auto_clock.js"
 */

// 加载模块
var Storage = require("./app/modules/storage.js");
var Launcher = require("./app/modules/launcher.js");
var History = require("./app/modules/history.js");
var PushPlus = require("./app/modules/pushplus.js");

log("========== ClockMaster 自动打卡 ==========");
log("触发时间: " + new Date().toLocaleString());

// 主函数
function main() {
    try {
        // 唤醒设备
        device.wakeUpIfNeeded();
        sleep(1000);

        // 验证配置
        var validation = Storage.validate();
        if (!validation.valid) {
            log("配置不完整: " + validation.missing.join(", "));
            toast("配置不完整，请先完成配置");
            return false;
        }

        // 获取配置
        var config = Storage.getAll();
        log("目标应用: " + config.targetAppPackage);
        log("云端脚本: " + config.cloudScriptUrl);

        // 添加随机延迟 (防止被检测)
        var maxDelay = config.maxRandomDelay || 5;
        if (maxDelay > 0) {
            var delayMinutes = Math.floor(Math.random() * maxDelay);
            var delayMs = delayMinutes * 60 * 1000;

            if (delayMs > 0) {
                log("随机延迟: " + delayMinutes + " 分钟");
                toast("将在 " + delayMinutes + " 分钟后执行打卡");
                sleep(delayMs);
            }
        }

        // 执行打卡
        log("开始执行打卡任务...");
        var success = Launcher.launch();

        if (success) {
            log("打卡任务执行成功");

            // 发送成功通知
            if (config.pushplusToken) {
                PushPlus.send("打卡成功", "ClockMaster 自动打卡已完成\n时间: " + new Date().toLocaleString());
            }
        } else {
            log("打卡任务执行失败");

            // 发送失败通知
            if (config.pushplusToken) {
                PushPlus.send("打卡失败", "ClockMaster 自动打卡执行失败\n时间: " + new Date().toLocaleString() + "\n请检查配置或手动打卡");
            }
        }

        return success;
    } catch (e) {
        log("自动打卡出错: " + e.message);

        // 发送错误通知
        try {
            var config = Storage.getAll();
            if (config.pushplusToken) {
                PushPlus.send("打卡异常", "ClockMaster 自动打卡出现异常\n错误: " + e.message + "\n时间: " + new Date().toLocaleString());
            }
        } catch (e2) {
            // 忽略推送错误
        }

        return false;
    }
}

// 执行
var result = main();
log("执行结果: " + (result ? "成功" : "失败"));
log("========== 自动打卡结束 ==========");
