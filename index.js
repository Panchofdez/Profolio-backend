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
const mongodb_uri =`mongodb+srv://panchofdez:${process.env.MONGODB_PASSWORD}@cluster0-nwpsf.mongodb.net/test?retryWrites=true&w=majority` || 'mongodb://localhost/portfolio-app' 
mongoose.connect(mongodb_uri);

mongoose.connection.on('connected', ()=>{
	console.log('Connected to mongodb');
})

mongoose.connection.on('error', (err)=>{
	console.error("Error connecting to mongo db", err);
})

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.get('/', (req, res)=>{
	res.send('Hello');;
})

app.use('/api',authRoutes);
app.use('/api/portfolios',portfoliosRoutes);
app.use('/api/myportfolio',myPortfolioRoutes);
app.use('/api', userProfileRoutes);


app.listen(process.env.PORT || 3000, ()=>{
	console.log('Server is running on port 3000...')
})