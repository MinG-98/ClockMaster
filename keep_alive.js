/**
 * keep_alive.js - 前台服务保活脚本
 * ClockMaster - Foreground Service Keep-Alive
 *
 * 功能:
 * 1. 启动前台服务，防止被系统杀死
 * 2. 监控定时任务执行
 * 3. 自动重启定时器
 *
 * 使用方法:
 * 在 AutoX.js 中运行此脚本，它会在后台持续运行
 */

// 加载模块
var Storage = require("./app/modules/storage.js");
var Scheduler = require("./app/modules/scheduler.js");

log("========== ClockMaster 保活服务启动 ==========");

// 创建前台通知
var notification = new android.app.Notification.Builder(context, "clockmaster_channel")
    .setContentTitle("ClockMaster 运行中")
    .setContentText("定时打卡服务正在后台运行")
    .setSmallIcon(android.R.drawable.ic_dialog_info)
    .setOngoing(true)
    .build();

// 创建通知渠道 (Android 8.0+)
if (android.os.Build.VERSION.SDK_INT >= 26) {
    var notificationManager = context.getSystemService(android.content.Context.NOTIFICATION_SERVICE);
    var channel = new android.app.NotificationChannel(
        "clockmaster_channel",
        "ClockMaster 服务",
        android.app.NotificationManager.IMPORTANCE_LOW
    );
    channel.setDescription("ClockMaster 定时打卡服务");
    notificationManager.createNotificationChannel(channel);
}

// 启动前台服务
try {
    // 使用 threads.currentEngine 获取当前引擎
    var service = engines.myEngine().getService();
    if (service && service.startForeground) {
        service.startForeground(1001, notification);
        log("前台服务已启动");
    }
} catch (e) {
    log("启动前台服务失败: " + e.message);
}

// 初始化定时任务
var count = Scheduler.initAllSchedules();
log("已加载 " + count + " 个定时任务");

// 显示状态信息
var statusInfo = Scheduler.getStatusInfo();
if (statusInfo.length > 0) {
    log("定时任务状态:");
    for (var i = 0; i < statusInfo.length; i++) {
        log("  - " + statusInfo[i].label + ": " + statusInfo[i].time + " (下次: " + statusInfo[i].nextExecution + ")");
    }
} else {
    log("暂无启用的定时任务");
}

// 心跳检测 - 每 30 分钟检查一次定时任务状态
setInterval(function() {
    log("[心跳] " + new Date().toLocaleString());

    // 检查定时任务是否正常
    var schedules = Scheduler.getSchedules();
    var enabledCount = 0;
    for (var i = 0; i < schedules.length; i++) {
        if (schedules[i].enabled) {
            enabledCount++;
        }
    }

    log("[心跳] 活跃定时任务: " + enabledCount + " 个");

    // 检查是否有遗漏的任务需要执行
    Scheduler.checkAndExecuteOnStartup();

}, 30 * 60 * 1000); // 30 分钟

// 保持脚本运行
setInterval(function() {
    // 空操作，保持脚本活跃
}, 60 * 1000);

log("保活服务已启动，正在监控定时任务...");
toast("ClockMaster 保活服务已启动");

// 退出处理
events.on("exit", function() {
    log("保活服务退出");
    Scheduler.cancelAllSchedules();
});
