import { Router } from 'express';
var router = Router();

router.get('/simon', function(req, res, next) {
  res.render('game/simon', { title: 'Express' });
});


router.get('/mario', function(req, res, next) {
  res.render('game/mario', { title: 'Express' });
});

router.get('/snake', function(req, res, next) {
  res.render('game/snake', { title: 'Express' });
});


export default router;
