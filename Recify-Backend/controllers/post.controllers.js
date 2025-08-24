const postModel = require("../models/post.model");

exports.likePost = async (req, res) => {
  try {
    const post = await postModel.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (!post.likes.includes(req.user.id)) {
      post.likes.push(req.user.id);
      await post.save();
      return res.json({ message: "Post liked" });
    }
    res.json({ message: "Already liked" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.unlikePost = async (req, res) => {
  try {
    const post = await postModel.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.likes = post.likes.filter((id) => id.toString() !== req.user.id);
    await post.save();
    res.json({ message: "Post unliked" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

