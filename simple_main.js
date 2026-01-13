/**
 * ClockMaster 简化版主程序
 * 去除复杂逻辑，直接加载并执行打卡脚本
 */

"ui";

// UI 布局
ui.layout(
    <ScrollView>
    <vertical padding="16" bg="#f5f5f5">
        <text text="ClockMaster" textSize="24sp" textStyle="bold" gravity="center" textColor="#333333" margin="0 20"/>
        <text text="智能打卡助手 v3.0 简化版" textSize="12sp" gravity="center" textColor="#999999" margin="0 0 0 20"/>

        {/* 基础配置 */}
        <card cardCornerRadius="8dp" cardElevation="4dp" margin="0 5" bg="#ffffff">
            <vertical padding="16">
                <text text="基础配置" textSize="14sp" textColor="#333333" textStyle="bold" marginBottom="10"/>

                <text text="PushPlus Token" textSize="11sp" textColor="#666666"/>
                <input id="token" hint="用于推送通知" textSize="13sp" marginBottom="8"/>

                <text text="目标App名称" textSize="11sp" textColor="#666666"/>
                <input id="pkg" hint="如: YourApp" textSize="13sp" marginBottom="8"/>
            </vertical>
        </card>

        {/* 操作按钮 */}
        <horizontal marginTop="8">
            <button id="save_btn" text="保存配置" style="Widget.AppCompat.Button.Colored" layout_weight="1" marginRight="6"/>
            <button id="run_btn" text="立即执行" style="Widget.AppCompat.Button.Colored" layout_weight="1" marginLeft="6" bg="#4CAF50"/>
        </horizontal>
    </vertical>
    </ScrollView>
);

// 配置存储
var storage = storages.create("clockmaster_config");

// 加载配置
ui.token.setText(storage.get("pushplusToken", "your_pushplus_token"));
ui.pkg.setText(storage.get("targetAppPackage", "YourApp"));

// 保存配置
ui.save_btn.click(function() {
    storage.put("pushplusToken", ui.token.text().trim());
    storage.put("targetAppPackage", ui.pkg.text().trim());
    toast("✅ 配置已保存");
    log("配置已保存");
});

// 立即执行
ui.run_btn.click(function() {
    // 先保存配置
    ui.save_btn.performClick();

    // 检查权限
    if (!auto.service) {
        dialogs.alert("权限缺失", "请开启无障碍服务");
        return;
    }

    if (!floaty.checkPermission()) {
        dialogs.alert("权限缺失", "请开启悬浮窗权限");
        return;
    }

    // 直接加载并执行脚本
    threads.start(function() {
        try {
            var scriptPath = "/sdcard/脚本/ClockMaster/cloud/core_task.js";

            log("脚本路径: " + scriptPath);

            if (!files.exists(scriptPath)) {
                toast("❌ 脚本文件不存在");
                log("错误: 脚本文件不存在: " + scriptPath);
                return;
            }

            var scriptContent = files.read(scriptPath);
            log("脚本大小: " + scriptContent.length + " 字节");

            toast("🚀 开始执行打卡...");
            log("开始执行打卡...");

            // 执行脚本
            engines.execScript("ClockMaster_Core", scriptContent);

            log("✅ 任务已启动");

        } catch (e) {
            toast("❌ 执行失败: " + e.message);
            console.error("执行失败: " + e.message);
            console.error(e);
        }
    });
});

log("ClockMaster 简化版启动完成");
