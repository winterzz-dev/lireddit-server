import 'dotenv/config'
import 'reflect-metadata'

import express from 'express'
// @ts-ignore
import redis from 'redis'
import session from 'express-session'
import connectRedis, { Client } from 'connect-redis'
import cors from 'cors'

import { MikroORM } from '@mikro-orm/core'
import microConfig from './mikro-orm.config'

import { ApolloServer } from 'apollo-server-express'
import { buildSchema } from 'type-graphql'

import { PostResolver, UserResolver } from './resolvers'
import { __prod__ } from './constants'
import { MyContext } from './types'

const main = async () => {
	const orm = await MikroORM.init(microConfig)
	await orm.getMigrator().up()

	const RedisStore = connectRedis(session)
	const redisClient: Client = redis.createClient({
		host: 'localhost',
		port: 6379,
		db: 0
	}) as unknown as Client

	const app = express()
	app.use(cors({
		origin: 'http://localhost:3000',
		credentials: true
	}))
	app.use(session({
		name: 'qid',
		store: new RedisStore({
			client: redisClient,
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
		context: ({req, res}): MyContext => ({em: orm.em, req, res})
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