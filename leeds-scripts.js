/* TODO system logowania i wylogowania*/
var url_base;
/*sprawdzanie autoryzacji*/


function check_authorization() {
    /*za kazdym razem przy przeladowaniu  pinguje strone i sprawdza w sesji czy jestem zalogowany*/
    $.ajax({
        url: "http://system.fastdata.com.pl:4567/framework/standalone/leadinfo",
        type: "GET",
        data: {},
        dataType: "text xml",
        complete: function (xhr, textStatus) {
            console.log(xhr.status);
            /*jak w sesji jestme zalogowany to wyswietla dane*/
            if (xhr.status == 200) {
                $("#login").css('display', "none");
                $("#leeds-content").css("display", "block");
                init_load();
            }
            else {
                $("#username,#password,#modal-title,#modal-content,#main-content ").empty();
                $("#login").css('display', "block");
                $("#leeds-content").css("display", "none");

            }
        }
    });
}


/*logout*/
function log_out() {
    $.ajax("http://a:a@system.fastdata.com.pl:4567/framework/rin/leady?",
        {
            /*wylogowuwyje i czyszczcze dane*/
            statusCode: {
                401: function () {
                    $("#username,#password,#modal-title,#modal-content,#main-content ").empty();
                    $("#password").empty();
                    $("#login").collapse('show');
                    $("#login").css("display", "block");
                    $("#leeds-content").css("display", "none");
                    location.reload();
                }
            }
        });
}


/*inicjalne pobranie danych*/
function init_load() {
    /*gif doładowywania glownych leadow */
    $("#new-leads").append(' <div style="text-align: center; padding-top: 15px;"><img src="leadinfo/ajax-loader.gif" ></div>');
    /*pobieranie szablonow email*/
    $.ajax({
        type: 'GET',
        url: "http://system.fastdata.com.pl:4567/framework/rin/EML_DEF?rodzaj=L",
        processData: true,
        data: {},
        crossDomain: true,
        dataType: "json",
        success: function (data) {
            $("#email-content-select").empty();
            window.email_template = data.results;
            for (var i = 0; i < data.results.length; i++) {
                var select_id = "template-select-" + i;
                var selector = '<option  id=' + select_id + '>' + window.email_template[i].NAZWA + '</option>';
                $("#email-content-select").append(selector);
            }
        }
    });
    /* pobieranie usera oraz stopki*/
    $.ajax({
        type: 'GET',
        url: "http://system.fastdata.com.pl:4567/framework/rin/usr_ja",
        processData: true,
        data: {},
        crossDomain: true,
        dataType: "json",
        success: function (data) {
            console.log('usr', data);
            window.footer = data.results[0].STOPKA_MAIL;
            window.user = data.results[0];
            window.usr_short = window.user.SKROT;
            console.log(window.usr_short);
            get_leads();
        }
    });
}

/*nowa uniwersalna funkcja pobierajaca leedy zaleznie od statusu*/
function get_leads() {
    $.ajax({
        type: 'GET',
        url: "http://system.fastdata.com.pl:4567/framework/rin/mob_leady?",
        processData: true,
        data: {},
        crossDomain: true,
        dataType: "json",
        success: function (data) {
            window.new_leads = $.grep(data.results, function (e) {
                return e.STATUSCODE == "NEW"
            });
            console.log('new', window.new_leads);
            render_leeds(window.new_leads, "new-leads");

            window.open_with = $.grep(data.results, function (e) {
                return e.STATUSCODE == "OPEN" && !e.UPRAWNIENIA_PRACA;
            });
            console.log('open with', window.open_with);
            render_leeds(window.open_with, "open-no-attribution");

            window.my_leeds = $.grep(data.results, function (e) {
                return e.UPRAWNIENIA_PRACA == window.usr_short && e.STATUSCODE == "OPEN";
            });
            console.log('my', window.my_leeds);
            render_leeds(window.my_leeds, "my-leeds");
        }
    });
}

/*funkcja wyswietlajaca leedy z podzialem */
function render_leeds(data, destination) {
    /*okreslanie lokalizacji gdzie dodać leeda*/
    switch (destination) {
        case "new-leads":
            var preid = "nl";
            break;
        case "open-no-attribution":
            var preid = "ona";
            break;
        case "my-leeds":
            var preid = "ml";
            break;
    }

    /*czyszczenie i dodawania zawarotsci leedow*/
    $("#" + destination).empty();
    if (data.length == 0) {
        switch (destination) {
            case "new-leads":
                $("#" + destination).append("<td class='status-cell' style='background-color: #FC5151;'><i class='fa fa-exclamation-triangle'></i></td><td>Brak nowych leadow</td>");
                break;
            case "open-no-attribution":
                $("#" + destination).append("<td class='status-cell' style='background-color: #FFFF99;'><i class='fa fa-exclamation-triangle'></i></td><td>Brak otwartch nieprzypisanych leadow</td>");
                break;
            case "my-leeds":
                $("#" + destination).append("<td class='status-cell' style='background-color: #4CAF50;'><i class='fa fa-exclamation-triangle'></i></td><td>Brak twoich otwartych leadow</td>");
                break;
        }
    }
    else {
        for (var i = 0; i < data.length; i++) {
            /*tworzenie wiersza z opcją klikania na niego i wyswietlania info szczeolowych */
            $('<tr>', {id: preid + i}).appendTo('#' + destination);
            $("#" + preid + i).attr("onclick", "get_lead_info(this.id)");
            $("#" + preid + i).attr("data-toggle", "modal");
            $("#" + preid + i).attr("data-target", "#leedsTable");

            /*dodawanie statusu nowy otwary lub mój*/
            switch (destination) {
                case "new-leads":
                    $("#" + preid + i).append("<td class='status-cell' style='background-color: #FC5151;'><i class='fa fa-exclamation-triangle'></i></td>");
                    break;
                case "open-no-attribution":
                    $("#" + preid + i).append("<td class='status-cell' style='background-color: #FFFF99;'><i class='fa fa-exclamation-triangle'></i></td>");
                    break;
                case "my-leeds":
                    $("#" + preid + i).append("<td class='status-cell' style='background-color: #4CAF50;'><i class='fa fa-exclamation-triangle'></i></td>");
                    break;
            }

            /*dodawanie id leada oraz nazwy od kogo  */
            $("#" + preid + i).append("<td >" + data[i].LEADID + "</br><p style=' word-break: break-all;'>" + data[i].FIRSTNAME + " " + data[i].LASTNAME + "</p></td>");

            /*dodawanie kolejnego kroku oraz czasu ktory pozostał*/
            if (data[i].CONTACTDATE && data[i].OPENDATE) {
                $("#" + preid + i).append("<td style='width: 25px !important;' >Zamknięcie</td>");
                $("#" + preid + i).append("<td style='width: 25px !important;'>" + time_difference(data[i].TARGETCLOSEDATE) + "</td>");


            } else if (data[i].OPENDATE && !data[i].CONTACTDATE) {
                $("#" + preid + i).append("<td style='width: 25px !important;'>Kontakt</td>");
                $("#" + preid + i).append("<td style='width: 25px !important;'>" + time_difference(data[i].TARGETCONTACTDATE) + "</td>");

            }
            else if (!data[i].OPENDATE) {
                $("#" + preid + i).append("<td style='width: 25px !important;'>Otwarcie</td>");
                $("#" + preid + i).append("<td style='width: 25px !important;'>" + time_difference(data[i].TARGETOPENDATE) + "</td>");

            }
        }
    }
}

/*funkcja obliczajaca roznice czasowo*/
function time_difference(time_given) {

    var leed_date = time_given;
    leed_date = leed_date.split(/(?:-| |:)+/);
    var lead_time = new Date(leed_date[0], leed_date[1], leed_date[2],
        leed_date[3], leed_date[4], leed_date[5]);
    var current_time = new Date().getTime();
    var diffMs = (lead_time - current_time );
    var diffDays = Math.round(diffMs / 86400000) - 31;
    var diffHrs = Math.round((diffMs % 86400000) / 3600000);
    var diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000);
    if (diffDays != 0) {
        var time_status = diffDays + " dni";
    } else if (diffDays == 0 && diffHrs != 0) {
        var time_status = diffHrs + " godzin";
    } else {
        var time_status = diffMins + " minut";
    }
    return time_status;
}


/*informacje szczegolowe leeda*/
function get_lead_info(this_id) {
    console.log(this_id);
    window.click_id = this_id;


    if (click_id.indexOf("nl") >= 0) {
        var lead_id = this_id.replace("nl", "");
        window.object = window.new_leads[lead_id];
    } else if (click_id.indexOf("ona") >= 0) {
        var lead_id = this_id.replace("ona", "");
        window.object = window.open_with[lead_id];
    } else {
        var lead_id = this_id.replace("ml", "");
        window.object = window.my_leeds[lead_id];
        console.log(lead_id);
    }

    console.log('a', object);
    var status = '';
    var nazwa_leedu = '';

    /*dodawanie naglowku do okna modalnego */
    $("#modal-title").empty();
    if (object.KAMPANIA) {
        var nazwa_leedu = object.KAMPANIA
    }
    if (object.STATUSCODE == "NEW") {
        status = nazwa_leedu + ' (' + object.LEADID + ') - <span style="color: red;">' + "Nowy" + '</span>';
    } else {
        status = nazwa_leedu + ' (' + object.LEADID + ') - <span style="color: orange;">' + "Otwarty";
        if (object.CONTACTDATE) {
            status += ' - skontaktowany</span>';
        } else {
            status += ' - nieskontaktowany</span>';
        }
    }
    $("#modal-title").append(status);

    /*append content to leeds information modal */
    $("#modal-content").empty();
    $("#modal-content").append('<tr><th class="normal-font"><i class="fa fa-bars"></i>  Dane podstawowe </th><th>  </th></tr>');
    if (object.PRZYPISANY) {
        $("#modal-content").append("<tr><td>Przypisany do</td><td> " + object.PRZYPISANY + "</td></tr>");
    }
    if (object.TARGETOPENDATE) {
        $("#modal-content").append("<tr><td>Szacowana data otwarcia</td><td> " + object.TARGETOPENDATE.slice(0, 16) + "</td></tr>");
    }
    if (object.OPENDATE) {
        $("#modal-content").append("<tr><td>Data otwarcia</td><td> " + object.OPENDATE.slice(0, 16) + "</td></tr>");
    }
    if (object.TARGETCONTACTDATE) {
        $("#modal-content").append("<tr><td>Szacowana data kontaktu</td><td> " + object.TARGETCONTACTDATE.slice(0, 16) + "</td></tr>");
    }
    if (object.CONTACTDATE) {
        $("#modal-content").append("<tr><td>Data kontaktu</td><td> " + object.CONTACTDATE.slice(0, 16) + "</td></tr>");
    }
    if (object.TARGETCLOSEDATE) {

        $("#modal-content").append("<tr><td>Szacowana data zamkniecia</td><td> " + object.TARGETCLOSEDATE.slice(0, 16) + "</td></tr>");
    }
    if (object.CLOSEDATE) {
        $("#modal-content").append("<tr><td>Data zamkniecia</td><td> " + object.CLOSEDATE.slice(0, 16) + "</td></tr>");
    }
    if (object.OPIS_KAMPANII) {
        $("#modal-content").append('<tr><th class="normal-font"><i class="fa fa-bars"></i>  Opis </th><th>  </th></tr>');
        $("#modal-content").append("<tr><td>" + object.OPIS_KAMPANII + "</td><tr>  ");
    }

    /* //Dane kontaktowe //*/
    $("#modal-content").append('<tr><th class="normal-font"><i class="fa fa-bars"></i>  Dane kontaktowe </th><th>  </th></tr>');
    /*gif doładowywania danych kontaktowych */
    $("#modal-content").append(' <div id="contact_info_load" class="col-centered" style="text-align: center; padding-top: 15px;"><img src="leadinfo/ajax-loader.gif" ></div>');

    if (object.FIRSTNAME && object.LASTNAME) {
        $("#modal-content").append('<tr><td class="normal-font"><i class="fa fa-user"> </i> ' +
        object.POZDROWIENIE + ' ' + object.FIRSTNAME + ' ' + object.LASTNAME + '</td><td>  </td></tr>');
    }
    var contact_info_link = "http://system.fastdata.com.pl:4567/framework/rin/lead_con/" + object.LEADID;

    /*dodawanie danych kontaktowych*/
    $.getJSON(contact_info_link, function (data) {

        /*usuniecie gifu doladowania*/
        $("#contact_info_load").remove();
        console.log(data);

        /* dodawanie numeru telefonu kom */
        if (data.PHONEMOBILE || data.PHONEHOME) {
            $("#modal-content").append('</tr><tr><td><i class="fa fa-mobile"></i><strong> Numer telefonu</strong></td><td> </td></tr>');

            if (data.PHONEMOBILE) {
                $('<tr>', {id: "numberCell"}).appendTo('#modal-content');
                $("#numberCell").append("<td>" + data.PHONEMOBILE + "</td> ");
                if (window.object.UPRAWNIENIA_PRACA) {
                    var button = '<button><a href="tel:' + data.PHONEMOBILE + '" onclick="mod()" >Zadzwon</a></button>';
                    $("#numberCell").append(button);
                }
            }

            if (data.PHONEHOME) {

                $('<tr>', {id: "numberCell"}).appendTo('#modal-content');
                $("#numberCell").append("<td>" + data.PHONEHOME + "</td> ");
                if (window.object.UPRAWNIENIA_PRACA) {
                    var button = '<button><a href="tel:' + data.PHONEHOME + '" onclick="mod()" >Zadzwon</a></button>';
                    $("#numberCell").append(button);
                }
            }
        }

        /* dodawanie email */
        if (data.EMAIL) {
            window.contact_email = data.EMAIL;
            $("#modal-content").append('<tr><td><i class="fa fa-envelope"></i><strong> Adres email</strong></td><td> </td></tr>');
            $('<tr>', {id: "emailCell"}).appendTo('#modal-content');
            $("#emailCell").append("<td>" + data.EMAIL + "</td> ");
            if (window.object.UPRAWNIENIA_PRACA) {
                $('<button>', {id: 'email'}).appendTo("#emailCell");
                $("#email").attr("data-toggle", "modal");
                $("#email").attr("data-target", "#emailTemplate");
                $("#email").attr("onclick", "get_email_content()");
                $("#email").text("Wyslij wiadomosc");
            }
        }
    });

    /*button przypisania*/
    $("#assign").remove();
    if (!window.object.PRZYPISANY || window.object.STATUSCODE == "NEW") {
        $('<button>', {id: 'assign'}).appendTo("#modal-footer");
        $("#assign").attr("class", "btn btn-default");
        $("#assign").text("Przypisz sobie");
        $("#assign").attr("onclick", "assign()");
        $("#assign-error").css("display", "none");
    }
}

/*wykonanie kontaktu*/
function contact_accomplish() {
    $.ajax({
        async: true,
        crossDomain: true,
        url: "http://system.fastdata.com.pl:4567/framework/ope/LEAD_INBOX_MENU_KONTAKT_WYKONANY",
        method: "POST",
        data: "{\"LEADYLEADID\":" + window.object.LEADID + " }\n"
    }).done(function (response) {
        console.log(response);
        if (response.indexOf("Opportunity does not exist for UserName ") >= 0) {
            console.log("blad");
        } else {
            console.log("pomyslnie sie skontaktowalismy");
            get_lead_info(window.click_id);
            init_load();

        }
    });
}

/* wyswietlanie zawartości template email  */
function get_email_content(data) {
    append_email_content();
    $("#cus-email").val(window.contact_email);
    $("#subject").val(object.KAMPANIA + ' (' + object.LEADID + ')');
}

/*na wybor szablonu dodawanie szablonu do pola tekstowego wraz z  dodaniem stopki*/
function append_email_content() {
    var button_content = $("#email-content-select option:selected").text();
    var email_template = $.grep(window.email_template, function (e) {
        return e.NAZWA == button_content;
    });

    if (email_template[0].TRESC) {
        email_template = email_template[0].TRESC + '\n' + window.footer;
    } else {
        email_template = '\n\n' + window.footer;
    }
    $("#comment").val(email_template);

}

/*wysylanie email*/
function send_email() {
    var emai_content = $("#email-form").serializeArray();
    var email_text = JSON.stringify(emai_content[2].value);
    console.log(email_text);
    email_text = email_text.replace(/\\n/g, "\\n")
        .replace(/\\'/g, "\\'")
        .replace(/\\"/g, '\\"')
        .replace(/\\&/g, "\\&")
        .replace(/\\r/g, "\\r")
        .replace(/\\t/g, "\\t")
        .replace(/\\b/g, "\\b")
        .replace(/\\f/g, "\\f");
    console.log(email_text);

    var settings = {
        "async": true,
        "crossDomain": true,
        "url": "http://system.fastdata.com.pl:4567/framework/ope/MOB_LEAD_MENU_WYSLIJ_EMAIL",
        "method": "POST",
        "data": "{\"recpient\":" + '"' + emai_content[0].value + '"' + ",\"subject\":" + '"' + emai_content[1].value + '"' + ",\"tresc\":" + email_text + "}"
    };

    $.ajax(settings).done(function (response) {
        console.log(response);
        contact_accomplish();
    });
}

function mod() {
    $('#callTemplate').modal('show')
}


/*funkcja przypisania*/
function assign() {
    console.log("assign", window.object.LEADID);

    /*otwieram leeda*/

    $.ajax({
        /*dodaj folder*/
        async: true,
        crossDomain: true,
        url: "http://system.fastdata.com.pl:4567/framework/ope/LEAD_INBOX_MENU_DODAJ_FOLDER",
        method: "POST",
        data: "{\"LEADYLEADID\":" + window.object.LEADID + " }\n",
        success: function (data) {
            $.ajax({
                /*uaktualnij status*/
                async: true,
                crossDomain: true,
                url: "http://system.fastdata.com.pl:4567/framework/ope/LEAD_INBOX_MENU_UAKT_SATUS",
                method: "POST",
                data: "{\"LEADYLEADID\":" + window.object.LEADID + " }\n",
                success: function (data) {
                    console.log("zrobił status");
                    /*przeladowanie*/
                    init_load();
                    get_lead_info(window.click_id);
                }

            }).done(function (response) {
                console.log(response);

            });
        }
    }).done(function (response) {
        console.log(response);

    });

}





