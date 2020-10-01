const express = require("express");
const router = express.Router({ mergeParams: true });
const mongoose = require("mongoose");
const Portfolio = mongoose.model("Portfolio");
const User = mongoose.model("User");
const Comment = mongoose.model("Comment");
const requireAuth = require("../middleware/requireAuth");

router.get("/", async (req, res) => {
  //retrieves all portfolios
  try {
    if (req.query.search) {
      const regex = new RegExp(escapeRegex(req.query.search), "gi");
      const portfolios = await Portfolio.find({ $text: { $search: regex } });
      return res.status(200).send(portfolios);
    } else {
      const portfolios = await Portfolio.find({});
      return res.status(200).send(portfolios);
    }
  } catch (err) {
    console.log(err);
    return res.status(400).send({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  //retrieves a particular portfolio
  try {
    let portfolio = await Portfolio.findById(req.params.id);
    await portfolio
      .populate("comments")
      .populate("recommendations", "portfolio profileImage name")
      .execPopulate();

    const response = await formatUserObject(portfolio);
    return res.status(200).send(response);
  } catch (err) {
    console.log(err.message);
    return res.status(400).send({ error: err.message });
  }
});

router.post("/:id/comments", requireAuth, async (req, res) => {
  //route to post a comment on a user's portfolio and creates a notification for that user
  try {
    const userPortfolio = await Portfolio.findOne({ userId: req.user._id });
    if (!userPortfolio) {
      console.log("error");
      return res
        .status(400)
        .send({ error: "You must create a portfolio first" });
    }
    const portfolio = await Portfolio.findById(req.params.id);
    if (portfolio._id.equals(userPortfolio._id)) {
      return res
        .status(400)
        .send({ error: "You can't comment on your own portfolio" });
    }
    const comment = await new Comment({
      text: req.body.text,
      author: {
        id: req.user._id,
        name: req.user.name,
        profileImage: userPortfolio.profileImage,
        portfolio: userPortfolio._id,
      },
    });
    await comment.save();
    portfolio.comments.push(comment._id);
    await portfolio.save();
    const user = await User.findOne({ portfolio: req.params.id });
    const notification = {
      text: `${req.user.name} commented on your portfolio!`,
      portfolio: req.user.portfolio,
      profileImage: req.user.profileImage,
      comment: comment._id,
    };
    user.notifications.push(notification);
    await user.save();
    await portfolio
      .populate("comments")
      .populate("recommendations", "portfolio profileImage name")
      .execPopulate();
    const response = await formatUserObject(portfolio);
    return res.status(200).send(response);
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
});

router.delete("/:id/comments/:comment_id", requireAuth, async (req, res) => {
  //deletes a comment and creates a notification
  try {
    const comment = await Comment.findOne({ _id: req.params.comment_id });
    if (!comment.author.id.equals(req.user._id)) {
      return res
        .status(400)
        .send({ error: "You can't delete other user's comments" });
    }
    const portfolio = await Portfolio.findById(req.params.id);
    await portfolio
      .populate("comments")
      .populate("recommendations", "portfolio profileImage name")
      .execPopulate();
    portfolio.comments.remove(req.params.comment_id);
    await portfolio.save();
    await comment.remove();
    const user = await User.findOne({ portfolio: req.params.id });
    const notification = {
      text: `${req.user.name} deleted their comment`,
      portfolio: req.user.portfolio,
      profileImage: req.user.profileImage,
    };
    user.notifications.push(notification);
    await user.save();
    const response = await formatUserObject(portfolio);
    return res.status(200).send(response);
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
});

router.post("/:id/recommend", requireAuth, async (req, res) => {
  //allows a user to recommend another user
  try {
    const portfolio = await Portfolio.findById(req.params.id);
    await portfolio
      .populate("comments")
      .populate("recommendations", "portfolio profileImage name")
      .execPopulate();
    const currentUser = await User.findById(req.user._id);
    const isSupporting = portfolio.recommendations.find((id) =>
      id.equals(req.user._id)
    );
    if (portfolio.userId.equals(req.user._id)) {
      return res.status(400).send({ error: "You can't recommend yourself" });
    }
    if (isSupporting) {
      return res
        .status(400)
        .send({ error: "You can't recommend the user again" });
    }
    portfolio.recommendations.push(req.user._id);
    await portfolio.save();
    currentUser.recommending.push(portfolio.userId);
    await currentUser.save();
    const user = await User.findOne({ portfolio: req.params.id });
    const notification = {
      text: `${req.user.name} has recommended you!`,
      portfolio: req.user.portfolio,
      profileImage: req.user.profileImage,
    };
    user.notifications.push(notification);
    await user.save();
    const response = await formatUserObject(portfolio);
    return res.status(200).send(response);
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
});

router.post("/:id/unrecommend", requireAuth, async (req, res) => {
  //allows a user to stop recommending another
  try {
    const portfolio = await Portfolio.findById(req.params.id);
    await portfolio
      .populate("comments")
      .populate("recommendations", "portfolio profileImage name")
      .execPopulate();
    const currentUser = await User.findById(req.user._id);
    const recommendations = portfolio.recommendations.filter(
      (id) => !id.equals(req.user._id)
    );
    portfolio.recommendations = recommendations;
    await portfolio.save();
    const recommending = currentUser.recommending.filter(
      (id) => !id.equals(portfolio.userId)
    );
    currentUser.recommending = recommending;
    await currentUser.save();
    const user = await User.findOne({ portfolio: req.params.id });
    const notification = {
      text: `${req.user.name} has stopped recommending you`,
      portfolio: req.user.portfolio,
      profileImage: req.user.profileImage,
    };
    user.notifications.push(notification);
    await user.save();
    const response = await formatUserObject(portfolio);
    return res.status(200).send(response);
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
});

router.get("/:id/recommendations", async (req, res) => {
  //retrieves a list of user's recommendations
  try {
    const portfolio = await Portfolio.findById(req.params.id);
    await portfolio.populate("recommendations").execPopulate();
    const user = await User.findById(portfolio.userId);
    await user.populate("recommending").execPopulate();
    return res.status(200).send({
      recommendations: portfolio.recommendations,
      recommending: user.recommending,
    });
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
});

const escapeRegex = (text) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

const formatUserObject = async (portfolio) => {
  //adds user recommending info to the portfolio response object
  let user = await User.findById(portfolio.userId);
  await user
    .populate("recommending", "portfolio profileImage name")
    .execPopulate();
  return { ...portfolio.toObject(), recommending: [...user.recommending] };
};

module.exports = router;
