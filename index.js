require('dotenv').config();
require('./src/models/User');
require('./src/models/Portfolio');
require('./src/models/Comment');
const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require("./src/routes/authRoutes");
const portfoliosRoutes = require("./src/routes/portfoliosRoutes");
const userProfileRoutes = require("./src/routes/userProfileRoutes");
const myPortfolioRoutes = require('./src/routes/myPortfolioRoutes');
const bodyParser = require('body-parser');
const requireAuth = require('./src/middleware/requireAuth');



mongoose.set("debug",true);
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true )
mongoose.connect('mongodb://localhost/portfolio-app');

mongoose.connection.on('connected', ()=>{
	console.log('Connected to mongodb');
})

mongoose.connection.on('error', (err)=>{
	console.error("Error connecting to mongo db", err);
})

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(cors());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.get('/', (req, res)=>{
	res.send('Hello');;
})

app.use(authRoutes);
app.use('/portfolios',portfoliosRoutes);
app.use('/myportfolio',myPortfolioRoutes);
app.use(userProfileRoutes);


app.listen(3001, ()=>{
	console.log('Server is running on port 3001...')
})