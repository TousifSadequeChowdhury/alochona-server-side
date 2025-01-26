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

// Define a schema
const postSchema = new mongoose.Schema({
  authorImage: { type: String, required: true },
  authorName: { type: String, required: true },
  authorEmail: { type: String, required: true },
  postTitle: { type: String, required: true },
  postDescription: { type: String, required: true },
  tag: { type: String, required: true },
  upVote: { type: Number, required: true },
  downVote: { type: Number, required: true },
  date: { type: Date, default: Date.now },

});

// Create a model
const Post = mongoose.model("Post", postSchema);

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
  



// Start the server
app.listen(3000, () => {
  console.log("App listening at port 3000");
});