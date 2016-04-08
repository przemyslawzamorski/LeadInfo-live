/* TODO system logowania i wylogowania*/
var url_base;
window.old_click = 0;
window.click_id = 0;
/*sprawdzanie autoryzacji*/


function check_authorization() {
    /*za kazdym razem przy przeladowaniu  pinguje strone i sprawdza w sesji czy jestem zalogowany*/
    $.ajax({
        url: "/framework/standalone/leadinfo",
        type: "GET",
        data: {},
        dataType: "text xml",
        complete: function (xhr, textStatus) {
            console.log(xhr.status);
            /*jak w sesji jestme zalogowany to wyswietla dane*/
            if (xhr.status == 200) {
                $("#login").css('display', "none");
                $("#leeds-content").css("display", "block");
                load_and_render_page_data();
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
    $.ajax("https://a:a@system.fastdata.com.pl:4567/framework/rin/leady",
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


/*--------------------*/




/*funkcja framework - pobiera okreslony typ danych*/
function get_date_type(type, succesfunction, errorfunction) {
    $.ajax({
        type: 'GET',
        url: "/framework/rin/" + type,
        processData: true,
        data: {},
        crossDomain: true,
        dataType: "json",
        success: function (data) {
            succesfunction(data);
        },
        error: function (data) {
            errorfunction(data);
        }
        /*sprawdzic bez function*/
    });
}

/*podzial leadow po statusie i wywołanie renderowania*/
function leads_divison_and_init_render(leads) {

    $.when(window.new_leads = $.grep(leads, function (e) {
        return e.STATUSCODE == "NEW"
    })).then(function () {
        console.log("Nowe ", window.new_leads);
        render_leeds_in_place(window.new_leads, "new-leads");
    });

    $.when(window.open_with = $.grep(leads, function (e) {
        return e.STATUSCODE == "OPEN" && !e.UPRAWNIENIA_PRACA

    })).then(function (x) {
        console.log("otwarte z ", window.open_with);
        render_leeds_in_place(window.open_with, "open-no-attribution");
    });

    $.when(window.my_leeds = $.grep(leads, function (e) {
        return e.UPRAWNIENIA_PRACA == window.usr_short && e.STATUSCODE == "OPEN"
    })).then(function (x) {
        console.log("moje ", window.my_leeds);
        render_leeds_in_place(window.my_leeds, "my-leeds");
    });
}


/*renderuje leady w okreslonym miejscu*/
function render_leeds_in_place(data, destination) {

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
            $('<tr>', {id: data[i].LEADID}).appendTo('#' + destination);
            $("#" + data[i].LEADID).attr("onclick", "get_lead_info(this.id)");
            $("#" + data[i].LEADID).attr("data-toggle", "modal");
            $("#" + data[i].LEADID).attr("data-target", "#leedsTable");

            /*dodawanie statusu nowy otwary lub mój*/
            switch (destination) {
                case "new-leads":
                    $("#" + data[i].LEADID).append("<td class='status-cell' style='background-color: #FC5151; max-width: 32px !important;'><i class='fa fa-exclamation-triangle'></i></td>");
                    break;
                case "open-no-attribution":
                    $("#" + data[i].LEADID).append("<td class='status-cell' style='background-color: #FFFF99; max-width: 32px !important;'><i class='fa fa-exclamation-triangle'></i></td>");
                    break;
                case "my-leeds":
                    $("#" + data[i].LEADID).append("<td class='status-cell' style='background-color: #4CAF50; max-width: 32px !important;'><i class='fa fa-exclamation-triangle'></i></td>");
                    break;
            }

            /*dodawanie id leada oraz nazwy od kogo  */
            $("#" + data[i].LEADID).append("<td style='width: calc(40vw - 32px ) !important;' >" + data[i].LEADID + "</br><p style=' word-break: break-all;'>" + data[i].FIRSTNAME + " " + data[i].LASTNAME + "</p></td>");

            /*dodawanie kolejnego kroku oraz czasu ktory pozostał*/
            if (data[i].CONTACTDATE && data[i].OPENDATE) {
                $("#" + data[i].LEADID).append("<td style='width: calc(30vw - 32px ) !important;' >Zamknięcie</td>");
                var time = time_difference(data[i].TARGETCLOSEDATE);
                if (time >= 0) {
                    $("#" + data[i].LEADID).append("<td style='width: calc(30vw - 32px ) !important;'>" + time + "</td>");
                } else {
                    $("#" + data[i].LEADID).append("<td class='warning' style='width: calc(30vw - 32px ) !important; padding-left: 0px !important;padding-right: 0px !important;'>" + time + " przekroczono</td>");
                }
            } else if (data[i].OPENDATE && !data[i].CONTACTDATE) {
                $("#" + data[i].LEADID).append("<td style='width: calc(30vw - 32px ) !important;'>Kontakt</td>");
                var time = time_difference(data[i].TARGETCONTACTDATE);
                if (time >= 0) {
                    $("#" + data[i].LEADID).append("<td style='width: calc(30vw - 32px ) !important;'>" + time + "</td>");
                } else {
                    $("#" + data[i].LEADID).append("<td class='warning' style='width: calc(30vw - 32px ) !important; padding-left: 0px !important;;padding-right: 0px !important;'>" + time + " przekroczono</td>");
                }
            }
            else if (!data[i].OPENDATE) {
                $("#" + data[i].LEADID).append("<td style='width: calc(30vw - 32px ) !important;'>Otwarcie</td>");
                var time = time_difference(data[i].TARGETOPENDATE);
                if (time >= 0) {
                    $("#" + data[i].LEADID).append("<td style='width: calc(30vw - 32px ) !important;'>" + time + "</td>");
                } else {
                    $("#" + data[i].LEADID).append("<td class='warning' style='width: calc(30vw - 32px ) !important; padding-left: 0px !important;;padding-right: 0px !important;'>" + time + " przekroczono</td>");
                }

            }
            /*dodawanie aktywnosci lini*/
            if (window.old_click == data[i].LEADID) $("#" + window.old_click).addClass("active-line");
        }
    }
}

/*funkcja framework -  obliczajaca roznice czasowo*/
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
    $("#" + window.old_click).removeClass("active-line");
    window.click_id = this_id;
    window.old_click = window.click_id;
    $("#" + window.click_id).addClass("active-line");
    console.log(this_id);

    var single_lead = $.grep(window.new_leads, function (e) {
        return e.LEADID == this_id;
    });
    if (single_lead.length != 0) window.object = single_lead[0];

    single_lead = $.grep(window.open_with, function (e) {
        return e.LEADID == this_id;
    });
    if (single_lead.length != 0) window.object = single_lead[0];


    single_lead = $.grep(window.my_leeds, function (e) {
        return e.LEADID == this_id;
    });
    if (single_lead.length != 0) window.object = single_lead[0];


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
    $("#contact_info_load").remove();
    $("#modal-content").append(' <div id="contact_info_load" class="col-centered" style="text-align: center; padding-top: 15px;"><img src="leadinfo/ajax-loader.gif" ></div>');

    if (object.FIRSTNAME && object.LASTNAME) {
        $("#modal-content").append('<tr><td class="normal-font"><i class="fa fa-user"> </i> ' +
        object.POZDROWIENIE + ' ' + object.FIRSTNAME + ' ' + object.LASTNAME + '</td><td>  </td></tr>');
    }
    var contact_info_link = "/framework/rin/lead_con/" + object.LEADID;

    /*dodawanie danych kontaktowych*/
    $.getJSON(contact_info_link, function (data) {

        /*usuniecie gifu doladowania*/
        $("#contact_info_load").css("display", "None");
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
        $("#assign").attr("onclick", "assign_lead()");
        $("#assign-error").css("display", "none");
    }
}

/*funkcja framework - wykonuje operacje z podanymi danymi typu data: "{\"LEADYLEADID\":" + window.object.LEADID + " }\n" */
function execute_given_operation(operation, operation_data, succes_function, error_function) {
    $.ajax({
        async: true,
        crossDomain: true,
        url: "/framework/ope/" + operation,
        method: "POST",
        data: operation_data,
        success: function (data) {
            succes_function;
        },
        error: function (data) {
            error_function(data);
        }
        /*bez funkcja data*/
    });
}


/* To refactor ---------------------*/

/* wyswietlanie zawartości template email  */
function get_email_content() {
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
/* To refactor ---------------------*/


function mod() {
    $('#callTemplate').modal('show')
}


/*--------------------*/






/*funkcja wczytujaca wszystkie dane na strone:  usr , template email */
function load_and_render_page_data() {
    $("#new-leads").append(' <div style="text-align: center; padding-top: 15px;"><img src="leadinfo/ajax-loader.gif" ></div>');

    /*pobieram dane templetek email*/
    get_date_type("EML_DEF?rodzaj=L", function (data) {
            $("#email-content-select").empty();
            window.email_template = data.results;
            for (var i = 0; i < data.results.length; i++) {
                var select_id = "template-select-" + i;
                var selector = '<option  id=' + select_id + '>' + window.email_template[i].NAZWA + '</option>';
                $("#email-content-select").append(selector);

            }

        }
        , function () {
            console.log("nie mozna zaladowac email templates");
        });

    /*pobieram dane usera*/
    get_date_type("usr_ja", function (data) {
        console.log('usr', data);
        window.footer = data.results[0].STOPKA_MAIL;
        window.user = data.results[0];
        window.usr_short = window.user.SKROT;
        console.log(window.usr_short);
    }, function () {
        console.log("nie mozna zaladowac daych usera");
    });

    /*pobieram dane leady i wyswietla na ekranie */
    get_date_type("mob_leady", function (data) {
        leads_divison_and_init_render(data.results);

    }, function () {
        console.log("nie mozna zaladowac leadow");
    });


}

/*funkcja przeladowywujaca sama tabele leadow*/
function reload_table_leads(succes_function) {
    /*pobieram dane leady i wyswietla na ekranie*/
    get_date_type("mob_leady", function (data) {
        leads_divison_and_init_render(data.results);

    }, function () {
        console.log("nie mozna zaladowac leadow");
    });
}


function send_email() {
     $("#load_assign_gif").css("display", "block");
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

    execute_given_operation("MOB_LEAD_MENU_WYSLIJ_EMAIL",
        "{\"recpient\":" + '"' + emai_content[0].value + '"' + ",\"subject\":" + '"' + emai_content[1].value + '"' + ",\"tresc\":" + email_text + "}",
        contact_accomplish(window.object.LEADID)
        , function () {
            console.log("nie mozna wyslac");
        }
    );
}


/*nowy wykonany kontakt*/
function contact_accomplish(lead_id) {

    $("#load_assign_gif").css("display", "block");
    execute_given_operation("LEAD_INBOX_MENU_KONTAKT_WYKONANY",
        "{\"LEADYLEADID\":" + lead_id + " }\n",

        $.when(reload_table_leads(get_lead_info(window.click_id))).then(function () {
            $("#assign_error").empty();
            $("#load_assign_gif").css("display", "none");
            $("#assign_error").css("display", "block");
            $("#assign_error").append('<div class="alert alert-success"> Pomyślnie skontaktowano sie</div>')
        }),


        function () {
            $("#assign_error").empty();
            $("#load_assign_gif").css("display", "none");
            $("#assign_error").css("display", "block");
            $("#assign_error").append('<div class="alert alert-danger"> Nie mozna wykonac kontaktu.</div>');
            console.log('nie mozna wykonac kontaktu');
        });

}


function assign_lead() {
    $("#load_assign_gif").css("display", "block");

    execute_given_operation("LEAD_INBOX_MENU_DODAJ_FOLDER",
        "{\"LEADYLEADID\":" + window.object.LEADID + " }\n",

        execute_given_operation("LEAD_INBOX_MENU_UAKT_SATUS",
            "{\"LEADYLEADID\":" + window.object.LEADID + " }\n",

            $.when(reload_table_leads(get_lead_info(window.click_id))).then(function () {
                $("#assign_error").empty();
                $("#load_assign_gif").css("display", "none");
                $("#assign_error").css("display", "block");
                $("#assign_error").append('<div class="alert alert-success"> Pomyślnie przypisano lead do Twojego uzytkownika.</div>');
            }),

            function () {
                $("#assign_error").empty();
                $("#load_assign_gif").css("display", "none");
                $("#assign_error").css("display", "block");
                $("#assign_error").append('<div class="alert alert-danger"> Nie mozna uaktualnic statusu.</div>');
                console.log("niemozna wykonac operacji uaktualnienia ");
            })

        , function () {
            $("#assign_error").empty();
            $("#load_assign_gif").css("display", "none");
            $("#assign_error").css("display", "block");
            $("#assign_error").append('<div class="alert alert-danger"> Nie mozna dodac folderu.</div>');
            console.log("nie mozna dodać folderu");
        }
    );
}
