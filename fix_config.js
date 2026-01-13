/**
 * ClockMaster 配置修正脚本
 * 修正脚本路径配置
 */

console.log("========================================");
console.log("🔧 修正配置路径...");
console.log("========================================");

// 创建存储实例
var storage = storages.create("clockmaster_config");

// 读取当前配置
var currentUrl = storage.get("cloudScriptUrl", "");
console.log("当前配置: " + currentUrl);

// 修正路径
var correctUrl = "file:///sdcard/脚本/ClockMaster/cloud/core_task.js";

console.log("修正为: " + correctUrl);

// 保存修正后的配置
storage.put("cloudScriptUrl", correctUrl);

console.log("========================================");
console.log("✅ 配置已修正！");
console.log("========================================");
console.log("");
console.log("📱 现在请：");
console.log("1. 运行 app/main.js");
console.log("2. 点击'立即执行'");
console.log("========================================");

toast("✅ 配置路径已修正！");
