const express = require("express");
const {engine} = require('express-handlebars');
require('dotenv').config()
const app = express();
const bodyParser = require('body-parser')
const Pool = require('pg').Pool
const connectionString = process.env.DATABASE_URL
const tasksRoutes = require('./routes/tasks.js');
/**
 * Console.Log
 */
 var fs = require('fs'); var util = require('util');
 var log_file = fs.createWriteStream(__dirname + '/node.log', {flags : 'w'});
 var log_stdout = process.stdout;

 console.log = function(d) { //
    log_file.write(util.format(d) + '\n');
    log_stdout.write(util.format(d) + '\n');
   };
/**CSV */
var inputFilePath = "empleados.csv";
/**
 * Modelo
 */
var empleado = require("./modules/empleado");
/**
 * VISTAS
 */
app.set('views', __dirname + '/views')
app.engine('.hbs',engine({extname: '.hbs'}));
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
 * SSL 
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

function Empleado(id,nombre,apellido,meses,cargo,salario){
      this.id=id;
      this.nombre=nombre;
      this.apellido=apellido;
      this.meses=meses;
      this.cargo=cargo;
      this.salario=salario;
}

var totalRegistros
var totalProcesados
var totalDescartados

let empleados=[]
const readEmpleados =(request,response) =>{
    var n=0;
    ///
    totalRegistros=0
    totalProcesados=0
    totalDescartados=0
    ///
    var bandera=true;
    console.log("Iniciando Lectura...")
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
              totalRegistros++;
              console.log("\nFILA: ");
                try{
                    var nuevo= new Empleado(parseInt(columns[0],10),
                    columns[1],
                    columns[2],
                    parseInt(columns[3],10),
                    columns[4],
                    parseFloat(columns[5]));
                    //
                    if(validar(nuevo)){
                      totalProcesados++;
                        empleados.push(nuevo);
                        console.log("Agregando nuevo empleado...")
                        console.log(nuevo);
                        console.log("Insertando en la Base de Datos PostGres...")
                        //insertarEmpleados();
                        //insertar en BD.
                    }
                }catch(err){console.log("INFO : DESCARTANDO registro del CSV");}
            }
            flag=true;
        })

    }catch(err){
        console.log("Fallo al leer CSV");
        bandera=false;
    }
    if(bandera){
        response.render('home');
        console.log("<<INFO : SE LEE EL ARCHIVO SIN ERRORES>>")

    }
    console.log("INFO : Generando Bonificaciones para Empleados...")
    bonificar();
    insertarEmpleados();
    console.log("INFO : Bonificaciones Generadas Exitosamente!")

    totalDescartados=totalRegistros-totalProcesados
    log_file = fs.createWriteStream(__dirname + '/nodeFinal.log', {flags : 'w'});
    console.log("Total de registros del archivo :"+totalRegistros)
    console.log("Total de registros procesados  :"+totalProcesados)
    console.log("Total de registros descartados :"+totalDescartados)
}

function validar(empleado){
  console.log("PROCEDURE: Comenzando la validación de campos")
  try{
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
      &&
      (isNaN(empleado.nombre))
      &&
      (isNaN(empleado.apellido))
  )
  {
    console.log("INFO : Fin del análisis/no hay incongruencias.");
    console.log("INFO : ACEPTANDO registro del CSV");
      return true;
  }

  }catch(err){}
    console.log("WARN : Se detectan Incongruencias en el archivo");
    console.log("INFO : DESCARTANDO registro del CSV");
    return false;   
}

function bonificar(){
  var i=0
  console.log("####################");
  for(i; i<empleados.length;i++){
    
    if((empleados[i].cargo=="D")  && (empleados[i].meses>=18)){
      empleados[i].salario+=(empleados[i].salario*0.2);
    }
    else if((empleados[i].cargo=="M") && (empleados[i].meses>=18)){
      empleados[i].salario+=(empleados[i].salario*0.15);
    }
    else if((empleados[i].cargo=="N") && (empleados[i].meses>=18)){
      empleados[i].salario+=(empleados[i].salario*0.10);
    }
    else if((empleados[i].cargo=="D")  && (empleados[i].meses<18)){
      empleados[i].salario+=(empleados[i].salario*0.12);
    }
    else if((empleados[i].cargo=="M")  && (empleados[i].meses<18)){
      empleados[i].salario+=(empleados[i].salario*0.08);
    }
    else if((empleados[i].cargo=="N")  && (empleados[i].meses<18)){
      empleados[i].salario+=(empleados[i].salario*0.04);
    }  
    console.log(empleados[i]); 
  }   
}

function queryinsertarEmpleados(i){
  try{
  pool.query('insert into empleados (id,nombre,apellido,meses,cargo,salario) values ($1, $2, $3, $4, $5, $6 )',
          [empleados[i].id,
          empleados[i].nombre,
          empleados[i].apellido,
          empleados[i].meses,
          empleados[i].cargo,
          empleados[i].salario
          ], (error, results) => {
            if (error) {
              //throw error
              console.log("WARN : Ya existe Registro con el ID propuesto.")
            }
      })
    }catch(err){}
}

function insertarEmpleados(){

  for(var i=0; i<empleados.length; i++){

    pool.query('SELECT Id FROM empleados', (error, results) => {
      if (error) {
        throw error
      }

      for(var j=0; j<results.rows.length; j++){
        console.log(results.rows[j]);
        try{
        if(empleados[i].id == results.rows[j]){
          console.log(empleados[i].id);
        }}catch(err){}
      }
      console.log("ID EXISTENTES:");
      console.log(results.rows);
    })
    queryinsertarEmpleados(i);
      /*
      */
  }  
}

/**
 * CRUD 
 */
 const getEmpleados = (request, response) => {
    pool.query('SELECT * FROM empleados ORDER BY id ASC', (error, results) => {
      if (error) {
        throw error
      }
      response.status(200).json(results.rows)
    })
  }
  
  const crearEmpleado = (request, response) => {
    const { id,nombre,apellido,meses,cargo,salario } = request.body
    /*
    const nombre = request.body.data.nombre
    const edad = request.body.data.edad
    const tipo = request.body.data.tipo
      */
    pool.query('insert into empleados (id,nombre,apellido,meses,cargo,salario) values ($1, $2, $3, $4, $5, $6 )', [id,nombre,apellido,meses,cargo,salario], (error, results) => {
      if (error) {
        throw error
      }
      response.status(201).json({ EmpleadoAgregado: 'Ok' })
    })
  }
  
  const path = require('path')
  
  app.get('/test', function (req, res) {
    res.json({ Resultado: 'PARCIAL#2_Calidad' })
  });
  
  app.get('/', function (req, res) {
    res.render('home');
  });

  /**
   * Metodos.
   */
   app.get('/empleados', getEmpleados)
   app.post('/empleados', crearEmpleado)
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