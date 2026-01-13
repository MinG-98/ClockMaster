/**
 * ClockMaster Token 更新脚本
 * 运行此脚本来更新你的 PushPlus Token
 */

// 导入存储模块
var Storage = require("./modules/storage.js");

// ============================================
// 👇 在这里填写你的新 Token
// ============================================
var NEW_TOKEN = "在这里粘贴你的新Token";
// ============================================

// 更新 Token
Storage.set("pushplusToken", NEW_TOKEN);

console.log("========================================");
console.log("✅ Token 已更新！");
console.log("========================================");
console.log("新 Token: " + NEW_TOKEN);
console.log("========================================");
console.log("");
console.log("📱 下一步：");
console.log("1. 运行 app/main.js");
console.log("2. 点击'测试推送'验证新Token");
console.log("========================================");

toast("✅ Token 已更新！");
