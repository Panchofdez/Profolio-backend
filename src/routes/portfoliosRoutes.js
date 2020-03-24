const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Portfolio = mongoose.model("Portfolio");
const User = mongoose.model("User");
const Comment = mongoose.model('Comment');
const requireAuth = require('../middleware/requireAuth');


router.use(requireAuth);

router.get("/", async (req,res)=>{
	try{
		const portfolios = await Portfolio.find({});
		return res.status(200).send(portfolios);
	}catch(err){
		return res.status(400).send({error:err.message});
	}
	
})

router.get("/:id",async (req,res)=>{
	try{
		const portfolio = await Portfolio.findById(req.params.id).populate('comments');
		return res.status(200).send(portfolio);
	}catch(err){
		return res.status(400).send({error:err.message});
	}
	
})


router.post("/:id/comments", async (req,res)=>{
	try{
		const comment = await new Comment({
			text:req.body.text,
			author:{
				id:req.user._id,
				name:req.user.userInfo.name,
				profileImage:req.user.userInfo.profileImage
			}
		});
		await comment.save();
		const portfolio = await Portfolio.findById(req.params.id);
		portfolio.comments.push(comment);
		await portfolio.save();
		return res.status(200).send(portfolio);

	}catch(err){
		return res.status(400).send({error:err.message});
	}
})


router.delete('/:id/comments/:comment_id', async (req,res)=>{
	try{
		const portfolio = await Portfolio.findById(req.params.id);
		portfolio.comments.remove(req.params.comment_id);
		await portfolio.save();
		const comment = await Comment.findById(req.params.comment_id);
		await comment.remove();
		return res.status(200).send(portfolio);

	}catch(err){
		return res.status(400).send({error:err.message});
	}
})

module.exports=router;