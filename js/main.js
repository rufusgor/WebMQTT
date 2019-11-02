$(function () {

//Android Webview Object.Values fix....
Object.values = (obj) => Object.keys(obj).map(key => obj[key]);

var client;
var gauges = [];
var charts = [];
var colorpickers = [];
var form_ui_node_mode = ""; //edit: edit node; new: new node;
var selected_node_id = "";
var ui_edit_enabled = false;

var json_ui = {};
//Load from local storage
var localDB_json_ui = JSON.parse(localStorage.getItem("json_ui"));
console.log(localDB_json_ui);
if (localDB_json_ui != null){
  json_ui = localDB_json_ui;
}else{
  json_ui = {
    "nodes": []
  }
}

var broker_connection = {};
var localDB_broker_connection = JSON.parse(localStorage.getItem("broker_connection"));
console.log(localDB_broker_connection);
if (localDB_broker_connection != null){
  broker_connection = localDB_broker_connection;
  console.log(broker_connection);
}

//console.log(Object.values(broker_connection));

//populate broker connection form data from broker connection object


$.each(Object.keys(broker_connection), function(index){

  var element = $("#form_broker_connection").find("[name="+this+"]");
  if($(element).is("input")){
    if($(element).prop("type") == "checkbox"){ //checkbox input
      $(element).prop("checked", Object.values(broker_connection)[index]);
    }else{ //text input
      $(element).val(Object.values(broker_connection)[index]);
    }
  }
  
  if($(element).is("select")){//select
    $(element).val(Object.values(broker_connection)[index]);
  }
  //.val(Object.values(broker_connection)[index]);
  
});



//save broker_connection data to local storage
function save_broker_connection(){
  var broker_connection_object = {};
  $.each($("#form_broker_connection").serializeArray(), function(_, kv) {
    if(kv.name == "broker_cleansession" || kv.name == "broker_ssl" || kv.name == "broker_lwat_retain"){
      if(kv.value == "on"){
        kv.value = true;
      }
    }
    broker_connection_object[kv.name] = kv.value;
  });
  localStorage.setItem("broker_connection", JSON.stringify(broker_connection_object));
  broker_connection = broker_connection_object;
}


//save ui_nodes  data to local storage
function save_ui(){
  localStorage.setItem("json_ui", JSON.stringify(json_ui));
  modal("UI data saved successfully.");
};




//generate UUID
function create_UUID(){
  var dt = new Date().getTime();
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = (dt + Math.random()*16)%16 | 0;
      dt = Math.floor(dt/16);
      return (c=='x' ? r :(r&0x3|0x8)).toString(16);
  });
  return uuid;
}

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

//Snackbar-Toast function
function modal(message){
  var x = document.getElementById("snackbar");
  $(x).html(message);
  x.className = "show";
 
  setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
}



$.each(json_ui.nodes, function(){

  var ui_node = this;
  ui_add_element(ui_node);
  $.each($(".ui_div"), function(){
    interact(this).draggable(false);
  });
  $(".ui_div_helper").css("display", "none");
});


//UI Add element function
function ui_add_element(ui_node){
  var html = `
    <div id="grid-snap_`+ui_node.id+`" data-node-id="`+ui_node.id+`" class="ui_div" style="position:absolute;">`;

    switch(ui_node.type){
      case "button":
          html += `<button class="btn ui_button btn-block btn-primary" type="button" style="width:200px; " data-node-id="`+ui_node.id+`">`+ui_node.text+`</button>`
      break;

      case "label":
          html += ui_node.text +`<br>`;
      break;

      case "switch":
          html += `<label class="switch switch-label switch-pill switch-primary">
          <input id="switch_`+ui_node.id+`"" class="ui_switch switch-input" type="checkbox" data-node-id="`+ui_node.id+`">
          <span class="switch-slider" data-checked="On" data-unchecked="Off"></span>
        </label>
        <br>`
      break;

      case "input_text":
          html += `<div style="width:200px;">
         
            <input  data-node-id="`+ui_node.id+`" class="form-control input_text" type="text" placeholder="Input text and press enter">
          
          </div>`

      break;

      case "slider":
          html += `
            <input id="slider_`+ui_node.id+`" type="range" class="slider ui_slider" min="`+ui_node.value_min+`" max="`+ui_node.value_max+`" data-node-id="`+ui_node.id+`"></input>
          <br>`;
      break;

      case "colorpicker":
          html += `
          <input id="colorpicker_`+ui_node.id+`" class="jscolor ui_colorpicker" data-node-id="`+ui_node.id+`">
          <br>`;
          
      break;

      case "gauge":
          html += `<div id="gauge_`+ui_node.id+`" class="200x160px"></div>
          <br>`;
      break;

      case "chart":
          html += `<canvas id="chart_`+ui_node.id+`" style="display: block; width: 500px; height: 300px;" width="500" height="300" class="chartjs-render-monitor"></canvas>
          <br>`;
      break;

      default:
        console.log("[ERROR] ui_node.type not found: " + ui_node.type);
      break;
    }
  
  
  html += `<div class="ui_div_helper btn-group float-right">
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
    console.log(client);
    if(ui_node.path != null && typeof(client) !== "undefined"){
      if(client.isConnected()){
        client.subscribe(ui_node.path);
      }
   }
  

  var element = document.getElementById('grid-snap_'+ui_node.id);

var x = ui_node.pos_x; var y =ui_node.pos_y;

element.style.transform = 'translate(' + x + 'px, ' + y + 'px)';

interact(element)
  .draggable({
    modifiers: [
      interact.modifiers.snap({
        targets: [
          interact.createSnapGrid({ x: 5, y:5 }) //ugrások száma
        ],
        range: Infinity,
        relativePoints: [ { x: 0, y: 0 } ]
      }),
      interact.modifiers.restrict({
        restriction: element.parentNode,
        elementRect: { top: 0, left: 0, bottom: 0, right: 0},
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


$("#btn_toggle_config").on("click", function(){
  if(!ui_edit_enabled){
    $.each($(".ui_div"), function(){
      interact(this).draggable(true);
      $(this).css("background-color", "#c0c0c0");
     
    });
    $(".ui_div_helper").css("display", "");
    ui_edit_enabled = true;
    modal("UI nodes configuration enabled");
  }else{
    $.each($(".ui_div"), function(){
      interact(this).draggable(false);
      $(this).css("background-color", "");
    
    });
    $(".ui_div_helper").css("display", "none")
    ui_edit_enabled = false;
    modal("UI nodes configuration disabled");
  }
    
    
    //$(".ui_div").css("background", "transparent");
    //$(".ui_div_helper").css("display", "none")
});



$("#btn_broker_connect").on("click", function(){

    save_broker_connection();//Save broker connection data and reload it to broker connection object

    client = new Paho.Client(broker_connection["broker_address"], Number(broker_connection["broker_port"]), broker_connection["broker_client_id"]);

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

    if(typeof(broker_connection["broker_ssl"]) !== "undefined"){
      options.useSSL = broker_connection["broker_ssl"];
    }
    options.userName = broker_connection["broker_username"];
    options.password = broker_connection["broker_password"];
    options.willMessage = willmessage;

    client.connect(options);

});

$("#btn_broker_disconnect").on("click", function(){
  client.disconnect();
});

// called when the client connects
function onConnect() {
  // Once a connection has been made, make a subscription and send a message.
  console.log("onConnect");
  modal("Client connected");
  //client.subscribe("rundebugrepeat/test/Temperature");
  

  //Subscribe to the UI node paths
  $.each(json_ui.nodes, function(){

    var ui_node = this;

    if(ui_node.path != null){
      client.subscribe(ui_node.path);
      //console.log("[CLIENT] - Subscribed to path: "+ui_node.path);
    }
  });
  $("#btn_broker_connect").css("display","none");
  $("#btn_broker_disconnect").css("display","");
}

// called when the client loses its connection
function onConnectionLost(responseObject) {
  if (responseObject.errorCode !== 0) {
    console.log("onConnectionLost:"+responseObject.errorMessage);
    modal("Client disconnected: "+responseObject.errorMessag);
  }
  modal("Client disconnected");
  $("#btn_broker_connect").css("display","");
  $("#btn_broker_disconnect").css("display","none");
}

// called when a message arrives
function onMessageArrived(message) {
  console.log("onMessageArrived:"+message.destinationName);
  var message_nodes = json_ui.nodes.filter(function(ui_node) {
    return ui_node.path == message.destinationName;
  });
  console.log(message_nodes);
  $.each(message_nodes, function(){
    console.log(message.payloadString);
    var ui_node = this;
    switch(ui_node.type){
      
      //Switch
      case "switch":
        switch(message.payloadString){
          case ui_node.message_on:
            console.log( $("#switch_"+ui_node.id));
            $("#switch_"+ui_node.id).prop("checked", true);
          break;
          case ui_node.message_off:
              console.log( $("#switch_"+ui_node.id));
              $("#switch_"+ui_node.id).prop("checked", false);
          break;
        }
      break;

      //gauge
      case "gauge":
        console.log(gauges);
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
  $("#btn_add_new_ui_element").on("click", function(){
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
  $(document).on( "click",".btn_edit_ui_node", function(){
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
      $("#tab_add_"+ui_node.type).find("input[name="+this+"]").val(Object.values(ui_node)[index]);
    });
    

  });

  //Form Add ui element or edit value
  $(".form_add_ui_element").on("submit",function(event){
    event.preventDefault();
    var formdata = $(this).serializeArray();

    switch (form_ui_node_mode){
      case "new": //New node
        var new_node = {};
        new_node.id = create_UUID();
        new_node.pos_x =0;
        new_node.pos_y =0;
    
    
        $.each(formdata, function(){
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
              var input = $("#tab_add_"+ui_node.type).find("input[name="+name+"]");
              console.log(input);
              if(input.length>0){ //Only change that key where input is found
                if (!isNaN(  $("#tab_add_"+ui_node.type).find("input[name="+name+"]").val())) { //check if value is convertible to number
                  json_ui.nodes[index][name] = Number($("#tab_add_"+ui_node.type).find("input[name="+name+"]").val());
                } else {
                  json_ui.nodes[index][name] = $("#tab_add_"+ui_node.type).find("input[name="+name+"]").val();
                }
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
    
      break;
    }
   

    save_ui(); // Save the UI 
    $(".btn_modal_close").click();
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
  
});