const mongoose = require('mongoose');


const commentSchema= new mongoose.Schema({
	text:String,
	createdAt:{type:Date, default:Date.now},
	author:{
		id:{
			type:mongoose.Schema.Types.ObjectId,
			ref:'User'
		},
		name:String,
		profileImage: String
	}
});


mongoose.model('Comment', commentSchema);


