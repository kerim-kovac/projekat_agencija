const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const generator = require('generate-password');
const nodemailer = require('nodemailer');

router.get('/', function(req, res, next) {
  res.render('zaboravljena-lozinka');
});

router.post('/', async function(req,res,next){
  db.get('SELECT * FROM korisnici WHERE email=?', [req.body.email], async (err,data)=>{
    if(err){
    res.render('Main/zaboravljena-lozinka', {poruka: "Greška sa bazom", greska: true});      
    return;
    }
    if(data){
    const password = generator.generate({
	      length: 10,
	      numbers: true
      });
    const hashed = await bcrypt.hash(password,10);      
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
        user: process.env.EMAIL_ACC,
        pass: process.env.EMAIL_KOD
        }
        });
        const mailOptions = {
        from: 'i56526455@gmail.com',
        to: req.body.email,
        subject: 'Reset lozinke',
        html: `<h1>Tvoja nova lozinka je: ${password}</h1>`
        };
        db.run('UPDATE korisnici SET password=? WHERE email=?', [hashed,req.body.email], (err,data)=>{
          if(err){
          res.render('Main/zaboravljena-lozinka', {poruka: "Greška sa bazom", greska: true});      
            return;
          }
          
          transporter.sendMail(mailOptions, (err, info) => {
              if(err){
                res.render('Main/zaboravljena-lozinka', {poruka: "Greška sa bazom", greska: true});      
              return;
              } else {
              res.render('Main/login', {poruka: "Nova lozinka je poslana na E-mail", greska:false})
              }
              });
          
        });
    }else{
      res.render('zaboravljena-lozinka', {poruka: "E-mail ne postoji u sistemu", greska:true})
    }
  });
});
module.exports = router;
