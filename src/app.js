const express = require("express");
const {engine} = require('express-handlebars');
require('dotenv').config()
const app = express();
const bodyParser = require('body-parser')
const Pool = require('pg').Pool
const connectionString = process.env.DATABASE_URL
const tasksRoutes = require('./routes/tasks.js');
/**CSV */
const csv = require('csv-parser')
const fs = require('fs')
var parse = require('csv-parse');
var inputFilePath = "empleados.csv";
const results = [];

/**
 * Modelo
 */
let empleado = require("./modules/empleado");

/**
 * VISTA
 */
app.set('views', __dirname + '/views')
app.engine('.hbs',engine({
  extname: '.hbs'
}));
app.set('view engine', 'hbs');

let cors = require("cors");
app.use(cors());

app.use('/', tasksRoutes);


/**
 * REST
 */
app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)


/**
 * persistencia
 */
const pool = new Pool({
    connectionString,
    ssl:{
      rejectUnauthorized:false
    }
  })

/*
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'Octubre',
  password: '123456',
  port: 5432,  
})*/

let empleados=[]

const readEmpleados =(request,response) =>{
    var n=0;
    var bandera=true;
    try{
        //processRecipients();
        var fs = require("fs");
        // READ CSV INTO STRING
        var data = fs.readFileSync(inputFilePath).toLocaleString();
        // STRING TO ARRAY
        var rows = data.split("\n"); // SPLIT ROWS
        var i=0
        var flag=false;
        rows.forEach((row) => {
            columns = row.split(";"); //SPLIT COLUMNS
            if(flag){
                try{
                    var nuevo = empleado;
                    nuevo.id=parseInt(columns[0],10);
                    nuevo.nombre=columns[1];
                    nuevo.apellido=columns[2];
                    nuevo.meses=parseInt(columns[3],10);
                    nuevo.cargo=columns[4];
                    nuevo.salario=parseFloat(columns[5]);
                    if(validar(nuevo)){
                        empleados.push(nuevo);
                        console.log(nuevo);
                        //insertar en BD.
                    }
                }catch(err){console.log("Fallo tipo de dato");}
            }
            flag=true;
        })

    }catch(err){
        console.log("Fallo al leer CSV");
        bandera=false;
    }
    if(bandera){
        response.json({ Agregacion: 'Exitosa'})
    }
}

function validar(empleado){
    if(
        (empleado.id>0 && empleado.id<1000)
        &&
        (empleado.meses>=0)
        &&
        (
            empleado.cargo=="D"//directivo.
            ||
            empleado.cargo=="M"//Mando medio.
            ||
            empleado.cargo=="N"//Empleado.
        )
        &&
        (empleado.salario>0)
    )
    {
        return true;
    }
    return false;   
}

/**
 * CRUD 
 */
const getUsuario = (request, response) => {
  pool.query('SELECT * FROM usuarios ORDER BY id ASC', (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}

const crearUsuario = (request, response) => {
  //const { nombre,edad,tipo } = request.body
  const nombre = request.body.data.nombre
  const edad = request.body.data.edad
  const tipo = request.body.data.tipo
    
  pool.query('insert into usuarios (nombre,edad,tipo) values ($1, $2, $3)', [nombre,edad,tipo], (error, results) => {
    if (error) {
      throw error
    }
    response.status(201).json({ UsuarioAgregado: 'Ok' })
  })
}

const iniciarSesion = (request, response) => {
  //const email = request.body.data.nombre
  //const password = request.body.data.edad
  pool.query('SELECT * FROM users ORDER BY id ASC', (error, results) => {
    if (error) {
      throw error
    }

    console.log(results.rowCount)
    //for(var i=0, i<results.rowCount )
    results.rows.length
    console.log("lOGEADO")
    response.status(200)
    response.render('datos')
    //response.status(200).json(results.rows)
  })
}

const path = require('path')

app.get('/test', function (req, res) {
  res.json({ Resultado: 'Proyecto COVENANT' })
});

app.get('/', function (req, res) {
  res.render('home');
  //res.sendFile(path.resolve(__dirname,'index.html'))
  //res.sendFile(path.resolve(__dirname,'estilos/body.css'))
  //res.json({ Resultado: 'Taller Despliegue con ' })
});

/**
 * Metodos.
 */
app.get('/usuarios', getUsuario)
app.post('/usuarios', crearUsuario)
app.post('/login', iniciarSesion)
app.get('/empleadosCSV', readEmpleados)

/**
 * Run.
 */
const port = process.env.PORT || 1337;

app.listen(port, () => {
 console.log("El servidor está inicializado en http://localhost:%d", port);
});

app.use((req,res,next)=>{
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,PATCH,DELETE');
  res.setHeader('Access-Control-Allow-Methods','Content-Type','Authorization');
  next(); 
})