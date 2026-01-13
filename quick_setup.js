/**
 * ClockMaster 快速配置脚本
 * 直接设置好所有配置
 */

// 导入存储模块
var Storage = require("./modules/storage.js");

// 配置信息
var config = {
    pushplusToken: "your_pushplus_token",
    targetAppPackage: "",
    cloudScriptUrl: "file:///sdcard/脚本/ClockMaster/cloud/core_task.js",
    maxRandomDelay: 0,  // 测试时不延迟
    debugMode: false
};

// 保存配置
Storage.setAll(config);

console.log("========================================");
console.log("✅ 配置已保存！");
console.log("========================================");
console.log("PushPlus Token: " + config.pushplusToken);
console.log("目标App: " + config.targetAppPackage);
console.log("脚本URL: " + config.cloudScriptUrl);
console.log("随机延迟: " + config.maxRandomDelay + " 分钟");
console.log("========================================");
console.log("");
console.log("📱 下一步：");
console.log("1. 运行 app/main.js");
console.log("2. 点击'检查权限'确保都是绿色");
console.log("3. 点击'测试推送'验证Token");
console.log("4. 点击'立即执行'测试打卡");
console.log("========================================");

toast("✅ 配置已保存！现在可以运行 main.js 了");
