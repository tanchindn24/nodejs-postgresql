require("dotenv").config();
require("dotenv").config({
    path: `.env.${process.env.NODE_ENV}`,
})
const express = require('express');
const app = express();
const port = process.env.PORT || 80;
const router = require('./controller/routes');
const {join} = require("path");

// app configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(express.static(join(__dirname, 'public')));

// view engine setup
app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));

app.use('/', router);
app.use((req, res) => {
    res.status(404).json({error: 'Not found'});
});

app.listen(port, () =>
    console.log("server run with port: ", port));
