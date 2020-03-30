const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Portfolio = mongoose.model("Portfolio");
const User = mongoose.model("User");
const Comment = mongoose.model('Comment');
const requireAuth = require('../middleware/requireAuth');




router.get("/", requireAuth , async (req,res)=>{
	try{
		console.log(req.query.search);
		if(req.query.search){
			const regex = new RegExp(escapeRegex(req.query.search), 'gi')
			const portfolios = await Portfolio.find({$text:{$search:regex}});
			return res.status(200).send(portfolios);
		}else{
			const portfolios = await Portfolio.find({});
			return res.status(200).send(portfolios);
		}
	}catch(err){
		return res.status(400).send({error:err.message});
	}
	
})

router.get("/:id",async (req,res)=>{
	try{
		const portfolio = await Portfolio.findById(req.params.id).populate('comments').populate('supporters');
		return res.status(200).send(portfolio);
	}catch(err){
		return res.status(400).send({error:err.message});
	}
	
})


router.post("/:id/comments", requireAuth, async (req,res)=>{
	try{
		console.log(req.body.text);
		const userPortfolio = await Portfolio.findOne({userId:req.user._id}).populate('comments');
		const portfolio = await Portfolio.findById(req.params.id).populate('comments');
		if(portfolio._id.equals(userPortfolio._id)){
			return res.status(400).send({error:"You can't comment on your own portfolio"});
		}
		const comment = await new Comment({
			text:req.body.text,
			author:{
				id:req.user._id,
				name:userPortfolio.name,
				profileImage:userPortfolio.profileImage
			}
		});
		await comment.save();
		
		portfolio.comments.push(comment);
		await portfolio.save();
		return res.status(200).send(portfolio);
	
		
	}catch(err){
		return res.status(400).send({error:err.message});
	}
})


router.delete('/:id/comments/:comment_id', requireAuth, async (req,res)=>{
	try{
		console.log(req.params.comment_id)
		const comment = await Comment.findOne({_id:req.params.comment_id});
		if(!comment.author.id.equals(req.user._id)){
			console.log("Arrived");
			return res.status(400).send({error:"You can't delete other user's comments"});
		}
		const portfolio = await Portfolio.findById(req.params.id).populate('comments');
		portfolio.comments.remove(req.params.comment_id);
		await portfolio.save();
		
		await comment.remove();
		return res.status(200).send(portfolio);

	}catch(err){
		return res.status(400).send({error:err.message});
	}
})

router.post('/:id/endorse', requireAuth, async(req,res)=>{
	try{
		console.log(req.params.id);
		const portfolio = await Portfolio.findById(req.params.id);
		const currentUser = await User.findById(req.user._id);
		const isSupporting = portfolio.supporters.find((id)=>id.equals(req.user._id));
		if(portfolio.userId.equals(req.user._id)){
			return res.status(400).send({error:"You can't endorse yourself"});
		}
		if(isSupporting){
			return res.status(400).send({error:"You can't endorse the user again"});
		}
		portfolio.supporters.push(req.user._id);
		await portfolio.save();
		currentUser.endorsing.push(portfolio._id);
		await currentUser.save();			
		return res.status(200).send(portfolio);	
	}catch(err){
		return res.status(400).send({error:err.message});
	}
})


router.post('/:id/stopsupport', requireAuth, async(req, res)=>{
	try{
		const portfolio = await Portfolio.findById(req.params.id);
		const currentUser = await User.findById(req.user._id);
		const supporters = portfolio.supporters.filter((id)=>!id.equals(req.user._id));
		portfolio.supporters = supporters;
		await portfolio.save();
		const supporting = currentUser.endorsing.filter((id)=>!id.equals(portfolio._id));
		currentUser.endorsing = supporting;
		await currentUser.save();
		return res.status(200).send(portfolio);
	}catch(err){
		return res.status(400).send({error:err.message});
	}
})

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};



module.exports=router;