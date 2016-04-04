




function log_in() {



    /*jezeli nie to wyswietla panel login w tedy loguje po danych*/
    window.login_data = $("#login_form").serializeArray();
    window.login = login_data[0].value.toUpperCase();
    if (window.login_data[1].value == "" && window.login == "" ){
        window.login = ".";
    }
    $(function () {

        var url = "http://" + window.login + ":" + window.login_data[1].value + "@system.fastdata.com.pl:4567/framework/rin/leady?";
        $.ajax(url,
            {
                statusCode: {
                    401: function () {
                        console.log("nie autoryzowano");
                        $("#login_error").css("display", "block");
                        $("#password").val('');
                        $("#username").val('');


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



