const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Portfolio = mongoose.model("Portfolio");
const User = mongoose.model("User");
const requireAuth = require('../middleware/requireAuth');

// Multer Configuration
var multer = require('multer');
// Whenever the file gets uploaded we created a custom name for that file
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // filter to accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

// Cloudinary Configuration
var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'fdez', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});


router.use(requireAuth);

router.get("/", async (req, res)=>{
	try{
		const portfolio = await Portfolio.findOne({userId:req.user._id}).populate('comments');
		return res.status(200).send(portfolio);
	}catch(err){
		return res.status(400).send({error:err.message});
	}
	
});

router.post("/profile",upload.single('image'), async (req,res)=>{
	try{
		if(req.file){
			await cloudinary.v2.uploader.upload(req.file.path, (err,result)=>{
				if(err){
					return res.status(400).send({error:err.message});
				}
				req.body.profileImage = result.secure_url;
				req.body.profileImageId = result.public_id;
			})
		}
		const portfolio = new Portfolio({userId:req.user._id, ...req.body});
		await portfolio.save();
		const user = await User.findById(req.user._id);
		user.portfolio = portfolio._id;
		await user.save();
		return res.status(200).send(portfolio);
	}catch(err){
		return res.status(400).send({error:err.message});
	}
})

router.put("/profile", upload.single('image'), async (req, res)=>{
	try{
		const portfolio = await Portfolio.findOne({userId:req.user._id}); 
		if(req.file){
			await cloudinary.v2.uploader.destroy(portfolio.profileImageId);
			await cloudinary.v2.uploader.upload(req.file.path, (err,result)=>{
				if(err){
					return res.status(400).send({error:err.message});
				}
				portfolio.profileImage = result.secure_url;
				portfolio.profileImageId = result.public_id;
			});			
		}
		const {type, location, birthday} = req.body;
		portfolio.type=type;
		portfolio.location=location;
		portfolio.birthday=birthday;
		await portfolio.save();
		return res.status(200).send(portfolio);
	}catch(err){
		return res.status(400).send({error:err.message});
	}
})

router.post("/about",upload.single('image'),async (req,res)=>{
	try{
		const portfolio = await Portfolio.findOne({userId:req.user._id});
		if(req.file){
			await cloudinary.v2.uploader.upload(req.file.path, (err,result)=>{
				if(err){
					return res.status(400).send({error:err.message});
				}
				portfolio.headerImage = result.secure_url;
				portfolio.headerImageId = result.public_id;
			});
		}
		const {name,statement, about} = req.body;
		portfolio.name = name;
		portfolio.statement=statement;
		portfolio.about =about;
		await portfolio.save();
		return res.send(portfolio);
	}catch(err){
		return res.status(400).send({error:err.message});
	}
	
});

router.put("/about",upload.single('image'),async (req,res)=>{
	try{
		const {name,about,statement}=req.body;
		const portfolio = await Portfolio.findOne({userId:req.user._id});
		if(req.file){
			await cloudinary.v2.uploader.destroy(portfolio.headerImageId);
			const result = await cloudinary.v2.uploader.upload(req.file.path);
			portfolio.headerImage = result.secure_url;
			portfolio.headerImageId = result.public_id;
		}		
		portfolio.about=about;
		portfolio.name=name;
		portfolio.statement=statement
		await portfolio.save();
		return res.status(200).send(portfolio);
	}catch(err){
		return res.status(400).send({error:err.message});
	}
})


router.post('/timeline', async (req, res)=>{
	try{
		const portfolio = await Portfolio.findOne({userId:req.user._id});
		portfolio.timeline.push(req.body.post)
		await portfolio.save();
		return res.status(200).send(portfolio);
	}catch(err){
		return res.status(400).send({error:err.message});
	}
	
})

router.put('/timeline/:id', async (req,res)=>{
	try{
		const portfolio = await Portfolio.findOne({userId:req.user._id});
		const newTimeline = portfolio.timeline.map((post)=>{
			if(post._id==req.params.id){
				post=req.body.post;
			}
			return post 
		});
		portfolio.timeline= newTimeline;
		await portfolio.save();
		return res.status(200).send(portfolio);
	}catch(err){
		return res.status(400).send({error:err.message});
	}
})

router.delete('/timeline/:id', async (req, res)=>{
	try{
		const portfolio = await Portfolio.findOne({userId:req.user._id});
		const timeline = portfolio.timeline.filter((post)=>post._id!=req.params.id);
		portfolio.timeline=timeline;
		await portfolio.save();
		return res.status(200).send(portfolio);

	}catch(err){
		return res.status(400).send({error:err.message});
	}
})


router.post('/videos', async (req,res)=>{
	try{
		const portfolio = await Portfolio.findOne({userId:req.user._id});
		portfolio.videos.push(req.body.video);
		await portfolio.save();
		return res.status(200).send(portfolio);
	}catch(err){
		return res.status(400).send({error:err.message});
	}
})

router.put('/videos/:id', async (req,res)=>{
	try{
		const {title, description, link} = req.body;
		const portfolio = await Portfolio.findOne({userId:req.user._id});
		const videos = portfolio.videos.map((video)=>{
			if(video._id==req.params.id){
				video.title=title;
				video.description=description;
				video.link=link;
			}
			return video;
		});
		portfolio.videos = videos;
		await portfolio.save();
		return res.status(200).send(portfolio);

	}catch(err){
		return res.status(400).send({error:err.message});
	}
})


router.delete('/videos/:id', async (req,res)=>{
	try{
		const portfolio = await Portfolio.findOne({userId:req.user._id});
		const videos = portfolio.videos.filter((video)=>video._id!=req.params.id);
		portfolio.videos = videos;
		await portfolio.save();
		return res.status(200).send(portfolio);
	}catch(err){
		return res.status(400).send({error:err.message});
	}
})

router.post("/collections", upload.array('photos', 5), async (req,res)=>{
	let multipleUpload = new Promise(async (resolve,reject)=>{
		let newPhotos = [];
		console.log(req.files);
		for (x=0; x<req.files.length;x++){
			await cloudinary.v2.uploader.upload(req.files[x].path, (err, result)=>{
				if(err){
					reject(err)
				}else{
					newPhotos.push({
						image:result.secure_url,
						imageId:result.public_id
					})
				}
			});
		}
		resolve(newPhotos);
	})
	.then((result)=>result)
	.catch((err)=>err)
	try{
		let photosArr = await multipleUpload;
		const portfolio= await Portfolio.findOne({userId:req.user._id});
		portfolio.collections.push({title:req.body.title,description:req.body.description, photos: photosArr});
		await portfolio.save();
		return res.status(200).send(portfolio);	
	}catch(err){
		return res.status(400).send({error:err.message});
	}
})

router.delete("/collections/:id", async(req,res)=>{
	try{
		const portfolio = await Portfolio.findOne({userId:req.user._id});
		const collection = portfolio.collections.find((collection)=>collection._id==req.params.id);
		collection.photos.forEach(async(photo)=>{
			try{
				await cloudinary.v2.uploader.destroy(photo.imageId);
			}catch(err){
				throw Error(err);
			}			
		});		
		const collections = portfolio.collections.filter((collection)=>collection._id!=req.params.id);
		portfolio.collections=collections;
		await portfolio.save();
		return res.status(200).send(portfolio);
	}catch(err){
		return res.status(400).send({error:err.message});
	}
})

router.delete("/collections/:id/photos/:photo_id", async(req,res)=>{
	try{
		const portfolio = await Portfolio.findOne({userId:req.user._id});
		const collections = portfolio.collections.map((collection)=>{
			if(collection._id==req.params.id){
				if(collection.photos.length===1){
					return res.status(400).send({error:err.message});
				}
				collection.photos = collection.photos.filter((photo)=>photo.imageId!=req.params.photo_id);
			}
			return collection;
		});
		portfolio.collections = collections;
		await portfolio.save();
		await cloudinary.v2.uploader.destroy(req.params.photo_id);
		return res.status(200).send(portfolio);
	}catch(err){
		return res.status(400).send({error:err.message});
	}
})



router.put("/collections/:id", upload.array('photos', 5), async(req,res)=>{
	let multipleUpload = new Promise(async (resolve,reject)=>{
		let newPhotos = [];
		for (x=0; x<req.files.length;x++){
			await cloudinary.v2.uploader.upload(req.files[x].path, (err, result)=>{
				if(err){
					reject(err)
				}else{
					newPhotos.push({
						image:result.secure_url,
						imageId:result.public_id
					})
				}
			});
		}
		resolve(newPhotos);
	})
	.then((result)=>result)
	.catch((err)=>err)
	try{
		const portfolio = await Portfolio.findOne({userId:req.user._id});
		let photosArr=[];
		if(req.files){
			photosArr = await multipleUpload;
			
		}
		const collections = portfolio.collections.map((collection)=>{
			if(collection._id==req.params.id){
				collection.title=req.body.title;
				collection.description=req.body.description;
				collection.photos = collection.photos.concat(photosArr);
			}
			return collection;
		})
		portfolio.collections=collections;
		portfolio.save();
		return res.status(200).send(portfolio);
	}catch(err){
		return res.status(400).send({error:err.message});
	}

})




module.exports=router;