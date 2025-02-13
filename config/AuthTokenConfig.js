require('dotenv').config();
module.exports = {
    jwtAccessToken: {
        secret: 'URLShort#@2025',
        options: {
            algorithm: 'HS256',
            expiresIn: '7d'
        }
    },
    jwtRefreshToken: {
        secret: 'URLShort#@2025',
        options: {
            algorithm: 'HS256',
            expiresIn: '10d'
        }
    },
}