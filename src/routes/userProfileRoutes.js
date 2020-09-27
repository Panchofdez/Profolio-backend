const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = mongoose.model("User");

const requireAuth = require("../middleware/requireAuth");

router.use(requireAuth);

router.get("/user", async (req, res) => {
  //retrieves a user's profile info and their unread notifications
  try {
    const user = await User.findById(req.user._id);
    const notifications = user.notifications.filter((n) => n.read === false);
    res
      .status(200)
      .send({
        userId: user._id,
        name: user.name,
        profileImage: user.profileImage,
        notifications,
        portfolio: user.portfolio,
      });
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
});

router.put("/user/notifications/:id", async (req, res) => {
  //updates a a notification to be read
  try {
    const user = await User.findById(req.user._id);
    const notifications = user.notifications.map((n) => {
      if (n._id.equals(req.params.id)) {
        n.read = true;
      }
      return n;
    });
    user.notifications = notifications;
    await user.save();
    const unread = user.notifications.filter((n) => n.read === false);
    res
      .status(200)
      .send({
        userId: user._id,
        name: user.name,
        profileImage: user.profileImage,
        notifications: unread,
      });
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});
router.put("/user/notifications", async (req, res) => {
  //sets all unread notifications to be true
  try {
    const user = await User.findById(req.user._id);
    const notifications = user.notifications.map((n) => {
      if (n.read === false) {
        n.read = true;
      }
      return n;
    });
    user.notifications = notifications;
    await user.save();
    const unread = user.notifications.filter((n) => n.read === false);
    res
      .status(200)
      .send({
        userId: user._id,
        name: user.name,
        profileImage: user.profileImage,
        notifications: unread,
      });
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
});

router.get("/notifications", async (req, res) => {
  //get's all the users notifications read and unread
  try {
    const user = await User.findById(req.user._id);
    return res.status(200).send(user.notifications);
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
});

router.delete("/notifications/:id", async (req, res) => {
  //deletes a notification
  try {
    const user = await User.findById(req.user._id);
    const notifications = user.notifications.filter(
      (n) => !n._id.equals(req.params.id)
    );
    user.notifications = notifications;
    await user.save();
    return res.status(200).send(user.notifications);
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
});

router.put("/notifications/notification/:id", async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const notifications = user.notifications.map((n) => {
      if (n._id.equals(req.params.id)) {
        n.read = true;
      }
      return n;
    });
    user.notifications = notifications;
    await user.save();

    res.status(200).send(user.notifications);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

router.put("/notifications/readall", async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const notifications = user.notifications.map((n) => {
      if (n.read === false) {
        n.read = true;
      }
      return n;
    });
    user.notifications = notifications;
    await user.save();
    res.status(200).send(user.notifications);
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
});

module.exports = router;
