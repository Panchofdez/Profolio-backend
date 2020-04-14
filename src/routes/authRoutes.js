const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model('User');
const jwt = require('jsonwebtoken');

router.post('/signup', async (req,res)=>{
	const {email, password,name} = req.body;
	if(!email || !password || !name){
		return res.status(422).send({error:"Email, password and name are required"});
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
	if(!email || !password){
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








module.exports = router;