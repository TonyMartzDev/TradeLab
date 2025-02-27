import BaseDataHandler from './BaseDataHandler.js';
import postgresConnection from './PostgresConnection.js';

class TrackedAccountObjectHandler extends BaseDataHandler {
    constructor(storageType = 'indexeddb') {
        super(storageType);
        this.dbName = 'TradeLabDB';
        this.storeName = 'tracked_accounts';
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
                    const store = db.createObjectStore(this.storeName, { keyPath: 'tracked_account_id', autoIncrement: true });
                    store.createIndex('account_id', 'account_id', { unique: false });
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

    async create(trackedAccountData) {
        if (!trackedAccountData.account_id || !trackedAccountData.tracked_account_name) {
            throw new Error('Missing required tracked account data');
        }

        const newTrackedAccount = {
            ...trackedAccountData,
            created_at: new Date().toISOString()
        };

        if (this.storageType === 'indexeddb') {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.add(newTrackedAccount);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } else {
            const query = `
                INSERT INTO tracked_accounts (account_id, tracked_account_name, broker, account_type, created_at)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING tracked_account_id
            `;
            const values = [
                newTrackedAccount.account_id,
                newTrackedAccount.tracked_account_name,
                newTrackedAccount.broker || null,
                newTrackedAccount.account_type || null,
                newTrackedAccount.created_at
            ];
            const result = await postgresConnection.query(query, values);
            return result.rows[0].tracked_account_id;
        }
    }

    async read(trackedAccountId) {
        if (this.storageType === 'indexeddb') {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const request = store.get(trackedAccountId);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } else {
            const query = 'SELECT * FROM tracked_accounts WHERE tracked_account_id = $1';
            const result = await postgresConnection.query(query, [trackedAccountId]);
            return result.rows[0] || null;
        }
    }

    async update(trackedAccountId, trackedAccountData) {
        if (this.storageType === 'indexeddb') {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                
                const getRequest = store.get(trackedAccountId);
                getRequest.onsuccess = () => {
                    const existingTrackedAccount = getRequest.result;
                    if (!existingTrackedAccount) {
                        reject(new Error('Tracked account not found'));
                        return;
                    }

                    const updatedTrackedAccount = {
                        ...existingTrackedAccount,
                        ...trackedAccountData,
                        tracked_account_id: trackedAccountId
                    };

                    const updateRequest = store.put(updatedTrackedAccount);
                    updateRequest.onsuccess = () => resolve(updateRequest.result);
                    updateRequest.onerror = () => reject(updateRequest.error);
                };
            });
        } else {
            const setClause = Object.keys(trackedAccountData)
                .map((key, index) => `${key} = $${index + 2}`)
                .join(', ');
            const query = `UPDATE tracked_accounts SET ${setClause} WHERE tracked_account_id = $1 RETURNING tracked_account_id`;
            const values = [trackedAccountId, ...Object.values(trackedAccountData)];
            
            const result = await postgresConnection.query(query, values);
            return result.rows[0].tracked_account_id;
        }
    }

    async delete(trackedAccountId) {
        if (this.storageType === 'indexeddb') {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.delete(trackedAccountId);
                
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } else {
            const query = 'DELETE FROM tracked_accounts WHERE tracked_account_id = $1';
            await postgresConnection.query(query, [trackedAccountId]);
        }
    }

    async getTrackedAccountsByAccountId(accountId) {
        if (this.storageType === 'indexeddb') {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const index = store.index('account_id');
                const request = index.getAll(accountId);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } else {
            const query = 'SELECT * FROM tracked_accounts WHERE account_id = $1';
            const result = await postgresConnection.query(query, [accountId]);
            return result.rows;
        }
    }
}

export default TrackedAccountObjectHandler;
