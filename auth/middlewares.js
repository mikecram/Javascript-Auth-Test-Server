const jwt = require('jsonwebtoken');

function checkTokenSetUser(req, res, next) {
    const authHeader = req.get('authorization');
    console.log(authHeader);
    if (authHeader) {
        console.log(authHeader);
        const token = authHeader.split(' ')[1];
        
        if (token) {
            jwt.verify(token, process.env.TOKEN_SECRET, (error, user) => {
                if (error) {
                    console.log(error);
                } 
                req.user = user;
                console.log(user);
                next();
                
            });
        } else {
            next();
        }
    } else {
        next();
    }
}

module.exports = {
    checkTokenSetUser,
};