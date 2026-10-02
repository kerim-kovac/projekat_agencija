const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const PDFDocument = require('pdfkit');


router.get('/:token',  function(req,res,next){
    db.get('SELECT * FROM kreiranje_putovanja WHERE token=?',[req.params.token],(err,data)=>{
    if(err){
      console.error(err);
      return res.status(500).send("Greška na serveru");
    }    if(data){res.render('Main/share', {podaci: data});}
    });
});


module.exports = router;
