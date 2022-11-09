function home(req, res){
    
    res.render('../views/home.hbs')
}

module.exports = {
    home: home,
}