import {DatabaseSync} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
export function openDatabase(filename){if(filename!==':memory:')mkdirSync(path.dirname(filename),{recursive:true,mode:0o700});const db=new DatabaseSync(filename);db.exec(`
PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE,name TEXT NOT NULL,password_hash TEXT NOT NULL,verified INTEGER NOT NULL DEFAULT 0,created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS companies(id TEXT PRIMARY KEY,name TEXT NOT NULL,stripe_customer TEXT UNIQUE,stripe_subscription TEXT UNIQUE,plan TEXT,status TEXT NOT NULL DEFAULT 'unsubscribed',paid_until INTEGER NOT NULL DEFAULT 0,created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS memberships(user_id TEXT PRIMARY KEY REFERENCES users(id),company_id TEXT NOT NULL REFERENCES companies(id),role TEXT NOT NULL CHECK(role IN ('owner','inspector')),created INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS memberships_company ON memberships(company_id);
CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),csrf TEXT NOT NULL,expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS tokens(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),purpose TEXT NOT NULL,expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS invites(token_hash TEXT PRIMARY KEY,company_id TEXT NOT NULL REFERENCES companies(id),email TEXT NOT NULL,expires INTEGER NOT NULL,created INTEGER NOT NULL,UNIQUE(company_id,email));
CREATE TABLE IF NOT EXISTS audits(id TEXT NOT NULL,company_id TEXT NOT NULL REFERENCES companies(id),author_id TEXT NOT NULL REFERENCES users(id),payload TEXT NOT NULL,version INTEGER NOT NULL,updated INTEGER NOT NULL,PRIMARY KEY(company_id,id));
CREATE TABLE IF NOT EXISTS checkout_sessions(company_id TEXT PRIMARY KEY REFERENCES companies(id),session_id TEXT NOT NULL,plan TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS ppe_catalogs(company_id TEXT PRIMARY KEY REFERENCES companies(id),payload TEXT NOT NULL,version INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS ppe_requests(id TEXT NOT NULL,company_id TEXT NOT NULL REFERENCES companies(id),author_id TEXT NOT NULL REFERENCES users(id),requester_name TEXT NOT NULL,payload TEXT NOT NULL,fingerprint TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN ('pending','approved','declined','issued')),version INTEGER NOT NULL,submitted INTEGER NOT NULL,manager_note TEXT NOT NULL DEFAULT '',reviewer_name TEXT NOT NULL DEFAULT '',reviewed INTEGER,PRIMARY KEY(company_id,id));
CREATE INDEX IF NOT EXISTS ppe_requests_author ON ppe_requests(company_id,author_id);
CREATE TABLE IF NOT EXISTS stripe_events(id TEXT PRIMARY KEY,processed INTEGER NOT NULL);
`);return db;}
export function transaction(db,callback){db.exec('BEGIN IMMEDIATE');try{const result=callback();db.exec('COMMIT');return result;}catch(error){db.exec('ROLLBACK');throw error;}}
