require("dotenv").config();
require("dotenv").config({
    path: `.env.${process.env.NODE_ENV}`,
})
const express = require('express');
const app = express();
const port = process.env.PORT || 80;
const router = require('./controller/routes');

app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'));

app.use('/', router);

app.get('/', (req, res) => {
    res.redirect('/home');
});

app.get('/test', (req, res) => {
    res.render('home', {title: 'Test'})
});

app.use((req, res) => {
    res.status(404).json({error: 'Not found'});
});

app.listen(port, () =>
    console.log("server run with port: ", port));
