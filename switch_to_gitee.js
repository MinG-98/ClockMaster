/**
 * ClockMaster 切换到 Gitee 云端模式
 * 将脚本源切换为 Gitee Raw URL
 */

console.log("========================================");
console.log("🔄 切换到 Gitee 云端模式...");
console.log("========================================");

// 创建存储实例
var storage = storages.create("clockmaster_config");

// Gitee Raw URL
var giteeUrl = "https://gitee.com/MinG-98/ClockMaster/raw/main/cloud/core_task.js";

console.log("📋 当前配置:");
console.log("旧 URL: " + storage.get("cloudScriptUrl", "无"));

// 更新为 Gitee URL
storage.put("cloudScriptUrl", giteeUrl);

console.log("");
console.log("✅ 已切换到 Gitee 云端模式！");
console.log("========================================");
console.log("新 URL: " + giteeUrl);
console.log("========================================");
console.log("");
console.log("🌟 Gitee 云端模式优势:");
console.log("✅ 国内访问速度快");
console.log("✅ 稳定性高");
console.log("✅ 支持自动更新");
console.log("✅ 无需每次重新部署");
console.log("");
console.log("📱 下一步:");
console.log("1. 运行 app/main.js");
console.log("2. 验证 URL 已更新");
console.log("3. 点击'强制更新'拉取最新脚本");
console.log("4. 点击'立即执行'测试");
console.log("========================================");

toast("✅ 已切换到 Gitee 云端模式！");
