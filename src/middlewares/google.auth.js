import { Router } from "express";
import axios from "axios";
const router = Router();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || '<http://localhost:3000/auth/google/callback>';

// Initiates the Google Login flow
const authGoogle = async (req, res) => {
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=profile email`;
  console.log(url);
  res.redirect(url);
};

// Callback URL for handling the Google Login response
const authGoogleCallback = async (req, res) => {
    const { code } = req.query;
    console.log(code);
    try {
      // Exchange authorization code for access token
      const { data } = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      });
      
      console.log(data, "data");
  
      const { access_token, id_token } = data;
  
      // Use access_token or id_token to fetch user profile
      const x = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
    
      console.log("x", x);

      // Code to handle user authentication and retrieval using the profile data
  
      res.redirect('/');
    } catch (error) {
      console.error('Error:', error.response.data.error);
      res.redirect('/login');
    }
  };
  
  // Logout route
  router.get('/logout', (req, res) => {
    // Code to handle user logout
    res.redirect('/login');
  });
  
 export {
     authGoogle, authGoogleCallback
 }