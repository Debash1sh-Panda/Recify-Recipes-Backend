import postModel from "../models/post.model";
import userModel from "../models/user.model";

exports.getFeed = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1; // page number
    const limit = parseInt(req.query.limit) || 10; // posts per page
    const skip = (page - 1) * limit;

    // 1. Get current user with following list
    const user = await userModel.findById(userId);

    // 2. Find posts from following users
    const followingPosts = await Post.find({ user: { $in: user.following } })
      .populate("user", "username profilePic")
      .sort({ createdAt: -1 })
      .limit(limit * 2); // over-fetching to ensure ratio after shuffle

    // 3. Find random posts from unfollowed users
    const randomPosts = await postModel.aggregate([
      { $match: { user: { $nin: [...user.following, user._id] } } },
      { $sample: { size: limit * 2 } }, // random sampling
    ]);

    // Populate user details for random posts
    const populatedRandom = await postModel.populate(randomPosts, {
      path: "user",
      select: "username profilePic",
    });

    // 4. Ratio logic (e.g., 70% following + 30% random)
    const totalNeeded = limit;
    const followingCount = Math.floor(totalNeeded * 0.7);
    const randomCount = totalNeeded - followingCount;

    let mixedFeed = [
      ...followingPosts.slice(0, followingCount),
      ...populatedRandom.slice(0, randomCount),
    ];

    // 5. Shuffle feed so posts are mixed
    mixedFeed = mixedFeed.sort(() => Math.random() - 0.5);

    // 6. Pagination: apply skip/limit AFTER ratio mixing
    const paginatedFeed = mixedFeed.slice(skip, skip + limit);

    res.json({
      page,
      limit,
      count: paginatedFeed.length,
      feed: paginatedFeed,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getExploreFeed = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Calculate how many to skip
    const skip = (page - 1) * limit;

    // Popularity formula = likes + comments*2 (you can tweak weights)
    const posts = await postModel.aggregate([
      {
        $addFields: {
          popularityScore: {
            $add: [
              { $size: "$likes" }, // likes count
              { $multiply: [2, { $size: "$comments" }] }, // comments count weighted *2
            ],
          },
        },
      },
      { $sort: { popularityScore: -1, createdAt: -1 } }, // sort by popularity + fallback recency
      { $skip: skip },
      { $limit: parseInt(limit) },
    ]);

    // Populate user details
    const populatedPosts = await postModel.populate(posts, {
      path: "user",
      select: "username profilePic",
    });

    res.json({
      page: Number(page),
      limit: Number(limit),
      count: populatedPosts.length,
      posts: populatedPosts,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
