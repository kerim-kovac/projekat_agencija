const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const logovan = require('../middleware/auth-agencija');
const crypto = require('crypto');

router.get('/', logovan, function(req,res,next){
  db.get('SELECT * FROM agencija WHERE naziv=? AND email=?', [req.session.naziv, req.session.email],(err,data)=>{
    if(err){
      console.error(err);
      return res.status(500).send("Greška na serveru");
    }
    if(data){
      res.render('Agencija/home-agencija', {agencija: data});
    }
  });
   });

router.get('/logout', logovan, function(req,res,next){
  req.session.destroy();
  res.redirect('/');
})



router.get('/kreiraj-putovanje', logovan, function(req,res,next){
  res.render('Agencija/home-agencija-putovanja');
});

router.get('/lista-putovanja', logovan, function(req,res,next){
  db.all(`SELECT * FROM kreiranje_putovanja WHERE agencija_id=? AND kreiranje_putovanja.datum > date('now')`, [req.session.agencijaId], (err,data)=>{
    if(err){
      console.error(err);
      return res.status(500).send("Greška na serveru");
    }
    
      res.render('Agencija/home-agencija-lista-putovanja', {putovanja: data, agencija: req.session.naziv});
    
  })
});
router.get('/lista-putovanja/result',logovan,function(req,res,next){
  db.all(`SELECT * FROM kreiranje_putovanja WHERE agencija_id=? AND kreiranje_putovanja.datum > date('now') AND drzava LIKE ?`,[req.session.agencijaId,`%${req.query.input}%`],(err,data)=>{
    if(err){
      console.error(err);
      return res.status(500).send("Greška na serveru");
    }
    res.render('Agencija/home-agencija-lista-putovanja', {putovanja: data, agencija: req.session.naziv});
  });

});
router.get('/postavke', logovan, function(req,res,next){
  db.get('SELECT * FROM agencija WHERE naziv=? AND email=?', [req.session.naziv, req.session.email],(err,data)=>{
    if(err){
      console.error(err);
      return res.status(500).send("Greška na serveru");
    }
    if(data){
      res.render('Agencija/home-agencija-opcije', {agencija: data});
    }
  });
});
router.post('/postavke/promjena-sifre', logovan, async function(req,res,next){
  if(req.body.trenutna == req.body.nova){res.render('login', {poruka: "Ne mozete koristiti istu sifru!"}); return;}
   db.get('SELECT * FROM agencija WHERE id=?',[req.session.agencijaId], async (err,data)=>{
      if(err){
      console.error(err);
      return res.status(500).send("Greška na serveru");
    }
    if(data){
      const match = await bcrypt.compare(req.body.trenutna, data.password);
      if(match){
        const hashed = await bcrypt.hash(req.body.nova, 10);

      db.run('UPDATE agencija SET password=? WHERE id=?', [hashed, req.session.agencijaId],(err,data)=>{
      if(err){
      console.error(err);
      return res.status(500).send("Greška na serveru");
      }
            res.render('Agencija/login', {poruka: "Uspjesno promjenjena sifra!"});
        })
      }else{
          return res.status(500).send("Sifre se ne poklapaju");      }
    }
   });
  
});

router.get('/prijavljeni-useri', logovan, function(req,res,next){
db.all(
`
SELECT korisnici.ime,korisnici.id AS korisnik_id, korisnici.prezime, korisnici.email, kreiranje_putovanja.grad, kreiranje_putovanja.drzava, kreiranje_putovanja.datum, prijava_putovanja.aktivan, prijava_putovanja.id AS prijava_id
FROM prijava_putovanja
JOIN korisnici ON prijava_putovanja.korisnikov_id = korisnici.id
JOIN kreiranje_putovanja ON prijava_putovanja.putovanje_id = kreiranje_putovanja.id
WHERE kreiranje_putovanja.agencija_id=? AND kreiranje_putovanja.datum > date('now');
`, [req.session.agencijaId], (err, data)=>{
    if(err){
      console.error(err);
      return res.status(500).send("Greška na serveru");
    }
    res.render('Agencija/home-agencija-prijavljeni-useri', {podaci: data});
})
});

router.post('/kreiraj-putovanje', logovan, function(req,res,next){
  const token = crypto.randomBytes(16).toString('hex');
  db.run('INSERT INTO kreiranje_putovanja (agencija, drzava, grad, deskripcija, datum, min, max, cijena, lat, lng, agencija_id, tip_putovanja, prevoz, token) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);', [req.session.naziv,req.body.drzava, req.body.grad, req.body.deskripcija, req.body.datum, req.body.minimalan, req.body.maximalan, req.body.cijena, req.body.lat, req.body.lng, req.session.agencijaId, 'Agencija', req.body.prevoz, token], (err,data)=>{
    if(err){
      console.error(err);
      return res.status(500).send("Greška na serveru");
    }
      res.redirect('/home-agencija/lista-putovanja');
  })
});
 router.post('/lista-putovanja', logovan, function(req,res,next){
  db.run('DELETE FROM kreiranje_putovanja WHERE id=?', [req.body.id], (err,data)=>{
    if(err){
      console.error(err);
      return res.status(500).send("Greška na serveru");
    }
    db.run('DELETE FROM prijava_putovanja WHERE putovanje_id=?;', [req.body.id], (err,data)=>{
      if(err){
        console.log("greska na bazi");
        return;
      }
      res.redirect('/home-agencija/lista-putovanja');
    });
  })
});
router.post('/prijavljeni-useri/odobreno', logovan, function(req,res,next){
    db.run('UPDATE prijava_putovanja SET aktivan = 1 WHERE id=?', [req.body.putovanje_id], (err,data)=>{
    if(err){
      console.error(err);
      return res.status(500).send("Greška na serveru");
    }
      res.redirect('/home-agencija/prijavljeni-useri');
    })
});
router.post('/prijavljeni-useri/blokirano', logovan, function(req,res,next){
    db.run('UPDATE prijava_putovanja SET aktivan = 2 WHERE id=?', [req.body.putovanje_id], (err,data)=>{
    if(err){
      console.error(err);
      return res.status(500).send("Greška na serveru");
    }
      res.redirect('/home-agencija/prijavljeni-useri');
    })
});

module.exports = router;
