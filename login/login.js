function log_in() {

    window.login_data = $("#login_form").serializeArray();
    window.login = login_data[0].value.toUpperCase();
    if (window.login_data[1].value == "" && window.login == "") {
        window.login = ".";
    }
    $(function () {

        var url = "https://" + window.login + ":" + window.login_data[1].value + "@system.fastdata.com.pl:4567/framework/rin/leady?";
        $.ajax(url,
            {
                beforeSend: load_start(),
                statusCode: {
                    401: function () {
                        console.log("nie autoryzowano");
                        $("#login_error").css("display", "block");
                        $("#password").val('');
                        $("#username").val('');
                        $("#contact_info_load").remove();


                    },
                    200: function () {
                        console.log("autoryzowano");
                        $("#login_error").css("display", "none");
                        $("#leeds-content").load('leadinfo/index.html');

                    }
                }
            });
    });
}

function load_start(){
        $("#login_form").append(' <div id="contact_info_load" class="col-centered" style="text-align: center; padding-top: 15px;"><img src="leadinfo/login/ajax-loader.gif" ></div>');
}


