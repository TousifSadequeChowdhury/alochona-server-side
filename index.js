const cors = require('cors');
const express = require("express");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection URI
const uri = "mongodb+srv://alochonaadmin:abcd1234@cluster0.8emp0.mongodb.net/AllPost?retryWrites=true&w=majority&appName=Cluster0";

mongoose
  .connect(uri)
  .then(() => console.log("Connection successful"))
  .catch((err) => console.log("Database connection error:", err));
  const commentSchema = new mongoose.Schema({
    authorName: { type: String, required: true },
    authorEmail: { type: String, required: true },
    text: { type: String, required: true },
    date: { type: Date, default: Date.now }
  });
// Define a schema
const postSchema = new mongoose.Schema({
  authorImage: { type: String, required: true },
  authorName: { type: String, required: true },
  authorEmail: { type: String, required: true },
  postTitle: { type: String, required: true },
  postDescription: { type: String, required: true },
  tag: [{ type: String, required: true }],
  upVote: { type: Number, required: true },
  downVote: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  comments: [commentSchema], // Embedded comments

});

// Create a model
const Post = mongoose.model("Post", postSchema);


app.post('/api/posts/:id/comments', async (req, res) => {
  try {
    const { id } = req.params; // Post ID
    const { authorName, authorEmail, text } = req.body;

    if (!authorName || !authorEmail || !text) {
      return res.status(400).json({ error: "All fields are required for a comment." });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }

    const newComment = { authorName, authorEmail, text };
    post.comments.push(newComment); // Add comment to the post's comments array
    await post.save();

    res.status(201).json({ message: "Comment added successfully.", comment: newComment });
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ error: "Failed to add comment." });
  }
});


app.get('/api/posts/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }

    res.status(200).json({ comments: post.comments });
  } catch (err) {
    console.error("Error fetching comments:", err);
    res.status(500).json({ error: "Failed to fetch comments." });
  }
});

// Create an API endpoint to handle POST requests
app.post('/api/posts', async (req, res) => {
  try {
  const { 
      postTitle, 
      postDescription, 
      tag, 
      upVote, 
      downVote, 
      authorImage, 
      authorName, 
      authorEmail 
  } = req.body;

  if (!postTitle || !postDescription || !authorEmail || !authorName || !authorImage || upVote === undefined || downVote === undefined) {
      return res.status(400).json({ error: "All fields are required." });
  }


 
      const newPost = new Post({
          authorImage,
          authorName,
          authorEmail,
          postTitle,
          postDescription,
          tag,
          upVote,
          downVote,
      });

        const savedPost = await newPost.save();
      res.status(201).json(newPost);
  } catch (err) {
      res.status(500).json({ error: "Failed to create post." });
  }
});





// Create a GET API endpoint to fetch all posts
app.get("/api/posts", async (req, res) => {
    try {
      // Fetch all posts from the database
      const posts = await Post.find().sort({ date: -1 });  // Sort by date, latest first

      res.status(200).json({ message: "Posts retrieved successfully", posts });
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  

// Get Post by ID
app.get('/api/posts/:id', async (req, res) => { // Changed to /api/posts/:id
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json({ post }); // Wrap the post in an object to match frontend expectation
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


  // Create a DELETE API endpoint to delete a post
app.delete("/api/posts/:id", async (req, res) => {
  try {
    const { id } = req.params; // Get postId from the request parameters

    // Find and delete the post by its ID
    const deletedPost = await Post.findByIdAndDelete(id);

    // If no post was found, return an error message
    if (!deletedPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Send response after successful deletion
    res.status(200).json({ message: "Post deleted successfully", post: deletedPost });
  } catch (error) {
    // Log error details for debugging
    console.error("Error deleting post:", error);

    // Send error response
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
});


// Create a PATCH API endpoint to update a post
// PATCH to update a post by ID
app.patch('/api/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;  // Get the post ID from the URL
    const { postTitle, postDescription, tag, upVote, downVote } = req.body;

    // Find and update the post by ID
    const updatedPost = await Post.findByIdAndUpdate(id, {
      postTitle,
      postDescription,
      tag,
      upVote,
      downVote
    }, { new: true });  // Return the updated post

    if (!updatedPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.status(200).json({ message: "Post updated successfully", post: updatedPost });
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start the server
app.listen(3000, () => {
  console.log("App listening at port 3000");
});