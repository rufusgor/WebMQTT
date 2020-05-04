//User Interface
$(function () {

});

//Android Webview Object.Values fix....
Object.values = (obj) => Object.keys(obj).map(key => obj[key]);

var client;
var gauges = [];
var charts = [];
var colorpickers = [];
var form_ui_node_mode = ""; //edit: edit node; new: new node;
var selected_node_id = "";
var ui_edit_enabled = false;
var availablePath = [];

var client_array_index = 0;

$.each(localDB.CLIENTS, function(index, client){
    if (client.id == params.get("id")){
        client_array_index = index;
    }
});
console.log(client_array_index);


//JSON_UI array of objects
var json_ui = localDB.CLIENTS[client_array_index].UI;

//save ui_nodes  data to local storage
function save_ui(){
    localDB.CLIENTS[client_array_index].UI = json_ui;
    saveDB();
    modal("UI data saved successfully.");
};

function save_config() {
    var message = new Paho.Message(JSON.stringify(localDB));
    message.destinationName = 'webMQTT/' + broker_connection["broker_username"] + '/settings';
    message.retained = true;
    client.send(message);
    console.log("Config save to MQTT");
}
// function load_config(message) {
//     localDB_json = JSON.parse(message.payloadString);
//         localDB = localDB_json;
//         saveDB(localDB);
//         console.log("config load from MQTT");
// }

//UI Add element function
function ui_add_element(ui_node){
    var html = `
      <div id="grid-snap_`+ui_node.id+`" data-node-id="`+ui_node.id+`" class="ui_div" style="position:absolute;">`;

    switch(ui_node.type){
        case "button":
            html += `<button class="btn ui_button btn-block btn-primary" type="button" style="width:200px; " data-node-id="`+ui_node.id+`">`+ui_node.text+`</button>`
            break;

        case "label":
            html +=`<div style="color:#`+ui_node.color+`">`+ ui_node.text +`</div>`;
            break;

        case "html":
            html += ui_node.html;
            break;

        case "switch":
            html += `<label class="switch switch-label switch-pill switch-primary">
           <input id="switch_`+ui_node.id+`"" class="ui_switch switch-input" type="checkbox" data-node-id="`+ui_node.id+`">
           <span class="switch-slider" data-checked="On" data-unchecked="Off"></span>
          </label>`
            break;

        case "textVal":
            html += ui_node.text +`
           <div id="textVal_`+ui_node.id+`" data-node-id="`+ui_node.id+`"></div>`
            break;

        case "checkbox":
            html += `<div class="round">
            <input id="checkbox_`+ui_node.id+`"" class="ui_checkbox" type="checkbox" data-node-id="`+ui_node.id+`">
            <label id="checkbox_label_`+ui_node.id+`"" for="checkbox_`+ui_node.id+`""></label>
            </div>`
            break;

        case "input_text":
            html += `<div style="width:200px;">
           
              <input  data-node-id="`+ui_node.id+`" class="form-control input_text" type="text" placeholder="Input text and press enter">
            
            </div>`

            break;

        case "slider":
            html += `
              <input id="slider_`+ui_node.id+`" type="range" class="slider ui_slider" min="`+ui_node.value_min+`" max="`+ui_node.value_max+`" data-node-id="`+ui_node.id+`"></input>`;
            break;

        case "colorpicker":
            html += `
            <input id="colorpicker_`+ui_node.id+`" class="jscolor ui_colorpicker" data-node-id="`+ui_node.id+`">`;

            break;

        case "gauge":
            html += `<div id="gauge_`+ui_node.id+`" class="gauge"></div>`;
            break;

        case "chart":
            html += `<canvas id="chart_`+ui_node.id+`" style="display: block; width: 500px; height: 300px;" width="500" height="300" class="chartjs-render-monitor"></canvas>`;
            break;

        default:
            console.log("[ERROR] ui_node.type not found: " + ui_node.type);
            break;
    }


    html += `<div class="ui_div_helper btn-group float-right">
                <div class="mqtt_path">`+ui_node.path+`</div>
              <button class="btn btn-transparent btn_edit_ui_node" data-node-id="`+ui_node.id+`" data-toggle="modal" data-target="#modal_add_new_ui_node"aria-haspopup="true" aria-expanded="false">
                <i class="icon-settings"></i>
              </button>
              <button class="btn btn-transparent btn_delete_ui_node" data-node-id="`+ui_node.id+`" >
                <i class="icon-trash" style="color:red;"></i>
              </button>
            </div>
          </div>
        </div>`;


    $("#client_ui").append(html);


    //activate jscolor
    if(ui_node.type=="colorpicker"){
        var input = document.getElementById("colorpicker_"+ui_node.id);
        var picker = new jscolor(input);
        picker.id= "colorpicker_"+ui_node.id;
        colorpickers.push(picker);
        //var picker = new jscolor($.("#colorpicker_"+ui_node.id));
    }

    //activate gauge
    if(ui_node.type=="gauge"){
        var g = new JustGage({
            id: "gauge_"+ui_node.id,
            value: ui_node.value_max/2,
            min: ui_node.value_min,
            max: ui_node.value_max,
            title: ui_node.text
        });
        gauges.push(g);
    };

    //activate chart

    if(ui_node.type=="chart"){
        var config = {
            type: 'line',

            options: {

                responsive: true,
                title: {
                    display: true,
                    text: ui_node.text
                },
                tooltips: {
                    mode: 'index',
                    intersect: false,
                },
                hover: {
                    mode: 'nearest',
                    intersect: true
                },
                scales: {
                    xAxes: [{
                        display: true,
                        scaleLabel: {
                            display: true,
                            labelString: 'Time'
                        }
                    }],
                    yAxes: [{
                        type: "linear", // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
                        display: true,
                        position: "left",
                        id: "y-axis-1",
                        ticks: {
                            min: ui_node.value_min,
                            max: ui_node.value_max
                        }
                    }],
                }
            }
        };

        var ctx = document.getElementById('chart_'+ui_node.id).getContext('2d');
        //console.log(ctx);
        ctx = new Chart(ctx, config);
        ctx.id = "chart_"+ui_node.id;

        charts.push(ctx);

        //Add dateset test
        var Dataset = {
            label: ui_node.text,
            data: [],
            fill: false,
            backgroundColor: "black"
        };

        config.data.datasets.push(Dataset);


        ctx.update();
    }

    //Subscribe to path if client is connected
    if(ui_node.path != null && typeof(client) !== "undefined"){
        if(client.isConnected()){
            client.subscribe(ui_node.path);
        }
    }


    var element = document.getElementById('grid-snap_'+ui_node.id);

    var x = ui_node.pos_x; var y =ui_node.pos_y;
    var sizx = ui_node.size_x; var sizy =ui_node.size_y;

    element.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
    element.style.width = sizx;
    element.style.height = sizy;

    interact(element)
        .resizable({
            // resize from all edges and corners
            edges: { right: true, bottom: true },

            listeners: {
                move (event) {
                    var target = event.target
                    var sizx = target.style.width
                    var sizy = target.style.height

                    // update the element's style
                    target.style.width = event.rect.width + 'px'
                    target.style.height = event.rect.height + 'px'

                    var node_id = $(event.target).data('node-id');
                    console.log(node_id);
                    $.each(json_ui.nodes, function(){
                        if(this.id == node_id){
                            console.log(this);
                            this.size_x = sizx;
                            this.size_y = sizy;
                        }
                    });
                    save_ui();
                }
            },
            modifiers: [
                // keep the edges inside the parent
                interact.modifiers.restrictEdges({
                    outer: 'parent'
                }),

                // minimum size
                interact.modifiers.restrictSize({
                    min: { width: 100, height: 50 }
                })
            ],

            inertia: true
        })
        .draggable({
            modifiers: [
                interact.modifiers.snap({
                    targets: [
                        interact.createSnapGrid({ x: 2, y:2 }) //ugrások száma
                    ],
                    range: Infinity,
                    relativePoints: [ { x: 0, y: 0 } ]
                }),
                interact.modifiers.restrict({
                    restriction: element.parentNode,
                    elementRect: { top: 0, left: 0, bottom: 1, right: 1},
                    endOnly: true
                })
            ],
            inertia: true
        })
        .on('dragmove', function (event) {
            x += event.dx
            y += event.dy
            console.log(event.target);
            event.target.style.webkitTransform =
                event.target.style.transform =
                    'translate(' + x + 'px, ' + y + 'px)'
            console.log(x);
            console.log(y);
            //save new position
            var node_id = $(event.target).data('node-id');
            console.log(node_id);
            $.each(json_ui.nodes, function(){
                if(this.id == node_id){
                    console.log(this);
                    this.pos_x = x;
                    this.pos_y = y;
                }
            });
            save_ui();


        });

    $(document).on("mouseenter", "#grid-snap_" + ui_node.id, function(){
        if(ui_edit_enabled) {
            $("#grid-snap_" + ui_node.id + " .ui_div_helper").css("display", "inherit");
        }
    });
    $(document).on("mouseleave", "#grid-snap_" + ui_node.id, function(){
        if(ui_edit_enabled) {
            $("#grid-snap_" + ui_node.id + " .ui_div_helper").css("display", "none");
        }
    });


}

var broker_connection = localDB.CLIENTS[client_array_index].BROKER_CONNECTION;


//save broker_connection data to local storage
function save_broker_connection(){
    var broker_connection_object = {};
    $.each($("#form_broker_connection").serializeArray(), function(_, kv) {
        if(kv.name == "broker_cleansession" || kv.name == "broker_useSSL" || kv.name == "broker_lwat_retain"){
            if(kv.value == "on"){
                kv.value = true;
            }
        }
        broker_connection_object[kv.name] = kv.value;
    });
    localDB.CLIENTS[client_array_index].BROKER_CONNECTION = broker_connection_object;
    broker_connection = broker_connection_object;
    saveDB();
    modal("Broker connnection data saved successfully.");
}



$(window).on("load", function() {
    setTimeout(function () {
        console.log("ready!");
        if($(".auto_connect").is(':checked')){
            connect();
            $("#btn_broker_disconnectBr").css("display","inline-block");
        }
        if(window.innerWidth <= 600){
            $(".ui_div").removeAttr("style");
            $(".ui_div").attr("style", "height: 250px; width:250px");
        }
    }, 1000);
});

// $(function () {



//remove element from array
function removeNode(array, node_id) {
    $.each(array, function(){
        var ui_node = this;

        if(ui_node.id == node_id){

            var deleted_node_path = this.path;

            var index = array.indexOf(ui_node);
            if (index > -1) {
                array.splice(index, 1);
            }

            var message_nodes = array.filter(function(ui_node) {//Are there any nodes in the same path remaining?
                return ui_node.path == deleted_node_path;
            });
            if(message_nodes.length == 0 && this.path != null && typeof(client) !== "undefined"){//If no, then unsubscribe from this path
                if(client.isConnected()){
                    client.unsubscribe(ui_node.path);
                }
            }


        }
    });
    save_ui();
    modal("UI node removed successfully.");
}








$(document).on("mouseover", ".ui_div", function(){
    if(ui_edit_enabled){
        var topZ = 0;
        $('.ui_div').each(function(){
            var thisZ = parseInt($(this).css('z-index'), 10);
            $(this).css("opacity", ".5");
            if (thisZ > topZ){
                topZ = thisZ;
            }
        });
        $(this).css('z-index', topZ+1);
        $(this).css("opacity", ".9");
    }


});


$(document).on("mouseleave", ".ui_div", function(){
    $('.ui_div').each(function(){
        $(this).css("opacity", "1");
    });
});

$(document).on("click", "#btn_toggle_config", function(event){
    event.preventDefault();
    if(!ui_edit_enabled){
        $.each($(".ui_div"), function(){
            interact(this).draggable(true);
            interact(this).resizable(true);
            $(this).css("background-color", "#ffffff");
        });

        $("#client_ui").css("background-color", "#1985ac");
        $("#client_ui").css("background-image", "linear-gradient(white 2px, transparent 2px), linear-gradient(90deg, white 2px, transparent 2px), linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)");
        $("#client_ui").css("background-size", "100px 100px, 100px 100px, 20px 20px, 20px 20px");
        $("#client_ui").css("background-position", "-2px -2px, -2px -2px, -1px -1px, -1px -1px");


        ui_edit_enabled = true;
        modal("UI nodes configuration enabled");
    }else{
        $.each($(".ui_div"), function(){
            interact(this).draggable(false);
            interact(this).resizable(false);
            $(this).css("background-color", "#ffffff");

        });
        $(".ui_div_helper").css("display", "none");

        $("#client_ui").css("background-color", "white");
        $("#client_ui").css("background-image", "");
        $("#client_ui").css("background-size", "");
        $("#client_ui").css("background-position", "");
        ui_edit_enabled = false;
        modal("UI nodes configuration disabled");
    }


    $(".ui_div").css("background", "#ffffff");
    //$(".ui_div_helper").css("display", "none")
});

$(document).on("click", "#btn_broker_connectBr", function(){
    save_broker_connection();//Save broker connection data and reload it to broker connection object
    connect();
});
$(document).on("click", "#btn_broker_connect", function(){
    save_broker_connection();//Save broker connection data and reload it to broker connection object
    connect();
});






//Form Add ui element or edit value
$(document).on("submit", ".form_add_ui_element", function(event){
    console.log(event);
    event.preventDefault();

    var formdata = $(this).serializeArray();
    console.log(formdata);
    console.log(form_ui_node_mode);
    switch (form_ui_node_mode){
        case "new": //New node
            var new_node = {};
            new_node.id = create_UUID();
            new_node.pos_x =0;
            new_node.pos_y =0;


            $.each(formdata, function(){
                console.log(this);
                if (!isNaN(this.value)) { //check if value is convertible to number
                    new_node[this.name] = Number(this.value);
                } else {
                    new_node[this.name] = this.value;
                }

            });
            console.log(new_node);
            //console.log(JSON.stringify($(this).serializeArray()));
            json_ui.nodes.push(new_node);
            ui_add_element(new_node);
            if(!ui_edit_enabled){
                $("#btn_toggle_config").trigger("click"); //Enable ui_config
            }else{
                $("#btn_toggle_config").trigger("click"); //Re-enable ui_config
                $("#btn_toggle_config").trigger("click");
            }
            modal("New UI node added successfully");
            break;
        case "edit":
            console.log("edit node");
            node_id = selected_node_id;
            var path_original; //ui node original path to check if it's changed
            //módosítani a json_ui.nodes tartalmát és elmenteni azt
            $.each(json_ui.nodes, function(index){
                var ui_node = this;
                if(ui_node.id == node_id){
                    path_original = ui_node.path; //ui node original path to check if it's changed
                    //Check if path changed
                    if(typeof(client) !== "undefined" && typeof(path_original) !== "undefined" && path_original != $("#tab_add_"+ui_node.type).find("input[name=path]").val() ){
                        //Subscribe to new path
                        client.subscribe($("#tab_add_"+ui_node.type).find("input[name=path]").val());


                    }
                    $.each(json_ui.nodes[index], function(name, value){
                        switch(ui_node.type){
                            case "html":
                                console.log(json_ui.nodes[index]);
                                json_ui.nodes[index].html = $("#html").val();
                                break;

                            default:
                                var input = $("#tab_add_"+ui_node.type).find("input[name="+name+"]");
                                console.log(input);
                                if(input.length>0){ //Only change that key where input is found
                                    if (!isNaN(  $("#tab_add_"+ui_node.type).find("input[name="+name+"]").val())) { //check if value is convertible to number
                                        json_ui.nodes[index][name] = Number($("#tab_add_"+ui_node.type).find("input[name="+name+"]").val());
                                    } else {
                                        json_ui.nodes[index][name] = $("#tab_add_"+ui_node.type).find("input[name="+name+"]").val();
                                    }
                                }
                                break;
                        }


                        //Unsubscribe if no other node subscribed to this path
                        var message_nodes = json_ui.nodes.filter(function(ui_node) {//Are there any nodes in the same path remaining?
                            return ui_node.path == path_original;
                        });
                        if(message_nodes.length == 0 && typeof(client) !== "undefined"){//If no, then unsubscribe from this path
                            if(client.isConnected()){
                                console.log("no other node left, unsubscribe of original path");
                                client.unsubscribe(path_original);
                            }
                        }


                    });
                    //console.log(json_ui.nodes[index]);
                    //újrarenderelni az elemet
                    $("#grid-snap_"+ui_node.id).remove();
                    ui_add_element(json_ui.nodes[index]);

                    //ha az útvonal változott feliratkozni az új útvonalra
                    //Todo leiratkozni, ha más elem nincs az előző útvonalon
                }
                modal("UI node edited successfully");
            });
            $(".ui_div").css("background-color", "#ffffff");
            break;
    }



    save_ui(); // Save the UI
    $(".btn_modal_close").click();
});

//Delete button
$(document).on("click", "#btn_saveTo_MQTT", function(){
    save_config();
});

$(document).on("click", "#btn_loadFrom_MQTT", function(){
    load_config();
});

//Delete button
$(document).on("click", ".btn_delete_ui_node", function(){
    var node_id = $(this).data("node-id");
    removeNode(json_ui.nodes, node_id);
    $("#grid-snap_"+node_id).remove();
});


//Button
$(document).on("click", ".ui_button", function(){
    var node_id = $(this).data("node-id");
    var message_nodes = json_ui.nodes.filter(function(ui_node) {
        return ui_node.id == node_id;
    });
    //console.log(message_nodes);
    $.each(message_nodes, function(){

        var ui_node = this;

        if(ui_node.type=="button"){
            var message = new Paho.Message(ui_node.message);
            message.destinationName = ui_node.path;
            client.send(message);
        }
    });
    modal("Button: Message sent");
});

//Input
$(document).on("keypress", ".input_text", function(e){
    if (e.which == 13) {
        var node_id = $(this).data("node-id");
        var input_message = $(this).val();
        var message_nodes = json_ui.nodes.filter(function(ui_node) {
            return ui_node.id == node_id;
        });
        //console.log(message_nodes);
        $.each(message_nodes, function(){

            var ui_node = this;

            if(ui_node.type=="input_text"){
                var message = new Paho.Message(input_message);
                message.destinationName = ui_node.path;
                client.send(message);
            }
        });
    }
    modal("Input Text: Message sent");
});

//Switch
$(document).on("change", ".ui_switch", function(){
    var checkbox = $(this);
    var node_id = $(this).data("node-id");
    var message_nodes = json_ui.nodes.filter(function(ui_node) {
        return ui_node.id == node_id;
    });
    //console.log(message_nodes);
    $.each(message_nodes, function(){

        var ui_node = this;

        if(ui_node.type=="switch"){
            if($(checkbox).is(":checked")){
                var message = new Paho.Message(ui_node.message_on);
                message.destinationName = ui_node.path;
                client.send(message);
            }else{
                var message = new Paho.Message(ui_node.message_off);
                message.destinationName = ui_node.path;
                client.send(message);
            }
        }
    });
    modal("Switch: Message sent");
});

//Checkbox
$(document).on("change", ".ui_checkbox", function(){
    var checkbox = $(this);
    var node_id = $(this).data("node-id");
    var message_nodes = json_ui.nodes.filter(function(ui_node) {
        return ui_node.id == node_id;
    });
    //console.log(message_nodes);
    $.each(message_nodes, function(){

        var ui_node = this;

        if(ui_node.type=="checkbox"){
            if($(checkbox).is(":checked")){
                $("#checkbox_label_"+ui_node.id).css("background-color", "#"+ui_node.color);
                $("#checkbox_label_"+ui_node.id).css("border-color", "#"+ui_node.color);
                var message = new Paho.Message(ui_node.message_on);
                message.destinationName = ui_node.path;
                client.send(message);
            }else{
                $("#checkbox_label_"+ui_node.id).css("background-color", "#fff");
                $("#checkbox_label_"+ui_node.id).css("border-color", "#ffffff");
                var message = new Paho.Message(ui_node.message_off);
                message.destinationName = ui_node.path;
                client.send(message);
            }
        }
    });
    modal("Switch: Message sent");
});

//colorpicker
$(document).on("change", ".ui_colorpicker", function(){
    var colorpicker = $(this);
    var node_id = $(this).data("node-id");
    var message_nodes = json_ui.nodes.filter(function(ui_node) {
        return ui_node.id == node_id;
    });
    $.each(message_nodes, function(){
        var ui_node = this;
        var message =  new Paho.Message("#"+$(colorpicker).val());
        message.destinationName = ui_node.path;
        client.send(message);
    });
    modal("Color Picker: Message sent");
});

//slider
$(document).on("change", ".ui_slider", function(){
    var slider = $(this);
    var node_id = $(this).data("node-id");
    var message_nodes = json_ui.nodes.filter(function(ui_node) {
        return ui_node.id == node_id;
    });
    $.each(message_nodes, function(){
        var ui_node = this;
        var message =  new Paho.Message($(slider).val());
        message.destinationName = ui_node.path;
        client.send(message);
    });
    modal("Slider: Message sent");
});

function reloadUI() {
    $("#client_ui").html("");
    $.each(localDB.CLIENTS[client_array_index].UI.nodes, function(x, y) {
        ui_style = this;
        htmlVal = this.html;
        ui_edit_enabled = false;
        ui_add_element(ui_style);

        $.each($(".ui_div"), function(){
            interact(this).draggable(false);
            interact(this).resizable(false);
        });

        if(window.innerWidth <= 600){
            $(".ui_div").removeAttr("style");
            $(".ui_div").attr("style", "height: 250px; width:250px");
        }

        // $.each($(".ui_div"), function () {
        //     var node_id = $(this).data('node-id');
        //     if(ui_style.id == node_id) {
        //         $(this).css("transform", 'translate(' + x + 'px, ' + y + 'px)');
        //         // $("#client_ui").html("");
        //         // ui_add_element(ui_style);
        //     }
        // });
    });
};

// $( document ).ready(function() {
//     console.log( "document loaded" );
// });
//
// $( window ).on( "load", function() {
//     console.log( "window loaded" );
// });
// });
