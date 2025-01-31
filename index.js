const mongoose = require("mongoose");
const cors = require('cors');
const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// AI setup
const genAI = new GoogleGenerativeAI(process.env.GENAI_API_KEY);  // Use the API key from .env
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection URI from .env
const uri = process.env.MONGO_URI;  // Using the value from .env

mongoose
  .connect(uri)
  .then(() => console.log("Connection successful"))
  .catch((err) => console.log("Database connection error:", err));

// Define schemas and routes (existing code follows)

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





app.get("/ai", async (req, res) => {
  try {
      const userInput = req.query?.prompt;

      // Structured prompt to avoid any Markdown or special formatting
      const prompt = `Generate a plain, unformatted response based on the topic: "${userInput}". 
      The response should include:
      - A catchy and engaging title.
      - A well-structured, article-style description (at least 150 words).
      Do not use any Markdown formatting or bold text. The output should be plain text only, formatted as:
      Title: [Your title here]
      Description: [Your detailed description here]`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      // Extract title and description using regex
      const titleMatch = text.match(/Title:\s*(.+)/i);
      const descriptionMatch = text.match(/Description:\s*([\s\S]+)/i);

      const title = titleMatch ? titleMatch[1].trim() : "Generated Title";
      const description = descriptionMatch ? descriptionMatch[1].trim() : "Generated Description";

      res.send({ title, description });
  } catch (error) {
      res.status(500).send({ error: "AI response failed" });
  }
});



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
    post.comments.push(newComment); 
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


app.patch('/api/posts/:id/vote', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, userId } = req.body;

    if (!['upVote', 'downVote'].includes(type)) {
      return res.status(400).json({ error: "Invalid vote type." });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }

    // Check if the user has already voted
    if (post.votedBy?.[userId]) {
      return res.status(400).json({ error: "You have already voted." });
    }

    // Update vote count and store user vote
    const update = {
      $inc: { [type]: 1 },
      $set: { [`votedBy.${userId}`]: type }, // Store user's vote
    };

    const updatedPost = await Post.findByIdAndUpdate(id, update, { new: true });

    res.status(200).json({ message: "Vote recorded successfully", post: updatedPost });
  } catch (error) {
    console.error("Error updating vote:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});



// Start the server
app.listen(3000, () => {
  console.log("App listening at port 3000");
});