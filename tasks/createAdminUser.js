// Creates an admin user with default password
// 'npm run seed:admin' creates an admin user with 'admin' username and default password defined in .env
// - It only creates an admin if an admin doesn't already exist
const dotenv = require('dotenv');
dotenv.config();

const db = require('../db/connection');
const bcrypt = require('bcryptjs');
const users = db.get('users');

async function createAdminUser() {
    try {
        const user = await users.findOne({ role: 'admin' });
        if (!user) {
            await users.insert({
                username: 'admin',
                password: await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD, 8),
                active: true,
                role: 'admin'
            });
            console.log('Admin user created!');
        } else {
            console.log('Admin user already exists!');

        }
    } catch (error) {
        console.error(error);
    } finally {
        db.close();
    }
}

createAdminUser();