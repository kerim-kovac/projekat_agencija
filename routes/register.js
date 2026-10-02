const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

router.get('/', function(req, res, next) {
  res.render('Main/register');
});
router.get('/korisnik', function(req,res,next) {
    res.render('Main/register-korisnik');
});
router.get('/agencija', function(req,res,next){
  res.render('Main/register-agencija');
});


router.post('/korisnik',  async function(req,res,next){
  db.get('SELECT * FROM korisnici WHERE username=? OR email=?',[req.body.username, req.body.email], async (err,data)=>{
      if(err){
        res.render('Main/register-korisnik', {poruka: "Greška sa bazom", greska: true});
        return;
      }
      if(data){
        res.render('Main/register-korisnik', {poruka: "Vaši podaci su vec registrovani", greska: true});
        return;
      }else{
        if(req.body.password == req.body.ponovljeni){
        const hashed = await bcrypt.hash(req.body.password, 10);
        db.run('INSERT INTO korisnici (ime, prezime, username, email, password,role)  VALUES(?,?,?,?,?,?)',[req.body.ime, req.body.prezime,req.body.username,req.body.email,hashed,'User'], (err,data)=>{
          if(err){
            res.render('Main/register-korisnik', {poruka: "Greška sa bazom", greska: true});
            return;
          }
          res.render('Main/login', {poruka: "Uspjesno registrovana Korisnik", greska: false});
        })
        }else{
        res.render('Main/register-korisnik', {poruka: "Sifre se ne poklapaju", greska: true});
      }
      }
  });
});

router.post('/agencija', async function(req,res,next){
  db.get('SELECT * FROM agencija WHERE naziv=? OR email=?',[req.body.naziv_agencije, req.body.email], async(err,data)=>{
      if(err){
        res.render('Main/register-agencija', {poruka: "Greška sa bazom", greska: true});
        return;
      }
      if(data){
        res.render('Main/register-agencija', {poruka: "Postoji vec takva Agencija", greska: true});
      }else{
        if(req.body.password == req.body.ponovljena_lozinka){
        const hashed = await bcrypt.hash(req.body.password, 10);
        db.run('INSERT INTO agencija (naziv, email, datum, password,role)  VALUES(?,?,?,?,?)',[req.body.naziv_agencije,req.body.email,req.body.datum_osnivanja,hashed,'Agencija'], (err,data)=>{
          if(err){
          res.render('Main/register-agencija', {poruka: "Greška sa bazom", greska: true});
            return;
          }
          res.render('Main/login', {poruka: "Uspjesno registrovana Agencija", greska:false});
        })
        }else{
        res.render('Main/register-agencija', {poruka: "Sifre se ne poklapaju", greska: true});
        return;
      }
      }
  });
});
module.exports = router;
