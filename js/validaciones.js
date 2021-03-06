/**
 * Contiene todas las funciones validacion del formulario de alta
 *
 * @author      Nicolas Lound <nicolas.lound@gmail.com>
 * @license     MIT
 * @link        https://github.com/gcba/mapa-emprendedores
 * @version     0.1
 *
 */

/**
 * @abstract    validacion de formulario
 * @param       int
 */
function validoPaso(nro) {
    $('*').removeClass("alert-danger");

    var pantallaValidada = new Array();
    var dato;
    var actualidad = new Date().getFullYear();
    if (nro === 1) {
        dato = $("#nombre_frm").val();
        if (dato.length > 1 && dato.length <= 30) {
            pantallaValidada.push(true);
        } else {
            pantallaValidada.push(false);
            $('#nombre_frm').addClass("alert-danger");
        }
        dato = $("#desc_frm").val();
        if (dato.length > 10 && dato.length < 300) { //para que no se escriban la biblia lo limitamos
            pantallaValidada.push(true);
        } else {
            pantallaValidada.push(false);
            $('#desc_frm').addClass("alert-danger");
        }
        //dato  = $("#serv_frm").val();
        //if (dato.length > 2)  { pantallaValidada.push(true); } else {pantallaValidada.push(false);}
        dato = parseInt($("#acti_frm").val());
        if (dato > 1900 && dato <= actualidad) {
            pantallaValidada.push(true);
        } else {
            $('#acti_frm').addClass("alert-danger");
            console.log("no valida");
            pantallaValidada.push(false);
        }
        //dato  = $("#tags_frm").val();
        //if (dato.length > 2)  { pantallaValidada.push(true); } else {pantallaValidada.push(false);}
        dato = $("#tipo_frm").val();
        if (dato != "Seleccione") {
            pantallaValidada.push(true);
        } else {
            pantallaValidada.push(false);
            $('#tipo_frm').addClass("alert-danger");
        }
        dato = $("#sector_frm").val();
        if (dato != "Seleccione") {
            pantallaValidada.push(true);
        } else {
            pantallaValidada.push(false);
            $('#sector_frm').addClass("alert-danger");
        }
        validarFormulario(pantallaValidada, "#paso1");
    }

    if (nro === 2) {
        dato = $("#latlon_frm").val();
        if (dato.length != "") {
            pantallaValidada.push(true);
        } else {
            pantallaValidada.push(false);
            $('#direccion_frm').addClass("alert-danger");
        }
        validarFormulario(pantallaValidada, "#paso2");
    }

    if (nro === 3) {
        dato = $("#mailIns_frm").val();
        if (validarEmail(dato)) {
            pantallaValidada.push(true);
        } else {
            pantallaValidada.push(false);
            $('#mailIns_frm').addClass("alert-danger");
        }
        dato = $("#mailRes_frm").val();
        if (validarEmail(dato)) {
            pantallaValidada.push(true);
        } else {
            pantallaValidada.push(false);
            $('#mailRes_frm').addClass("alert-danger");
        }

        dato = $("#resp_frm").val();
        if (dato.length != "") {
            pantallaValidada.push(true);
        } else {
            pantallaValidada.push(false);
            $('#resp_frm').addClass("alert-danger");
        }
        dato = $("#mailRes_frm").val();
        if (dato.length != "") {
            pantallaValidada.push(true);
        } else {
            pantallaValidada.push(false);
            $('#mailRes_frm').addClass("alert-danger");
        }


        validarFormulario(pantallaValidada, "#paso3");
        nuevoCaptcha();
    }
}

/**
 * @abstract    avanza en el formulario una vez validados los datos
 * @param       array[boolean] ; string
 */

function validarFormulario(validacion, paso) {

    if (validacion.indexOf(false) < 0) {
        switch (paso) {
            case "#paso1":
                siguienteFormulario('#paso2', '#paso1')
                google.maps.event.trigger(minimapa, 'resize');
                break;
            case "#paso2":
                siguienteFormulario('#paso3', '#paso2')
                break;
            case "#paso3":
                siguienteFormulario('#paso4', '#paso3')
                break;
        }
    } else {
        $(".aviso").attr("style", "display:inline");
    }
}

/**
 * @abstract    valida que sea un mail válido [TRUE|FALSE]
 * @param       string
 */
function validarEmail(mailCheck) {
    if (mailCheck === "") {
        return true;
    } else {
        var expr = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        return mailCheck.match(expr)
    }

}

/**
 * @abstract    avanza en el formulario una vez validados los datos
 */
function buscarDireccion() {
    google.maps.event.trigger(minimapa, 'resize');
    var direccion = document.getElementById('direccion_frm').value;
    geocoder.geocode({
        'address': direccion
    }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            minimapa.setCenter(results[0].geometry.location);
            var marker = new google.maps.Marker({
                map: minimapa,
                position: results[0].geometry.location
            });
            $("#latlon_frm").val(marker.position.lng() + "," + marker.position.lat());
            $("#lat_frm").val(marker.position.lat());
            $("#lon_frm").val(marker.position.lng());
        } else {
            console.log('No se pudo geocodificar la direccion. Error : ' + status);
        }
    });
}
