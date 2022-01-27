import path from 'path'
import { MikroORM } from '@mikro-orm/core'

import { Post, User } from './entities/'
import { __prod__ } from './constants'

export default {
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	dbName: process.env.DB_NAME,
	type: 'postgresql',
	migrations: {
		path: path.join(__dirname, './migrations'),
		pattern: /^[\w-]+\d+\.[tj]s$/
	},
	entities: [Post, User],
	debug: !__prod__
} as Parameters<typeof MikroORM.init>[0]