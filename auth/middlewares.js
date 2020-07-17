// This contains all custom middleware to be used in the server index stack

const jwt = require('jsonwebtoken');

/* Create a function to check for tokens to determine whether or not a user is logged in:
    - Check for token in localStorage with header 'authorization'
    - If token exists, verify the token with 'jwt'
    - If token is verified, set 'req.user' to 'user'
        - This is done so that user info can be accessed later using 'req.user' 
        - This also helps to display only data relevant to the user on other pages 
*/
function checkTokenSetUser(req, res, next) {
    // Get info stored in 'authorization' header in localStorage in browser
    const authHeader = req.get('authorization');
    // Display in console for debugging purposes
    console.log(authHeader);
    // If there was a token stored in 'authHeader':
    if (authHeader) {
        // Create variable 'token'
        // Split out everything after the space in: 'Bearer thisIsATokenExample'
        const token = authHeader.split(' ')[1];
        // If 'token' exists, verify using 'jwt'
        if (token) {
            jwt.verify(token, process.env.TOKEN_SECRET, (error, user) => {
                
                if (error) {
                    console.log(error);
                } 
                // Once token is verified, set 'req.user' to 'user' to be used elsewhere in the stack
                req.user = user;
                console.log(user);
                next();
                
            });
          // If 'token' doesn't exist, go to next thing 
        } else {
            next();
        }
      // If 'authHeader' doesn't exist, go to next thing  
    } else {
        next();
    }
}

/* This function checks if the user is logged in by checking if 'req.user' exists.
    - If 'req.user' doesn't exist, return 401 error and send to error handler in server index
    - NOTE: The 'req.user' object will exist if the function 'checkTokenSetUser' was successful 
*/
function isLoggedIn(req,res,next) {
    if (req.user) {
        next();
    } else {
        const error = new Error('❌ Un-Authorized ❌');
        res.status(401);
        next(error);
    }
}

// Export these functions to be used by other server files
module.exports = {
    checkTokenSetUser,
    isLoggedIn
};