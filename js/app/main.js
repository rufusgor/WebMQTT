/*Main javascript file
    Main functions
    Sidemenu

*/

/*
localDB
    -CLIENTS
        -Broker
        -ui
    -SETTINGS
*/

//Load from local storage
var localDB = {};
var localDB_json = JSON.parse(localStorage.getItem("localDB"));
if (localDB_json != null){
    localDB = localDB_json;
}else{
    localDB = {
    "CLIENTS": [],
    "SETTINGS":[]
  }
}

console.log(localDB);

//save localDB
function saveDB(){
    localStorage.setItem("localDB", JSON.stringify(localDB));
    
}


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

//Snackbar-Toast function
function modal(message){
    $("#snackbar").html(message);
    $("#snackbar").addClass("show");
   
    setTimeout(function(){ $("#snackbar").removeClass("show"); }, 3000);
}

var params = new URLSearchParams(location.search);
$(function () {


  //Page load
  
switch(params.get('page')){
    case "client":
            $("#main").load("views/client.html", function(){
                loadClient();
            });
        break;
    default:
            $("#main").load("views/home.html");
    break;
}


  

  //Add new Client form submit
  $(".form_add_client").on("submit",function(event){
     
    event.preventDefault();
    var formdata = $(this).serializeArray();
    var new_client = {};
    new_client.id = create_UUID();
    new_client.BROKER_CONNECTION = {} ;
    new_client.UI = {};
    new_client.UI.nodes = [];
    $.each(formdata, function(){
        if (!isNaN(this.value)) { //check if value is convertible to number
            new_client[this.name] = Number(this.value);
        } else {
            new_client[this.name] = this.value;
        }
    });
    localDB.CLIENTS.push(new_client);
    saveDB();
    window.location.reload();

  });

  //Load Client to side menu
  $.each(localDB.CLIENTS, function(){
    
    var client = this;
    $("#sidemenu_client_list").append(`
        <li class="nav-item">
            <a class="nav-link btn_sidemenu_client" href="index.html?page=client&id=`+client.id+`">`+client.name+`
            <span>  <i class="btn_delete_client nav-icon badge icon-trash" style="color:red; display:none;"></i></span></a>
            
        </li>`);
  });

  $(document).on("mouseover", ".btn_sidemenu_client", function(){
    $(this).find(".btn_delete_client").css("display", "");
  });

    $(document).on("mouseleave", ".btn_sidemenu_client", function(){
        $(this).find(".btn_delete_client").css("display", "none");
    });

});