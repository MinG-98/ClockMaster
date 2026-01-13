/**
 * ClockMaster 配置重置脚本
 * 将配置重置为正确的默认值
 */

console.log("========================================");
console.log("🔧 重置 ClockMaster 配置...");
console.log("========================================");

// 创建存储实例
var storage = storages.create("clockmaster_config");

// 设置正确的配置
storage.put("pushplusToken", "45552f26c7f949d09a135ff0caec71f6");
storage.put("targetAppPackage", "农商云办公");
storage.put("cloudScriptUrl", "file:///sdcard/脚本/ClockMaster/cloud/core_task.js");
storage.put("maxRandomDelay", 5);
storage.put("debugMode", false);

console.log("========================================");
console.log("✅ 配置已重置为默认值！");
console.log("========================================");
console.log("");
console.log("📋 当前配置:");
console.log("Token: " + storage.get("pushplusToken"));
console.log("目标应用: " + storage.get("targetAppPackage"));
console.log("脚本URL: " + storage.get("cloudScriptUrl"));
console.log("最大延迟: " + storage.get("maxRandomDelay") + " 分钟");
console.log("调试模式: " + storage.get("debugMode"));
console.log("========================================");
console.log("");
console.log("📱 现在请：");
console.log("1. 运行 app/main.js");
console.log("2. 验证配置已正确填充");
console.log("3. 点击'立即执行'");
console.log("========================================");

toast("✅ 配置已重置！");
