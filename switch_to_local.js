/**
 * ClockMaster 切换到本地文件模式
 * 将脚本源切换为本地文件
 */

console.log("========================================");
console.log("🔄 切换到本地文件模式...");
console.log("========================================");

// 创建存储实例
var storage = storages.create("clockmaster_config");

// 本地文件路径
var localUrl = "file:///sdcard/脚本/ClockMaster/cloud/core_task.js";

console.log("📋 当前配置:");
console.log("旧 URL: " + storage.get("cloudScriptUrl", "无"));

// 更新为本地文件
storage.put("cloudScriptUrl", localUrl);

console.log("");
console.log("✅ 已切换到本地文件模式！");
console.log("========================================");
console.log("新 URL: " + localUrl);
console.log("========================================");
console.log("");
console.log("🌟 本地文件模式优势:");
console.log("✅ 速度最快（无网络请求）");
console.log("✅ 离线可用");
console.log("✅ 不依赖外部服务");
console.log("");
console.log("⚠️ 注意:");
console.log("本地模式需要手动更新文件（通过 ADB 推送）");
console.log("");
console.log("📱 下一步:");
console.log("1. 运行 app/main.js");
console.log("2. 验证 URL 已更新");
console.log("3. 点击'立即执行'测试");
console.log("========================================");

toast("✅ 已切换到本地文件模式！");
