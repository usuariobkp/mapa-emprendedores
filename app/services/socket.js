var CartoDB = require('cartodb');
// api key para conectarme a cartodb
var secret = require('./secrets.js');
var config = require('../config.json');
// import formateador de fecha
var FormatDate = require('./formatdate');

// importo los modelos para guardar en la db
var Nagios = require('../models/nagios');
var Luminarias = require('../models/luminarias');
var Estadisticas = require('../models/festadisticas');
var Report = require('../models/report');
var Informante = require('../models/informantes');

// defino los tipos de intervalos
const unahora = 3600000;
const mediahora = 1800000;
const quincemin = 900000;
const cincomin = 300000;

var calinterval = function(min){
	return min * 60  * 1000
}

const interval = calinterval(config.interval);

// creo el cliente de cartodb
var client = new CartoDB({
	user:secret.user,
	api_key:secret.api_key
});
/*
	las funciones report y save_error
	guardan cualquier error que pueda generar cartodb y lo emite al cliente con socket
*/
var report = function(socket, err){
	//socket.emit("error", err);
	//console.log(err);
	save_err(err);
}
//
var save_err = function(err){
	ErrSave = new Report({
		"type": err,
		"updated_at": new Date()
	}).save()
}
/*
	funcion que recorre cada segmento, por cada segmento recorrido, se efectua un cb que lo guarda en la db
*/
var forEach = function(data, cb){
	len = data.total_rows
	if (len >= 1){
		for (var i = 0;i<len;i++){
			cb(data.rows[i])
		}
	} 
}

var asd = function(err, cb){
	if (err){
		report(socket, err);
	} else {
		cb
	}
}

/*
	modulo que se exporta, se le pasa como parametro socket para emitir data al cliente
	cada un intervalo , se hace una query a la api de cartodb, para extraer los segmentos actualizados

*/

// manejador de resultado al guardar
var lolo = function(error, result, count){
	// console.log(error)
	// if ("[Error: ya existe el objeto]"){
	// 	console.log("lolo")
	// }
	// console.log(result)
	// console.log(count)
}

var getQuery = {
	"puntos_nagios": "SELECT id_nagio, status, updated_at FROM puntos_nagios ",
	"puntos_luminarias" : "SELECT * FROM status_luminarias ",
	"fracciones_estadistica" : "SELECT * FROM fracciones_estadistica  ",
	"status_informantes":"SELECT * FROM status_informantes ",
	"interval": "current_timestamp-interval'60 minute'"
}


var get_informantes = function(){
	client.query(getQuery["status_informantes"] + " WHERE {interval} < updated_at", {interval: getQuery["interval"]}, function(err, data){
		console.log("updated emited puntos informantes");
		asd(err, forEach(data, function(elem){
			InformanteSave = new Informante({
				"cartodb_id" : elem.cartodb_id,
				"descripcion" : FormatDate(elem.descripcion),
				"fecha_actualizacion" : FormatDate(elem.fecha_actualizacion),
				"fecha_alta" : FormatDate(elem.fecha_alta),
				"id_ubicacion" : elem.id_ubicacion,
				"lat" : elem.lat,
				"long" : elem.long,
				"titulo": elem.titulo,
				"ubicacion": elem.ubicacion,
				"ultimo_estado": elem.ultimo_estado,
				"user_id" : elem.user_id,
				"updated_at": FormatDate(elem.updated_at)
			}).save(lolo)
		}))
	});
}


var get_nagios = function(){
	client.query(getQuery["puntos_nagios"] + " WHERE {interval} < updated_at", {interval: getQuery["interval"]}, function(err, data){
		console.log("updated emited puntos nagios");
		asd(err, forEach(data, function(elem){
			NagiosSave = new Nagios({
				"id_nagio":  elem.id_nagio,
				"status": elem.status,
				"updated_at": FormatDate(elem.updated_at),
				"lat":elem.lat,
				"long":elem.long
			}).save(lolo)
		}))
	});
}

var get_festadistica = function(){
	client.query(getQuery["fracciones_estadistica"] + " WHERE {interval} < updated_at", {interval: getQuery["interval"]}, function(err, data){
		console.log("updated emited fracciones estadistica");
		asd(err, forEach(data, function(elem){
			EstadisticasSave = new Estadisticas({
				"cartodb_id" : elem.cartodb_id,
				"cantidad_luminarias": elem.cantidad_luminarias,
				"percentil_edad": elem.percentil_edad,
				"percentil_pisos": elem.percentil_pisos,
				"fraccion_id" : elem.fraccion_id,
				"porcentaje_sin_luz" : elem.porcentaje_sin_luz,
				"puntaje_ranking" : elem.puntaje_ranking,
				"tiempo_sin_luz" : elem.tiempo_sin_luz,
				"updated_at": FormatDate(elem.updated_at)
			}).save(lolo)
		}))
	});
}

var get_luminarias = function(cb){
	console.log("updated emited puntos luminarias");
	client.query(getQuery["puntos_luminarias"] + " WHERE {interval} < updated_at", {interval: getQuery["interval"]}, function(err, data){
		console.log("emit update...")
		asd(err, forEach(data, function(elem){
			LuminariasSave = new Luminarias({
				"id_fraccion" : elem.id_fraccion,
				"status": elem.status,
				"lat":elem.lat,
				"long":elem.long,
				"external_id": elem.external_id,
				"tiempo_sin_luz":elem.tiempo_sin_luz,
				"cartodb_id":  elem.cartodb_id,
				"updated_at": FormatDate(elem.updated_at)
			}).save(lolo)
		}))
		// emite los segmentos traidos de la api de cartodb al cliente
		cb(data)
	});
}


var emit_hr = function(socket){
	var hr = new Date().toLocaleString()
	console.log(hr.toLocaleString())
	socket.emit("time", hr);
}

module.exports = function(io) {
	io.sockets.on('connection', function(socket){
		console.log("lolo connect");
		socket.emit('connected');
		setInterval(function(){
			client.on('connect', function(){
				console.log("algo)")
				get_luminarias(function(data){
					var len = data.rows.length;
					var send = []
					for (var i=0; i<len ;i++){
						var newdata = {};
						if(data.rows[i].status == 0){
							//console.log(data.rows[i])
							newdata['id_fraccion'] = data.rows[i].id_fraccion
							newdata['status'] = data.rows[i].status
							newdata['tiempo_sin_luz'] = data.rows[i].tiempo_sin_luz
							send.push(newdata)
						}
					}
					//console.log(send)
					socket.emit("time", new Date().toLocaleString())
					if (send.length){
						socket.emit("update", send)
					}
				});
				get_informantes();
				get_nagios();
				get_festadistica();
			});
			try {
				client.connect()
				process.on('uncaughtException', function(err){
					report(socket, err)
				})
			} catch (err) {
				//console.log(err);
			}
		}, 4200000);
	})
}
