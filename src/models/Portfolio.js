const mongoose= require('mongoose');

const imageSchema = new mongoose.Schema({
	image:String,
	imageId:String
})

const timelinePostSchema = new mongoose.Schema({
	date:String,
	title:String,
	text:String
})


const collectionSchema = new mongoose.Schema({
	title:String,
	description:String,
	photos:[imageSchema]
})

const videoSchema = new mongoose.Schema({
	title:String,
	description:String,
	link:{type:String,required:true}
})

const portfolioSchema = new mongoose.Schema({
	userId:{
		type:mongoose.Schema.Types.ObjectId,
		ref:'User'
	},
	name:String,
	type:String,
	about:String,
	image:String,
	imageId:String,
	statement:String,
	collections:[collectionSchema],
	videos:[videoSchema],
	timeline:[timelinePostSchema],
	comments:[
		{
			type:mongoose.Schema.Types.ObjectId,
			ref:'Comment'	
		}
	]
})



mongoose.model('Portfolio', portfolioSchema);