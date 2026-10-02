const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const generator = require('generate-password');
const nodemailer = require('nodemailer');

router.get('/', function(req, res, next) {
  res.render('Main/login');
});
router.get('/zaboravljena-lozinka', function(req,res,next){
  res.render('Main/zaboravljena-lozinka');
});
router.post('/', async function(req,res,next){
    db.get('SELECT * FROM korisnici WHERE username=?;', [req.body.username], async (err,data)=>{ 
      if(err){
        res.render('Main/login', {poruka: "Greška sa bazom", greska: true});
        return;
      }
      if(data){
        const match = await bcrypt.compare(req.body.password, data.password);
        if(match){
          req.session.logovaniKorisnik = true;
          req.session.ime = data.ime;
          req.session.prezime = data.prezime;
          req.session.username = data.username;
          req.session.email = data.email;
          req.session.korisnikId = data.id;
          res.redirect('/home');
        }else{
        res.render('Main/login', {poruka: "Pogrešna šifra", greska: true});
        }
      }else{
        db.get('SELECT * FROM agencija WHERE naziv=?;',[req.body.username], async (err,data)=>{
          if(err){
           res.render('Main/login', {poruka: "Greška sa bazom", greska: true});
            return;
          }
          
          if(data){
            const match_agencija = await bcrypt.compare(req.body.password, data.password);
            if(match_agencija){
             req.session.logovanaAgencija = true;
             req.session.naziv = data.naziv;
             req.session.datum = data.datum;
             req.session.role = data.role;
             req.session.email = data.email;
             req.session.agencijaId = data.id;
             res.redirect('/home-agencija');
            }else{
            res.render('Main/login', {poruka: "Pogrešna šifra", greska: true});
            }
          }else{
              res.render('Main/login', {poruka: "Pogrešan korisnik", greska: true});
          }
        })
      }
    })
});

module.exports = router;
