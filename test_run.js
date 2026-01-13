/**
 * ClockMaster 直接执行脚本（跳过配置检查）
 * 用于测试核心打卡功能
 */

console.log("========================================");
console.log("🚀 ClockMaster 测试执行");
console.log("========================================");

// 检查权限
if (!auto.service) {
    alert("错误", "无障碍服务未开启！\n请先开启无障碍服务。");
    exit();
}

if (!floaty.checkPermission()) {
    alert("错误", "悬浮窗权限未授予！\n请先允许悬浮窗权限。");
    exit();
}

console.log("✅ 权限检查通过");

// 加载核心脚本
var scriptPath = "/sdcard/脚本/ClockMaster/cloud/core_task.js";

console.log("📂 脚本路径: " + scriptPath);

if (!files.exists(scriptPath)) {
    alert("错误", "核心脚本文件不存在！\n路径: " + scriptPath);
    exit();
}

console.log("✅ 脚本文件存在");

// 读取并执行脚本
var scriptContent = files.read(scriptPath);

console.log("📝 脚本大小: " + scriptContent.length + " 字节");
console.log("========================================");
console.log("🎯 开始执行核心打卡任务...");
console.log("========================================");

toast("🚀 开始执行打卡...");

// 执行脚本
engines.execScript("ClockMaster_Test", scriptContent);

console.log("✅ 任务已启动");
