const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model('User');

const requireAuth = require('../middleware/requireAuth');


router.use(requireAuth);

router.get("/myprofile", async (req, res)=>{
	const user = await User.findById(req.user._id);
	const {userInfo} = user;
	res.send(userInfo);
});


router.post("/myprofile", async (req, res)=>{
	try{
		const user = await User.findById(req.user._id );
		
		const userInfo = req.body;
		user.userInfo = userInfo;

		await user.save();

		res.send(user);
	}catch(err){
		return res.status(422).send({error:err.message});
	}
	
})


module.exports = router;