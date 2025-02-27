import BaseDataHandler from './BaseDataHandler.js';
import postgresConnection from './PostgresConnection.js';
import bcrypt from 'bcryptjs';

class UserObjectHandler extends BaseDataHandler {
    constructor(storageType = 'indexeddb') {
        super(storageType);
        this.dbName = 'TradeLabDB';
        this.storeName = 'users';
        this.db = null;
    }

    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'user_id', autoIncrement: true });
                    store.createIndex('username', 'username', { unique: true });
                    store.createIndex('email', 'email', { unique: true });
                }
            };
        });
    }

    async initPostgres() {
        try {
            await postgresConnection.connect();
        } catch (error) {
            console.error('Failed to initialize PostgreSQL connection:', error);
            throw error;
        }
    }

    async hashPassword(password) {
        return bcrypt.hash(password, 10);
    }

    async verifyPassword(password, hash) {
        return bcrypt.compare(password, hash);
    }

    async create(userData) {
        if (!userData.username || !userData.email || !userData.password) {
            throw new Error('Missing required user data');
        }

        // Hash password
        const passwordHash = await this.hashPassword(userData.password);
        const userDataWithHash = {
            ...userData,
            password_hash: passwordHash,
            registration_date: new Date().toISOString(),
            last_login: new Date().toISOString()
        };
        delete userDataWithHash.password;

        if (this.storageType === 'indexeddb') {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.add(userDataWithHash);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } else {
            const query = `
                INSERT INTO users (username, email, password_hash, first_name, last_name, registration_date, last_login)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING user_id
            `;
            const values = [
                userDataWithHash.username,
                userDataWithHash.email,
                userDataWithHash.password_hash,
                userDataWithHash.first_name || null,
                userDataWithHash.last_name || null,
                userDataWithHash.registration_date,
                userDataWithHash.last_login
            ];

            const result = await postgresConnection.query(query, values);
            return result.rows[0].user_id;
        }
    }

    async read(userId) {
        if (this.storageType === 'indexeddb') {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const request = store.get(userId);
                
                request.onsuccess = () => {
                    const user = request.result;
                    if (user) {
                        delete user.password_hash;
                    }
                    resolve(user);
                };
                request.onerror = () => reject(request.error);
            });
        } else {
            const query = 'SELECT user_id, username, email, first_name, last_name, registration_date, last_login FROM users WHERE user_id = $1';
            const result = await postgresConnection.query(query, [userId]);
            return result.rows[0] || null;
        }
    }

    async update(userId, userData) {
        if (userData.password) {
            userData.password_hash = await this.hashPassword(userData.password);
            delete userData.password;
        }

        if (this.storageType === 'indexeddb') {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                
                const getRequest = store.get(userId);
                getRequest.onsuccess = () => {
                    const existingUser = getRequest.result;
                    if (!existingUser) {
                        reject(new Error('User not found'));
                        return;
                    }

                    const updatedUser = {
                        ...existingUser,
                        ...userData,
                        user_id: userId
                    };

                    const updateRequest = store.put(updatedUser);
                    updateRequest.onsuccess = () => resolve(updateRequest.result);
                    updateRequest.onerror = () => reject(updateRequest.error);
                };
            });
        } else {
            const setClause = Object.keys(userData)
                .map((key, index) => `${key} = $${index + 2}`)
                .join(', ');
            const query = `UPDATE users SET ${setClause} WHERE user_id = $1 RETURNING user_id`;
            const values = [userId, ...Object.values(userData)];
            
            const result = await postgresConnection.query(query, values);
            return result.rows[0].user_id;
        }
    }

    async delete(userId) {
        if (this.storageType === 'indexeddb') {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.delete(userId);
                
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } else {
            const query = 'DELETE FROM users WHERE user_id = $1';
            await postgresConnection.query(query, [userId]);
        }
    }

    async findByUsername(username) {
        if (this.storageType === 'indexeddb') {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const index = store.index('username');
                const request = index.get(username);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } else {
            const query = 'SELECT * FROM users WHERE username = $1';
            const result = await postgresConnection.query(query, [username]);
            return result.rows[0] || null;
        }
    }

    async authenticate(username, password) {
        const user = await this.findByUsername(username);
        if (!user) {
            return null;
        }

        const isValid = await this.verifyPassword(password, user.password_hash);
        if (!isValid) {
            return null;
        }

        // Update last login
        const lastLogin = new Date().toISOString();
        await this.update(user.user_id, { last_login: lastLogin });

        // Return user without password hash
        delete user.password_hash;
        return user;
    }
}

export default UserObjectHandler;
