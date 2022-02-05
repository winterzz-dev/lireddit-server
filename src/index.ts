import 'dotenv/config'
import 'reflect-metadata'

import express from 'express'
import Redis from 'ioredis'
import session from 'express-session'
import connectRedis from 'connect-redis'
import cors from 'cors'

import {createConnection} from 'typeorm'

import { ApolloServer } from 'apollo-server-express'
import { buildSchema } from 'type-graphql'

import { PostResolver, UserResolver } from './resolvers'
import { __prod__, ALLOWED_ORIGINS, BLOCKED_BY_CORS_MESSAGE, COOKIE_NAME } from './constants'
import { MyContext } from './types'
import { Post, User } from './entities'

const main = async () => {
	await createConnection({
		type: 'postgres',
		database: process.env.DB_NAME,
		username: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		logging: true,
		synchronize: true,
		entities: [Post, User]
	})

	const RedisStore = connectRedis(session)
	const redis = new Redis({
		host: 'localhost',
		port: 6379,
		db: 0
	})

	const app = express()
	app.use(cors({
		origin: function (origin, callback) {
			if (!origin) return callback(null, true)
			if (ALLOWED_ORIGINS.indexOf(origin) === -1) {
				return callback(new Error(BLOCKED_BY_CORS_MESSAGE), false)
			}
			return callback(null, true)
		},
		credentials: true
	}))
	app.use(session({
		name: COOKIE_NAME,
		store: new RedisStore({
			client: redis,
			disableTouch: true
		}),
		cookie: {
			maxAge: Number(process.env.COOKIE_MAX_AGE),
			httpOnly: true,
			sameSite: 'lax',
			secure: __prod__
		},
		saveUninitialized: false,
		secret: process.env.SESSION_SECRET as string,
		resave: false
	}))
	const apolloServer = new ApolloServer({
		schema: await buildSchema({
			resolvers: [PostResolver, UserResolver],
			validate: false
		}),
		context: ({req, res}): MyContext => ({req, res, redis})
	})

	await apolloServer.start()
	apolloServer.applyMiddleware({
		app, cors: false
	})
	app.get('/', (_, res) => {
		res.send('Hello')
	})
	const port = process.env.BACKEND_PORT || 4000

	app.listen(port, () => {
		console.log(`Listening at port:${port} 🚀🚀🚀`)
	})
}

main().then()