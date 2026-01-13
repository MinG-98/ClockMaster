/**
 * ClockMaster 彻底清理并重置配置脚本
 * 清除所有旧配置，设置正确的路径
 */

console.log("========================================");
console.log("🧹 彻底清理 ClockMaster 配置...");
console.log("========================================");

// 创建存储实例
var storage = storages.create("clockmaster_config");

console.log("📋 旧配置:");
console.log("Token: " + storage.get("pushplusToken", "无"));
console.log("目标应用: " + storage.get("targetAppPackage", "无"));
console.log("脚本URL: " + storage.get("cloudScriptUrl", "无"));
console.log("");

// 清空所有配置
console.log("🧹 清空所有旧配置...");
storage.clear();

console.log("✅ 旧配置已清除");
console.log("");

// 设置正确的新配置
console.log("📝 写入正确的新配置...");
storage.put("pushplusToken", "45552f26c7f949d09a135ff0caec71f6");
storage.put("targetAppPackage", "农商云办公");
storage.put("cloudScriptUrl", "file:///sdcard/脚本/ClockMaster/cloud/core_task.js");
storage.put("maxRandomDelay", 5);
storage.put("debugMode", false);

console.log("========================================");
console.log("✅ 新配置已设置！");
console.log("========================================");
console.log("");
console.log("📋 新配置:");
console.log("Token: " + storage.get("pushplusToken"));
console.log("目标应用: " + storage.get("targetAppPackage"));
console.log("脚本URL: " + storage.get("cloudScriptUrl"));
console.log("最大延迟: " + storage.get("maxRandomDelay") + " 分钟");
console.log("调试模式: " + storage.get("debugMode"));
console.log("========================================");
console.log("");
console.log("⚠️ 重要：确认脚本URL是 /sdcard/脚本/ClockMaster (不是 Scripts!)");
console.log("");
console.log("📱 现在请：");
console.log("1. 关闭并重新运行 app/main.js");
console.log("2. 检查配置是否正确显示");
console.log("3. 点击'立即执行'");
console.log("========================================");

toast("✅ 配置已彻底清理并重置！");
