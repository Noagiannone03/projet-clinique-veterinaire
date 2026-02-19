const PREFIX = 'vetcare_';
const VERSION_KEY = `${PREFIX}version`;
const CURRENT_VERSION = 1;

export const storage = {
    get<T>(key: string): T | null {
        try {
            const raw = localStorage.getItem(`${PREFIX}${key}`);
            if (raw === null) return null;
            return JSON.parse(raw) as T;
        } catch {
            return null;
        }
    },

    set<T>(key: string, value: T): void {
        try {
            localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
        } catch {
            console.warn(`Failed to save ${key} to localStorage`);
        }
    },

    remove(key: string): void {
        localStorage.removeItem(`${PREFIX}${key}`);
    },

    clear(): void {
        const keys = Object.keys(localStorage).filter((k) => k.startsWith(PREFIX));
        keys.forEach((k) => localStorage.removeItem(k));
    },

    getVersion(): number {
        const v = localStorage.getItem(VERSION_KEY);
        return v ? parseInt(v, 10) : 0;
    },

    setVersion(v: number): void {
        localStorage.setItem(VERSION_KEY, String(v));
    },

    migrate(): void {
        const currentVersion = this.getVersion();
        if (currentVersion < CURRENT_VERSION) {
            this.setVersion(CURRENT_VERSION);
        }
    },
};
