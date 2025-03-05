/**
 * Base class for data handling operations
 */
class BaseDataHandler {
    constructor(storageType = localStorage.getItem('storagePreference') || 'indexeddb') {
        this.storageType = storageType.toLowerCase();
        if (!['indexeddb', 'postgres'].includes(this.storageType)) {
            throw new Error('Invalid storage type. Must be either "indexeddb" or "postgres"');
        }
    }

    async init() {
        if (this.storageType === 'indexeddb') {
            return this.initIndexedDB();
        } else {
            return this.initPostgres();
        }
    }

    async initIndexedDB() {
        throw new Error('initIndexedDB must be implemented by child class');
    }

    async initPostgres() {
        throw new Error('initPostgres must be implemented by child class');
    }

    async create(data) {
        throw new Error('create must be implemented by child class');
    }

    async read(id) {
        throw new Error('read must be implemented by child class');
    }

    async update(id, data) {
        throw new Error('update must be implemented by child class');
    }

    async delete(id) {
        throw new Error('delete must be implemented by child class');
    }

    async query(criteria) {
        throw new Error('query must be implemented by child class');
    }
}

export default BaseDataHandler;
