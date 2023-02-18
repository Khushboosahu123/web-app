/*********************************************************************************
* WEB322 – Assignment 02
* I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part
* of this assignment has been copied manually or electronically from any other source
* (including 3rd party web sites) or distributed to other students.
*
* Name: Khushboo Sahu Student ID: 133232207 Date: 4 Feb 2023
*
* Cyclic Web App URL: https://plum-cute-grasshopper.cyclic.app
*
* GitHub Repository URL: https://github.com/Khushboosahu123/web322-app 
*
********************************************************************************/ 
const express = require("express");
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const fs = require("fs");
const blogService = require("./blog-service.js");
const app = express();

app.use(express.static('public'));

cloudinary.config({
  cloud_name: 'dhbjeoyrc',
  api_key: '219222212183122',
  api_secret: 'tqCHiowoRtaMuy3PxyBRGANVbzQ',
  secure: true
 });
 const upload = multer({});

app.get("/", function(req, res) {
  res.redirect("/about");
});

app.get("/about", function(req, res) {
  res.sendFile(__dirname + "/views/about.html");
});

app.get("/blog", function(req, res) {
  blogService.getPublishedPosts().then((posts) => {
  res.send(posts);
  }).catch((err) => {
  res.status(500).send({ message: err });
  });
  });
  
  app.get('/posts', (req, res) => {
    const category = req.query.category;
    const minDateStr = req.query.minDate;
  
    let posts = blogService.getPosts();
  
    if (category) {
      posts = blogService.getPostsByCategory(category);
    } else if (minDateStr) {
      const minDate = new Date(minDateStr);
      if (!isNaN(minDate)) {
        posts = blogService.getPostsByMinDate(minDate);
      }
    }
  
    res.json(posts);
  });
  
  
  // define the /posts/add route
  app.post('/posts/add', upload.single('featureImage'), (req, res) => {
    if (req.file) {
      let streamUpload = (req) => {
        return new Promise((resolve, reject) => {
          let stream = cloudinary.uploader.upload_stream(
            (error, result) => {
              if (result) {
                resolve(result);
              } else {
                reject(error);
              }
            }
          );
          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
      };
      async function upload(req) {
        let result = await streamUpload(req);
        console.log(result);
        return result;
      }
      upload(req).then((uploaded) => {
        let postData = req.body;
        postData.featureImage = uploaded.url;
        blogService.addPost(postData).then((addedPost) => {
          console.log(`Added post: ${addedPost.title}`);
          res.redirect('/posts');
        });
      });
    } else {
      let postData = req.body;
      blogService.addPost(postData).then((addedPost) => {
        console.log(`Added post: ${addedPost.title}`);
        res.redirect('/posts');
      });
    }
  });

  app.get("/post/:id", (req, res) => {
    const postId = req.params.id;
    blogService.getPostById(postId)
      .then((post) => {
        res.json(post);
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: Unable to get post");
      });
  });
  
  
  app.get("/categories", function(req, res) {
  blogService.getCategories().then((categories) => {
  res.send(categories);
  }).catch((err) => {
  res.status(500).send({ message: err });
  });
  });

app.get("*", function(req, res) {
  res.status(404).send("Page Not Found");
});



blogService.initialize()
  .then(() => {
    app.listen(process.env.PORT || 8080, () => {
      console.log("Server started on http://localhost:8080");
    });
  })
  .catch((error) => {
    console.error(`Error initializing the blog service: ${error}`);
  });
