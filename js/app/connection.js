//Broker connection and message handling
$(function () {

});

function connect(){
    //client = new Paho.Client(broker_connection["broker_address"], Number(broker_connection["broker_port"]), broker_connection["broker_client_id"]);
    //client = new Paho.Client("ws://"+broker_connection["broker_address"]+":"+broker_connection["broker_port"], broker_connection["broker_client_id"]);

    /*client = new Paho.Client("mqtt.eclipse.org", 443, "/mqtt", "random_client_id_sadasad");


    // set callback handlers
    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;


    var willmessage = new Paho.Message(broker_connection["broker_lwat_message"]);
    willmessage.destinationName = broker_connection["broker_lwat_topic"];
    willmessage.qos = Number(broker_connection["broker_lwat_qos"]);
    if(typeof(broker_connection["broker_lwat_retain"]) !== "undefined"){
      willmessage.retained = broker_connection["broker_lwat_retain"];
    }

    var options={};

    options.onSuccess = onConnect;
    options.keepAliveInterval=Number(broker_connection["broker_keepalive"]);

    if(typeof(broker_connection["broker_cleansession"]) !== "undefined"){
      options.cleanSession = broker_connection["broker_cleansession"];
    }

    if(typeof(broker_connection["broker_useSSL"]) !== "undefined"){
      options.useSSL = broker_connection["broker_useSSL"];
    }
    options.userName = broker_connection["broker_username"];
    options.password = broker_connection["broker_password"];
    options.willMessage = willmessage;
    options.onFailure = onFail;
    client.connect(options);
    */

    if(broker_connection["broker_path"] != ""){
        client = new Paho.Client(broker_connection["broker_address"], Number(broker_connection["broker_port"]),broker_connection["broker_path"],  broker_connection["broker_client_id"]);
    }else{
        client = new Paho.Client(broker_connection["broker_address"], Number(broker_connection["broker_port"]),  broker_connection["broker_client_id"]);
    }


    // set callback handlers
    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;


    var options = {
        // invocationContext: { host: broker_connection["broker_address"], port: Number(broker_connection["broker_port"]), path: broker_connection["broker_path"], clientId: broker_connection["broker_client_id"] },
        timeout: 600,
        keepAliveInterval: Number(broker_connection["broker_keepalive"]),
        onSuccess: onConnect,
        onFailure: onFail
    };

    if(typeof(broker_connection["broker_cleansession"]) !== "undefined"){
        options.cleanSession = broker_connection["broker_cleansession"];
    }

    if(typeof(broker_connection["broker_useSSL"]) !== "undefined"){
        options.useSSL = broker_connection["broker_useSSL"];
    }

    if(broker_connection["broker_lwat_topic"] != "" && broker_connection["broker_lwat_message"] != ""){
        var willmessage = new Paho.Message(broker_connection["broker_lwat_message"]);
        willmessage.destinationName = broker_connection["broker_lwat_topic"];
        willmessage.qos = Number(broker_connection["broker_lwat_qos"]);
        if(typeof(broker_connection["broker_lwat_retain"]) !== "undefined"){
            willmessage.retained = broker_connection["broker_lwat_retain"];
        }
        options.willMessage = willmessage;
    }


    if(typeof(broker_connection["broker_cleansession"]) !== "undefined"){
        options.cleanSession = broker_connection["broker_cleansession"];
    }

    if(typeof(broker_connection["broker_useSSL"]) !== "undefined"){
        options.useSSL = broker_connection["broker_useSSL"];
    }
    options.userName = broker_connection["broker_username"];
    options.password = broker_connection["broker_password"];

    client.connect(options);

}; //)
$(document).on("click", "#btn_broker_disconnectBr", function(){
    //view connection tab
    $("#home").css("display","block");
    $("#btn_broker_disconnectBr").css("display","none");
    client.disconnect();
});
$(document).on("click", "#btn_broker_disconnectBr", function(){
    //view connection tab
    $("#home").css("display","block");
    $("#btn_saveTo_MQTT").css("display","none");
    $("#btn_loadFrom_MQTT").css("display","none");
    $("#btn_loadFrom_MQTT").css("display","none");
    $("#btn_broker_disconnectBr").css("display","none");
    client.disconnect();
});

function onFail(context) {
    console.log("ERROR", "Failed to connect. [Error Message: ", context.errorMessage, "]");
}

// called when the client connects
function onConnect() {

    //Subscribe ALL topic
    client.subscribe("#");
    setTimeout(function () {
        //unSubscribe ALL topic after 10sec
        client.unsubscribe("#");
    }, 10000);
    client.subscribe('webMQTT/'+broker_connection["broker_username"]+'/settings')

    //input for autocomplete
    $("input[name='path']").autocomplete({
        source: availablePath
    });
    // Once a connection has been made, make a subscription and send a message.
    modal("Client connected");

    //hide connection tab

    $("#home").css("display", "none");
    $("#btn_broker_connectBr").css("display", "none");
    $("#btn_broker_disconnectBr").css("display", "inline-block");
    $("#btn_saveTo_MQTT").css("display", "inline-block");
    $("#btn_loadFrom_MQTT").css("display", "none");

    //client.subscribe("rundebugrepeat/test/Temperature");


    //Subscribe to the UI node paths
    $.each(json_ui.nodes, function(){

        var ui_node = this;

        if(ui_node.path != null){
            client.subscribe(ui_node.path);
            //console.log("[CLIENT] - Subscribed to path: "+ui_node.path);
        }
    });

}

// called when the client loses its connection
function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.log("onConnectionLost:"+responseObject.errorMessage);
        modal("Client disconnected: "+responseObject.errorMessag);
    }
    modal("Client disconnected");
    $("#btn_broker_connectBr").css("display","inline-block");
    $("#btn_broker_disconnectBr").css("display","none");
}

// called when a message arrives
function onMessageArrived(message) {

    if(message.destinationName == 'webMQTT/'+broker_connection["broker_username"]+'/settings'){
        if(JSON.stringify(localDB) != message.payloadString) {
            localDB = JSON.parse(message.payloadString);
            saveDB(localDB);
            reloadUI();
            console.log("config load from MQTT");
        }
    }
    // console.log("onMessageArrived:"+message.destinationName);
    //add topic path to array
    if (!availablePath.includes(message.destinationName)) {
        availablePath.push(message.destinationName)
    }

    //update json_iu after load config from MQTT
    $.each(localDB.CLIENTS, function(index, client){
        if (client.id == params.get("id")){
            client_array_index = index;
        }
    });
    //JSON_UI array of objects
    var json_ui = localDB.CLIENTS[client_array_index].UI;

    var message_nodes = json_ui.nodes.filter(function(ui_node) {
        return ui_node.path == message.destinationName;
    });
    // console.log(message_nodes);
    $.each(message_nodes, function(){
        // console.log(message.payloadString);
        var ui_node = this;
        switch(ui_node.type){

            //Switch
            case "switch":
                switch(message.payloadString){
                    case ui_node.message_on:
                        // console.log( $("#switch_"+ui_node.id));
                        $("#switch_"+ui_node.id).prop("checked", true);
                        break;
                    case ui_node.message_off:
                        // console.log( $("#switch_"+ui_node.id));
                        $("#switch_"+ui_node.id).prop("checked", false);
                        break;
                }
                break;

            //textVal
            case "textVal":
                if(message.payloadString){
                    if(ui_node.textValue != 0){
                        var message_text = JSON.parse(message.payloadString, function(key, value) {
                            // console.log(key, value)
                            if (key == ui_node.textValue) {
                                message_text = value;
                            }
                            return message_text;
                        });
                    }else{
                        message_text = message.payloadString;
                    }
                    $("#textVal_"+ui_node.id).html(message_text);
                }
                break;

            //Checkbox
            case "checkbox":
                switch(message.payloadString){
                    case ui_node.message_on:
                        console.log( $("#checkbox_"+ui_node.id));
                        $("#checkbox_"+ui_node.id).prop("checked", true);
                        $("#checkbox_label_"+ui_node.id).css("background-color", "#"+ui_node.color);
                        $("#checkbox_label_"+ui_node.id).css("border-color", "#"+ui_node.color);
                        break;
                    case ui_node.message_off:
                        console.log( $("#checkbox_"+ui_node.id));
                        $("#checkbox_"+ui_node.id).prop("checked", false);
                        $("#checkbox_label_"+ui_node.id).css("background-color", "#fff");
                        $("#checkbox_label_"+ui_node.id).css("border-color", "#ffffff");
                        break;
                }
                break;

            //gauge
            case "gauge":
                // console.log(gauges);
                var message_gauges = gauges.filter(function(gauge) {
                    return gauge.config.id == "gauge_"+ui_node.id;
                });
                $.each(message_gauges, function(){
                    var gauge = this;
                    gauge.refresh(message.payloadString);
                });
                break;

            //chart
            case "chart":
                var message_charts = charts.filter(function(chart){
                    return chart.id == "chart_"+ui_node.id;
                });
                $.each(message_charts, function(){
                    var chart = this;
                    chart.config.data.labels.push("now");

                    var dataset = chart.config.data.datasets[0];
                    dataset.data.push(message.payloadString);

                    if(dataset.data.length>=10){
                        dataset.data.shift();
                        chart.config.data.labels.shift();
                    }


                    chart.update();
                });
                break;

            //slider
            case "slider":
                $("#slider_"+ui_node.id).val(message.payloadString);
                break;



            default:
                console.log("[Error]: Message arrived, type not supported - "+ui_node.type);
                break;
        }

    });
}


//Ui div event handlers

//Add new ui button clicked
$(document).on("click", "#btn_add_new_ui_element", function(){
    form_ui_node_mode = "new";
    $.each($(".tab_nav_ui_node"), function(){
        $(this).css("display","");
    });
    var new_ui_node_inputs = $(".form_add_ui_element").find("input");
    $.each(new_ui_node_inputs, function(){
        //console.log($(this).attr("type"));
        if($(this).attr("type") != "number" && $(this).attr("name") != "type"){
            $(this).val("");
        }

    });
});

//Form edit ui element open
$(document).on("click", ".btn_edit_ui_node", function(){
    form_ui_node_mode = "edit";
    var node_id = $(this).data("node-id");
    selected_node_id = node_id;
    var ui_node = json_ui.nodes.find(function(ui_node) {
        return ui_node.id == node_id;
    });
    console.log(ui_node);
    //activate tab
    $.each($(".tab_nav_ui_node"), function(){
        if($(this).data("type") == ui_node.type){
            $(this).addClass("active");
            $(this).css("display", "");
        }else{
            $(this).removeClass("active");
            $(this).css("display", "none");
        }
    });
    $.each($("#tab_panes_ui_node").find(".tab-pane"),function(){
        if($(this).attr("id")=="tab_add_"+ui_node.type){
            $(this).addClass("active");
        }else{
            $(this).removeClass("active");
        }
    });
    //populate input values from node data

    $.each(Object.keys(ui_node), function(index){
        if(this == "color"){
            $("#tab_add_"+ui_node.type).find("input[name=color]").css('background-color', '#'+ui_node.color);
        }
        $("#tab_add_"+ui_node.type).find("input[name="+this+"]").val(Object.values(ui_node)[index]);
        $("#tab_add_"+ui_node.type).find("textarea[name="+this+"]").val(Object.values(ui_node)[index]);

    });


});
