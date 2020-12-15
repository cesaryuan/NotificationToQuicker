"ui";
//auto();
config = storages.create("quicker-notification");
var email = config.get("email", "");
var actionId = config.get("actionId", "");
var code = config.get("code", "");
var filterWords = config.get("filterWords", ["^.{2,3}输入法$", "^后台采集服务", "Bytes/s", "KiB/s"]);
//runObserve(email, actionId, code)
initUI();
//loop();

function runObserve(email, actionId, code){
    events.observeNotification();
    events.onNotification(function (notification) {
        var packageName = notification.getPackageName();
        var title = notification.getTitle();
        var text = notification.getText();
        if(!inBlackList(text, filterWords)){
            var data = "手机通知：" + [packageName, title, text].join("---");
            // if (notification.getText().match(/验证码|([^\d]|^)\d{6}(?!\d)/)) {
            //     log("检测到验证码，准备发送")
            var json = {
                "toUser": email,
                "code": code,
                "data": data,
                "operation": "action",
                "action": actionId
            }
            var r = http.postJson("https://push.getquicker.net/push", json, {}, function (response) {
                log(response.body.json());
                var returnJson = response.body.json();
                if(returnJson.successCount === 0){
                    toast(returnJson.errorMessage);
                }
            });
            // }
            console.log(data);
        }
    });
}

function initUI(){
    ui.layout(

        <vertical padding="16">
            <text textSize="15sp" text="请输入Quicker邮箱"/>
            <input id="email" hint="*****@qq.com" text=""/>
            <text textSize="15sp" text="请输入动作id"/>
            <input id="actionId" text=""/>
            <text textSize="15sp" text="请输入推送验证码"/>
            <input id="code" text=""/>
            <text textSize="15sp" text="请输入过滤词汇（用|||分隔，支持正则）"/>
            <input id="filterWords" lines="3" text=""/>
            <button id="start" text="开始监控"/>
            <button id="stop" text="关闭监控"/>

            <vertical gravity="bottom" layout_height="fill_parent">
                <text marginBottom="100" gravity="center" id="status" textSize="25sp" textColor="black" text="状态：未开始"/>
                <text gravity="bottom|center" id="author" textSize="16sp" textColor="black" text="作者：@Cesaryuan"/>
                <button id="showHelp" text="点击查看使用说明"/>
            </vertical>
        
        </vertical>
    );
    ui.email.setText(email);
    ui.actionId.setText(actionId);
    ui.code.setText(code);
    ui.filterWords.setText(filterWords.join('|||'));
    //指定确定按钮点击时要执行的动作
    ui.start.click(function(){
        //通过getText()获取输入的内容
        toast("准备检查输入的准确性");
        updateConfig();
        config.put("filterWords", filterWords);
        if(checkConfig(email, actionId, code)){
            toast("输入正确，连接成功，开始监控");
            $ui.status.setText("状态：已开始");         
            config.put("email", email);
            config.put("actionId", actionId);
            config.put("code", code);
            runObserve(email, actionId, code)
            setTimeout(toHome, 500)
        }
        else{
            toast("连接失败");
        }
    });
    ui.stop.click(function(){
        updateConfig();
        config.put("filterWords", filterWords);
        toast("已关闭");
        exit();
    });
    // 点击返回回到桌面，不退出程序
    ui.emitter.on("back_pressed", function (e) {
        e.consumed = true;
        toHome();
    });
    ui.showHelp.click(function(){
        app.openUrl("https://getquicker.net/sharedaction?code=b40f77ff-42f7-4fe4-a1f5-08d89ff18571");
    });
    ui.author.click(function(){
        app.openUrl("https://getquicker.net/User/18359/Cesaryuan");
    });
}

function checkConfig(email, actionId, code){
    var r = http.get("https://push.getquicker.net/helpers/getdevices?user=" + encodeURIComponent(email) + "&code=" + code);
    try{
        var returnJson = r.body.json();
        if(returnJson.isSuccess){
            return true;
        }else{
            log(returnJson);
            toast(returnJson.message);
        }
        
    }
    catch(e){
        return false;
    }
}

function registerEvent(){
    //启用按键监听
    events.observeKey();
    //监听音量上键按下
    events.onKeyDown("volume_up", function(event){
        toast("音量上键被按下了");
    });
    //监听菜单键按下
    events.onKeyDown("menu", function(event){
        toast("菜单键被按下了");
        exit();
    });
    events.on("exit", function(){
        log("脚本已结束运行");
    });
    
}

function toHome(){
    var i = app.intent({
        action: Intent.ACTION_MAIN,
        category: Intent.CATEGORY_HOME,
        flags: ["ACTIVITY_NEW_TASK"],
    });
    app.startActivity(i);
}

function inBlackList(text, words){
    var bool = false;
    for(word of words){
        try{
            if(text.match(word)){
                bool = true;
            }
        }
        catch(e){
            log(e);
            if(text.includes(word)){
                bool = true;
            }
        }

    }
    return bool;
}

function updateConfig(){
    email = ui.email.getText().toString();
    actionId = ui.actionId.getText().toString();
    code = ui.code.getText().toString();
    filterWords = ui.filterWords.getText().toString().split('|||');
}