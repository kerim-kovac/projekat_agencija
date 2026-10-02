const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const logovan = require('../middleware/auth-korisnik');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');


router.get('/', logovan, function(req,res,next){
  db.get('SELECT * FROM korisnici WHERE username=? AND email=?', [req.session.username, req.session.email],(err,data)=>{
      if(err){
      console.error(err);
      return res.status(500).send("Greška na serveru");
    }
    if(data){
      db.all(`       
SELECT kreiranje_putovanja.drzava, kreiranje_putovanja.grad, kreiranje_putovanja.datum, kreiranje_putovanja.cijena, kreiranje_putovanja.lat, kreiranje_putovanja.lng
FROM prijava_putovanja
JOIN korisnici ON prijava_putovanja.korisnikov_id = korisnici.id
JOIN kreiranje_putovanja ON prijava_putovanja.putovanje_id = kreiranje_putovanja.id
WHERE prijava_putovanja.korisnikov_id = ? AND prijava_putovanja.aktivan = 1 AND kreiranje_putovanja.datum < date('now');          
`,[req.session.korisnikId],(err2, putovanja)=>{
    if(err){
      console.error(err);
      return res.status(500).send("Greška na serveru");
    }
      res.render('User/home', {korisnik: data, putovanja: putovanja});
        });
    }
  });
});

router.get('/logout', logovan, function(req,res,next){
  req.session.destroy();
  res.redirect('/');
});

router.get('/lista-putovanja', logovan, function(req,res,next){
  db.all(`SELECT * FROM kreiranje_putovanja WHERE kreiranje_putovanja.datum > date('now');`, [],(err, data)=>{
    if(err){
      console.error(err);
      return res.status(500).send("Greška na serveru");
    }
        res.render('User/home-korisnik-lista-putovanja', {putovanja: data});
  });
});

router.post('/lista-putovanja', logovan, function(req,res,next){
  db.run('INSERT INTO prijava_putovanja (korisnikov_id, putovanje_id, aktivan, shared) VALUES (?, ?, ?, ?);',[req.session.korisnikId, req.body.id, 0,0], (err, data)=>{
      if(err){
      console.error(err);
      return res.status(500).send("Već ste prijavljeni na ovo putovanje");
    }
    res.redirect('/home/lista-putovanja');
  })

});


router.get('/lista-putovanja/result', logovan, function(req,res,next){
  db.all(`SELECT * FROM kreiranje_putovanja WHERE drzava LIKE ? AND datum>date('now');`,[req.query.input], (err,data)=>{
        if(err){
      console.error(err);
      return res.status(500).send("Greška na serveru");
    }
    res.render('User/home-korisnik-lista-putovanja', {putovanja: data});
  });
});

router.get('/moja-putovanja', logovan, function(req,res,next){
  db.all(`
SELECT kreiranje_putovanja.drzava, kreiranje_putovanja.agencija, kreiranje_putovanja.tip_putovanja, kreiranje_putovanja.prevoz, kreiranje_putovanja.grad, kreiranje_putovanja.datum, kreiranje_putovanja.cijena, prijava_putovanja.shared, prijava_putovanja.korisnikov_id, prijava_putovanja.putovanje_id
FROM prijava_putovanja
JOIN korisnici ON prijava_putovanja.korisnikov_id = korisnici.id
JOIN kreiranje_putovanja ON prijava_putovanja.putovanje_id = kreiranje_putovanja.id
WHERE prijava_putovanja.korisnikov_id = ? AND prijava_putovanja.aktivan = 1  AND kreiranje_putovanja.datum < date('now') ORDER BY kreiranje_putovanja.datum DESC; 
    `, [req.session.korisnikId],(err,data)=>{
          if(err){
      console.error(err);
      return res.status(500).send("Greška na serveru");
    }
      res.render('User/home-korisnik-moja-putovanja', {putovanja: data});
    })
});
router.post('/moja-putovanja/ukljuci-dijeljenje',logovan,function(req,res,next){
  db.run('UPDATE prijava_putovanja SET shared = 1 WHERE korisnikov_id=? AND putovanje_id=?;',[req.body.korisnikovId,req.body.putovanjeId],(err,data)=>{
      if(err){
      console.error(err);
      return res.status(500).send("Greška na serveru");
    }
    res.redirect('/home/moja-putovanja');
  });
});

router.post('/moja-putovanja/iskljuci-dijeljenje',logovan,function(req,res,next){
  db.run('UPDATE prijava_putovanja SET shared = 0 WHERE korisnikov_id=? AND putovanje_id=?;',[req.body.korisnikovId,req.body.putovanjeId],(err,data)=>{
      if(err){
      console.error(err);
      return res.status(500).send("Greška na serveru");
    }

    res.redirect('/home/moja-putovanja');
  });
});
router.post('/moja-putovanja/podijeli-objavu',logovan,function(req,res,next){
  
  db.get('SELECT * FROM kreiranje_putovanja WHERE id=?;', [req.body.putovanjeId], (err,data)=>{
        if(err){
      console.error(err);
      return res.status(500).send("Greška na serveru");
    }
    if(data){res.redirect(`/share/${data.token}`);}
  });
});

router.get('/moja-putovanja/putovanje-pdf', logovan, function(req,res,next){
  
    db.get('SELECT * FROM kreiranje_putovanja WHERE id=?', [req.query.putovanjeId],(err,data)=>{
        if(err){
      console.error(err);
      return res.status(500).send("Greška na serveru");
    }
    if(data){
      const doc = new PDFDocument();

      doc.pipe(res);
 
      doc.fontSize(24).text(`${data.drzava}`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Grad: ${data.grad}`, { align: 'center' });
      doc.fontSize(12).text(`Deskripcija putovanja: ${data.deskripcija}`, { align: 'center' });
      doc.fontSize(12).text(`Datum: ${data.datum}`, { align: 'center' });
      doc.fontSize(12).text(`Cijena: ${data.cijena}`, { align: 'center' });
      doc.fontSize(12).text(`Tip putovanja: ${data.tip_putovanja}`, { align: 'center' });

       doc.end();
    }
  });
  
});
router.get('/moja-putovanja/result',logovan,function(req,res,next){
  db.all(`
SELECT kreiranje_putovanja.drzava, kreiranje_putovanja.agencija, kreiranje_putovanja.tip_putovanja, kreiranje_putovanja.prevoz, kreiranje_putovanja.grad, kreiranje_putovanja.datum, kreiranje_putovanja.cijena, prijava_putovanja.shared, prijava_putovanja.korisnikov_id, prijava_putovanja.putovanje_id
FROM prijava_putovanja
JOIN korisnici ON prijava_putovanja.korisnikov_id = korisnici.id
JOIN kreiranje_putovanja ON prijava_putovanja.putovanje_id = kreiranje_putovanja.id
WHERE prijava_putovanja.korisnikov_id = ? AND prijava_putovanja.aktivan = 1  AND kreiranje_putovanja.datum < date('now')  AND kreiranje_putovanja.drzava LIKE ? ORDER BY kreiranje_putovanja.datum DESC ; 
    `, [req.session.korisnikId,`%${req.query.input}%`],(err,data)=>{
        if(err){
      console.error(err);
      return res.status(500).send("Greška na serveru");
    }
    res.render('User/home-korisnik-moja-putovanja', {putovanja: data});
  });
});
router.get('/rezervacije', logovan, function(req,res,next){
  db.all(`
  SELECT  kreiranje_putovanja.grad, kreiranje_putovanja.drzava, kreiranje_putovanja.cijena, kreiranje_putovanja.datum, prijava_putovanja.aktivan, kreiranje_putovanja.id AS putovanje_id
FROM prijava_putovanja
JOIN korisnici 
  ON prijava_putovanja.korisnikov_id = korisnici.id
JOIN kreiranje_putovanja 
  ON prijava_putovanja.putovanje_id = kreiranje_putovanja.id
WHERE prijava_putovanja.korisnikov_id = ? AND kreiranje_putovanja.datum > date('now');`, [req.session.korisnikId], (err,data)=>{
      if(err){
      console.error(err);
      return res.status(500).send("Greška na serveru");
    }

  res.render('User/home-korisnik-rezervacije', {podaci:data});
});
});

router.post('/rezervacije/odjava', logovan, function(req,res,next){
  db.run('DELETE FROM prijava_putovanja WHERE korisnikov_id=? AND putovanje_id=?', [req.session.korisnikId, req.body.putovanjeId],(err,data)=>{
       if(err){
      console.error(err);
      return res.status(500).send("Greška na serveru");
    }
    res.redirect('/home/rezervacije');
  });
});

router.get('/postavke', logovan, function(req,res,next){
  db.get('SELECT * FROM korisnici WHERE username=? AND email=?', [req.session.username, req.session.email],(err,data)=>{
        if(err){
      console.error(err);
      return res.status(500).send("Greška na serveru");
    }
    if(data){
      res.render('User/home-postavke', {korisnik: data});
    }
  });
});
router.post('/postavke/promjena-imena-prezimena', logovan, function(req,res,next){
  db.get('SELECT * FROM korisnici WHERE ime=? AND prezime=?', [req.body.novoIme, req.body.novoPrezime], (err,data)=>{
        if(err){
      console.error(err);
      return res.status(500).send("Greška na serveru");
    }
    
    if(data){
    return res.status(500).send("Postoji vec neko sa tim inicijalima"); 
    }else{
      db.run('UPDATE korisnici SET ime=?,prezime=? WHERE id=?',[req.body.novoIme,req.body.novoPrezime,req.session.korisnikId],(err,data)=>{
            if(err){
      console.error(err);
      return res.status(500).send("Greška na serveru");
    }
        req.session.destroy();
        res.render('User/login', {poruka: "Uspjesno promjenjeno ime i prezime", greska:false});
      });
    }
  });
});

router.post('/postavke/promjena-sifre', logovan, async function(req,res,next){
    if(req.body.trenutna == req.body.nova){req.session.destroy();res.render('login', {poruka: "Ne mozete koristiti istu sifru!"}); return;}
  db.get('SELECT * FROM korisnici WHERE id=?',[req.session.korisnikId], async (err,data)=>{
      if(err){
      console.error(err);
      return res.status(500).send("Greška na serveru");
    }
    if(data){
      const match = await bcrypt.compare(req.body.trenutna, data.password);

      if(match){
        const hashed = await bcrypt.hash(req.body.nova,10);
        db.run('UPDATE korisnici SET password=? WHERE id=?',[hashed,req.session.korisnikId],(err,data)=>{
              if(err){
      console.error(err);
      return res.status(500).send("Greška na serveru");
    }
          res.render('User/login', {poruka: "Uspjesno promjenjena sifra", greska:false});
        });
      }else{

        return res.status(500).send("Sifre se ne poklapaju");
      }

    }
  });
});



module.exports = router;
