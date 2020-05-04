function loadClient(){

    //init form jscolors
    var jscolor_modal_options = {
        zIndex: 1080
    }
    $.each($(".form_jscolor"), function(){
        var picker = new jscolor(this, jscolor_modal_options);
        picker.value="000000";
    });

    $.each(json_ui.nodes, function(){

        var ui_node = this;

        ui_add_element(ui_node);
        $.each($(".ui_div"), function(){
            interact(this).draggable(false);
            interact(this).resizable(false);
        });
        $(".ui_div_helper").css("display", "none");
    });

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

}