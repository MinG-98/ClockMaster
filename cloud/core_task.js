/**
 * Project ClockMaster - Core Task (v2.6 红点调试版)
 * 特性：显示点击位置（红点），采用三连击策略确保命中
 */

var floatyWindow = null;
var debugDot = null;

(function main() {
    try {
        // ================= 1. 初始化 =================
        showFloaty("🚀 v2.6 启动: 红点调试模式");
        
        var storage = storages.create("CLOCKMASTER_CONFIG");
        var configAppName = storage.get("package_name", "农商云办公");
        var targetAppName = (configAppName.indexOf("农商") === -1) ? "农商云办公" : configAppName;
        var maxDelay = parseInt(storage.get("random_delay", "0"));

        // ================= 2. 随机延迟 (调试期可设为0) =================
        if (maxDelay > 0) {
            // ... (省略具体倒计时代码，保持原样即可，为了篇幅简略) ...
            // 调试期间建议在App配置里把延迟设为0，省得等
        }

        // ================= 3. 启动应用 =================
        showFloaty("📱 启动: " + targetAppName);
        home(); sleep(1000);
        if (!launchApp(targetAppName)) {
            var pkg = getPackageName(targetAppName);
            if(pkg) launch(pkg);
        }
        
        // ================= 4. 寻找入口 =================
        showFloaty("👀 等待首页...");
        waitForPackage(getPackageName(targetAppName), 15000);
        var loaded = textMatches(/移动考勤|工作台/).findOne(12000);
        if(!loaded) throw new Error("首页加载超时");
        sleep(2000);

        showFloaty("🔍 点击 [移动考勤]");
        var entry = text("移动考勤").findOne(5000);
        if (entry) {
            clickWithRedDot(entry); // 带红点的点击
        } else {
            throw new Error("未找到 [移动考勤]");
        }

        // ================= 5. 打卡核心 (三连击) =================
        showFloaty("📍 等待定位加载...");
        sleep(8000); // 必须等绿球出来

        showFloaty("🎯 锁定目标: [打卡]");
        
        // 查找文字
        var targetWidget = text("打卡").findOne(4000);
        
        if (targetWidget) {
            var b = targetWidget.bounds();
            var centerX = b.centerX();
            var centerY = b.centerY();
            
            // --- 第 1 击：文字中心 ---
            showFloaty("💥 第1击: 文字中心");
            showRedDot(centerX, centerY); // 显示红点
            press(centerX, centerY, 350); // 按压
            sleep(1000);

            // --- 第 2 击：文字下方偏移 (通常圆心在文字下面) ---
            showFloaty("💥 第2击: 向下偏移");
            var offsetY = centerY + 150; // 下移 150 像素
            showRedDot(centerX, offsetY);
            press(centerX, offsetY, 350);
            
        } else {
            showFloaty("⚠️ 文字丢失，准备盲狙");
        }

        sleep(1000);

        // --- 第 3 击：屏幕绝对位置 (盲狙) ---
        // 针对你的截图，绿球大概在屏幕中间偏下
        showFloaty("💥 第3击: 屏幕黄金点");
        var absX = device.width / 2;       // 屏幕宽的一半
        var absY = device.height * 0.55;   // 屏幕高的 55%
        
        showRedDot(absX, absY);
        press(absX, absY, 400); // 稍长一点

        // ================= 6. 结束 =================
        sleep(3000);
        showFloaty("✨ 执行完毕，请看截图");
        captureSnapshot("Result_v2.6");

    } catch (e) {
        console.error(e);
        showFloaty("❌ " + e.message);
        captureSnapshot("Error");
    } finally {
        sleep(3000);
        if (floatyWindow) floatyWindow.close();
        if (debugDot) debugDot.close();
        exit();
    }
})();

// ================= 工具函数 =================

// 在点击位置显示一个红点，持续 0.5 秒
function showRedDot(x, y) {
    if (debugDot) debugDot.close();
    // 开启一个微型悬浮窗画红点
    debugDot = floaty.rawWindow(
        <frame w="30px" h="30px">
            <img w="20px" h="20px" src="file:///android_asset/modules/autojs.png" tint="#ff0000" radius="10dp" bg="#ff0000"/>
        </frame>
    );
    // 修正坐标 (悬浮窗坐标是左上角，要减去半径让它居中)
    debugDot.setPosition(x - 15, y - 15);
    
    // 0.8秒后消失
    setTimeout(() => {
        if(debugDot) debugDot.close();
    }, 800);
}

function clickWithRedDot(widget) {
    if (!widget) return;
    var b = widget.bounds();
    var x = b.centerX();
    var y = b.centerY();
    showRedDot(x, y);
    press(x, y, 100);
}

function showFloaty(text) {
    if (!floatyWindow) {
        floatyWindow = floaty.rawWindow(
            <card cardCornerRadius="8dp" alpha="0.8" bg="#222222">
                <text id="content" text="" padding="15" textSize="16sp" textColor="#00ff00" textStyle="bold"/>
            </card>
        );
        floatyWindow.setPosition(50, 200);
    }
    ui.run(() => { floatyWindow.content.setText(text); });
}

function captureSnapshot(tag) {
    try {
        if (!requestScreenCapture(false)) return;
        var path = "/sdcard/ClockMaster_" + tag + ".png";
        captureScreen(path);
    } catch(e) {}
}