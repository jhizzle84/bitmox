var express = require('express');
var router = express.Router();
var callContainer = require('../pve.js')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/health', function(req, res, next) {
  res.send('OK');
});

router.post('/new_container', function(req, res, next) {
  callContainer();
});


module.exports = router;
