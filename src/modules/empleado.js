class Empleado{
    constructor(id,nombre,apellido,meses,cargo,salario){
        this.id=id;
        this.nombre=nombre;
        this.apellido=apellido;
        this.meses=meses;
        this.cargo=cargo;
        this.salario=salario;
    }

}

module.exports = new Empleado();