/**
 * Project ClockMaster - Main Loader (修复命名冲突版)
 * 修复点：将 id="run" 改为 id="btn_exec"，防止与系统函数 ui.run() 冲突
 */

"ui";

// 1. 定义 UI 布局
ui.layout(
    <vertical padding="16" bg="#f5f5f5">
        <text text="ClockMaster" textSize="24sp" textStyle="bold" gravity="center" textColor="#333333" margin="0 20"/>
        <text text="智能打卡助手 v1.0.2 (Fix)" textSize="12sp" gravity="center" textColor="#999999" margin="0 0 0 20"/>
        
        <card cardCornerRadius="8dp" cardElevation="4dp" margin="0 5" bg="#ffffff">
            <vertical padding="16">
                <text text="基础配置" textStyle="bold" textColor="#000000"/>
                
                <text text="PushPlus Token" marginTop="10" textColor="#666666" textSize="12sp"/>
                <input id="token" hint="请输入Token" textSize="14sp"/>
                
                <text text="目标App包名" marginTop="10" textColor="#666666" textSize="12sp"/>
                <input id="pkg" hint="例如: com.alibaba.android.rimet" textSize="14sp"/>
                
                <text text="脚本地址 (支持 http:// 或 file://)" marginTop="10" textColor="#666666" textSize="12sp"/>
                <input id="url" hint="云端链接或本地路径" textSize="14sp" lines="2"/>
                
                <text text="最大随机延迟 (分钟)" marginTop="10" textColor="#666666" textSize="12sp"/>
                <seekbar id="delay" max="30" progress="0"/>
                <text id="delay_text" text="0 分钟" gravity="right" textColor="#009688"/>
            </vertical>
        </card>

        <button id="save" text="保存配置" style="Widget.AppCompat.Button.Colored" margin="0 10"/>
        <button id="btn_exec" text="立即执行" bg="#4caf50" textColor="#ffffff" margin="0 5"/>
        
        <text id="status" text="就绪" gravity="center" marginTop="20" textColor="#666666"/>
    </vertical>
);

// 2. 初始化配置
var storage = storages.create("CLOCKMASTER_CONFIG");
ui.token.setText(storage.get("token", ""));
ui.pkg.setText(storage.get("package_name", "云办公")); 
// 自动填入正确的本地路径示例（注意这里我也帮你改成了 cloud/core_task.js）
ui.url.setText(storage.get("script_url", "file:///sdcard/脚本/Project_ClockMaster/cloud/core_task.js"));
ui.delay.setProgress(storage.get("random_delay", 0));
ui.delay_text.setText(ui.delay.getProgress() + " 分钟");

// UI 事件监听
ui.delay.setOnSeekBarChangeListener({
    onProgressChanged: function(seekBar, progress, fromUser) {
        ui.delay_text.setText(progress + " 分钟");
    }
});

ui.save.click(() => {
    storage.put("token", ui.token.text());
    storage.put("package_name", ui.pkg.text());
    storage.put("script_url", ui.url.text());
    storage.put("random_delay", ui.delay.getProgress());
    toast("✅ 配置已保存");
});

// 修改点2：使用新的ID绑定点击事件
ui.btn_exec.click(() => {
    // 保存最新配置
    ui.save.performClick();
    
    // 启动新线程执行，防止卡死 UI
    threads.start(function() {
        runScript();
    });
});

// 3. 核心加载逻辑
function runScript() {
    updateStatus("正在检查权限...");
    if (!checkPermissions()) return;

    var url = ui.url.text();
    var scriptCode = "";

    try {
        updateStatus("正在加载脚本...");
        
        if (url.startsWith("file://")) {
            var path = url.replace("file://", "");
            if (!files.exists(path)) throw new Error("文件不存在: " + path);
            scriptCode = files.read(path);
            log("加载本地文件成功");
        } else if (url.startsWith("http")) {
            var res = http.get(url);
            if (res.statusCode != 200) throw new Error("网络请求失败: " + res.statusCode);
            scriptCode = res.body.string();
            log("下载云端脚本成功");
        } else {
            throw new Error("不支持的协议，请以 file:// 或 http:// 开头");
        }

        updateStatus("脚本执行中...");
        // 动态执行代码
        engines.execScript("CoreTask", scriptCode);
        
    } catch (e) {
        console.error(e);
        updateStatus("错误: " + e.message);
        alert("执行失败", e.message);
    }
}

function updateStatus(msg) {
    // 这里 ui.run 就可以正常作为系统函数使用了
    ui.run(() => { ui.status.setText(msg); });
}

function checkPermissions() {
    if (!auto.service) {
        alert("权限缺失", "请开启无障碍服务");
        app.startActivity({ action: "android.settings.ACCESSIBILITY_SETTINGS" });
        return false;
    }
    if (!floaty.checkPermission()) {
        alert("权限缺失", "请开启悬浮窗权限");
        floaty.requestPermission();
        return false;
    }
    return true;
}