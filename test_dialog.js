// 测试 dialogs API
"ui";

ui.layout(
    <vertical padding="16">
        <text text="对话框测试" textSize="18sp" gravity="center"/>
        <button id="test1" text="测试 rawInput"/>
        <button id="test2" text="测试 prompt"/>
        <button id="test3" text="测试 dialogs.input"/>
        <text id="result" text="结果会显示在这里" textColor="#666666" marginTop="16"/>
    </vertical>
);

ui.test1.click(function() {
    threads.start(function() {
        var r = rawInput("请输入时间", "09:00");
        ui.run(function() {
            ui.result.setText("rawInput 结果: " + r);
        });
    });
});

ui.test2.click(function() {
    threads.start(function() {
        var r = dialogs.prompt("请输入时间", "09:00");
        ui.run(function() {
            ui.result.setText("prompt 结果: " + r);
        });
    });
});

ui.test3.click(function() {
    threads.start(function() {
        var r = dialogs.input("标题", "请输入时间", "09:00");
        ui.run(function() {
            ui.result.setText("input 结果: " + r);
        });
    });
});
