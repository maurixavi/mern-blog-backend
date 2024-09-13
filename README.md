# MERN Blog API

This repository contains the backend API for a blog application built using the MERN stack (MongoDB, Express.js, React, Node.js). The API provides endpoints for user management, blog post creation, and interaction, with integrated image handling through Cloudinary.

The frontend client for this application is available [here](https://mern-blog-client-torr.onrender.com). This client interacts with this API to deliver a seamless blogging experience.

## Features

- **User Management**: 
  - **Registration**: Allows new users to register with a username and password. Passwords are securely hashed before storage.
  - **Login**: Authenticates users and provides a JWT for session management.
  - **Profile Retrieval**: Enables users to retrieve their profile information using the JWT.
  - **Logout**: Provides a mechanism to clear the JWT and log out the user.

- **Blog Post Management**: 
  - **Create Post**: Users can create new blog posts, including uploading images which are handled by Cloudinary.
  - **Update Post**: Allows users to update their existing blog posts and associated images.
  - **Retrieve Posts**: Fetch a list of recent blog posts or a specific post by ID.
  - **Delete Post**: Enables the deletion of posts by their authors.

- **Image Handling**: 
  - **Cloudinary Integration**: Handles image uploads and storage through Cloudinary, ensuring efficient management and retrieval.

## Technologies Used

- **Node.js**: JavaScript runtime for building the server-side application.
- **Express.js**: Web application framework for Node.js, used to manage routing and middleware.
- **MongoDB**: NoSQL database for storing user and post data.
- **Mongoose**: ODM (Object Data Modeling) library for MongoDB and Node.js.
- **Cloudinary**: Cloud-based image storage and manipulation service.
- **JWT (JSON Web Tokens)**: Secure authentication mechanism for user sessions.
- **bcryptjs**: Library for hashing user passwords.
- **cors**: Middleware for handling Cross-Origin Resource Sharing.
- **express-fileupload**: Middleware for handling file uploads.
- **dotenv**: Loads environment variables from a `.env` file for configuration.

## Project Setup

To set up and run the API locally:

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd <repository-directory>```

2. **Install dependencies**:
   - Use `npm install` to install dependencies.

3. **Configure Environment Variables**:
   - Create a `.env` file and include the environment variables. 

4. **Start the server**:
   - Use `npm start` to run the server.
