const express = require('express')
const TaskController= require('../controllers/TaskController');
const router= express.Router();

router.get('/home', TaskController.home);

module.exports=router;