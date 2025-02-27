import BaseDataHandler from './BaseDataHandler.js';
import postgresConnection from './PostgresConnection.js';

class AccountObjectHandler extends BaseDataHandler {
    constructor(storageType = 'indexeddb') {
        super(storageType);
        this.dbName = 'TradeLabDB';
        this.storeName = 'accounts';
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
                    const store = db.createObjectStore(this.storeName, { keyPath: 'account_id', autoIncrement: true });
                    store.createIndex('user_id', 'user_id', { unique: false });
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

    async create(accountData) {
        if (!accountData.user_id || !accountData.account_name) {
            throw new Error('Missing required account data');
        }

        const newAccount = {
            ...accountData,
            created_at: new Date().toISOString()
        };

        if (this.storageType === 'indexeddb') {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.add(newAccount);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } else {
            const query = `
                INSERT INTO accounts (user_id, account_name, created_at)
                VALUES ($1, $2, $3)
                RETURNING account_id
            `;
            const values = [newAccount.user_id, newAccount.account_name, newAccount.created_at];
            const result = await postgresConnection.query(query, values);
            return result.rows[0].account_id;
        }
    }

    async read(accountId) {
        if (this.storageType === 'indexeddb') {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const request = store.get(accountId);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } else {
            const query = 'SELECT * FROM accounts WHERE account_id = $1';
            const result = await postgresConnection.query(query, [accountId]);
            return result.rows[0] || null;
        }
    }

    async update(accountId, accountData) {
        if (this.storageType === 'indexeddb') {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                
                const getRequest = store.get(accountId);
                getRequest.onsuccess = () => {
                    const existingAccount = getRequest.result;
                    if (!existingAccount) {
                        reject(new Error('Account not found'));
                        return;
                    }

                    const updatedAccount = {
                        ...existingAccount,
                        ...accountData,
                        account_id: accountId
                    };

                    const updateRequest = store.put(updatedAccount);
                    updateRequest.onsuccess = () => resolve(updateRequest.result);
                    updateRequest.onerror = () => reject(updateRequest.error);
                };
            });
        } else {
            const setClause = Object.keys(accountData)
                .map((key, index) => `${key} = $${index + 2}`)
                .join(', ');
            const query = `UPDATE accounts SET ${setClause} WHERE account_id = $1 RETURNING account_id`;
            const values = [accountId, ...Object.values(accountData)];
            
            const result = await postgresConnection.query(query, values);
            return result.rows[0].account_id;
        }
    }

    async delete(accountId) {
        if (this.storageType === 'indexeddb') {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.delete(accountId);
                
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } else {
            const query = 'DELETE FROM accounts WHERE account_id = $1';
            await postgresConnection.query(query, [accountId]);
        }
    }

    async getAccountsByUserId(userId) {
        if (this.storageType === 'indexeddb') {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const index = store.index('user_id');
                const request = index.getAll(userId);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } else {
            const query = 'SELECT * FROM accounts WHERE user_id = $1';
            const result = await postgresConnection.query(query, [userId]);
            return result.rows;
        }
    }
}

export default AccountObjectHandler;
