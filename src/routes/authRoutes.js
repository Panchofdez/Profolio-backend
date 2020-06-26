const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model('User');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

router.post('/signup', async (req,res)=>{
	const {email, password,name} = req.body;
	if(isEmpty(email) || isEmpty(password) || isEmpty(name)){
		return res.status(422).send({error:"Email, password and name are required"});
	}
	if(!isEmail(email)){
		return res.status(422).json({error:'Please provide a valid email'});
	}
	try{
		const user = new User({
			email, 
			password,
			name
		});
		await user.save();
		const token = await jwt.sign({userId:user._id, name:user.name},process.env.SECRET_KEY);
		res.status(200).send({token, userId:user._id, name:user.name});
	}catch(err){
		return res.status(422).send({error:"Invalid email, email already signed up"});
	}
})

router.post('/signin', async (req,res)=>{
	const {email,password} = req.body;
	if(isEmpty(email) || isEmpty(password)){
		return res.status(422).send({error:"Must provide email and password"});
	}

	const user = await User.findOne({email});
	if(!user){
		return res.status(422).send({error:'Invalid email or password'});
	}
	try{
		await user.comparePassword(password);
		const token = jwt.sign({userId:user._id, name:user.name}, process.env.SECRET_KEY);
		const notifications = user.notifications.filter((n)=>n.read===false);
		res.status(200).send({token, userId:user._id, name:user.name, profileImage:user.profileImage, notifications, portfolio:user.portfolio});
	}catch(err){
		return res.status(422).send({error:'Invalid email or password'});
	}
	

})

router.post('/facebooklogin', (req, res)=>{
	const {accessToken, userId} = req.body;

	let urlGraphFacebook = `https://graph.facebook.com/v7.0/${userId}/?fields=id,name,email&access_token=${accessToken}`;
	fetch(urlGraphFacebook,{
		method:'GET'
	})
	.then(response => response.json())
    .then(response =>{
    	const {email, name}=response;
    	User.findOne({email}).exec((err,user)=>{
    		if(err){
    			return res.status(400).json({error:'Something went wrong...'});
    		}else{
    			if(user){
    				console.log(user);
    				const token = jwt.sign({userId:user._id, name:user.name}, process.env.SECRET_KEY);
					const notifications = user.notifications.filter((n)=>n.read===false);
					return res.status(200).send({token, userId:user._id, name:user.name, profileImage:user.profileImage, notifications, portfolio:user.portfolio});
    			}else{
    				let password = email+process.env.SECRET_KEY;
    				const user = new User({
						email, 
						password,
						name
					});
					user.save((err, data)=>{
						if(err){
							return res.status(400).json({error:'Something went wrong...'});
						}else{
							const token = jwt.sign({userId:data._id, name},process.env.SECRET_KEY);
							return res.status(200).send({token, userId:data._id, name});
						}
					});
					
    			}
    		}
    	});
    })
})


const isEmail = (email) => {
  const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(regEx)) return true;
  else return false;
};

const isEmpty = (string) => {
  if (string.trim() === '') return true;
  else return false;
};





module.exports = router;