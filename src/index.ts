import 'dotenv/config'
import 'reflect-metadata'

import { MikroORM } from '@mikro-orm/core'
import microConfig from './mikro-orm.config'
import express from 'express'
import { ApolloServer } from 'apollo-server-express'
import { buildSchema } from 'type-graphql'

import { PostResolver } from './resolvers/post'
import { UserResolver } from './resolvers/user'

const main = async () => {
	const orm = await MikroORM.init(microConfig)
	await orm.getMigrator().up()

	const app = express()
	const apolloServer = new ApolloServer({
		schema: await buildSchema({
			resolvers: [PostResolver, UserResolver],
			validate: false
		}),
		context: () => ({em: orm.em})
	})

	await apolloServer.start()
	apolloServer.applyMiddleware({app})
	app.get('/', (_, res) => {
		res.send('Hello')
	})
	const port = process.env.BACKEND_PORT || 4000

	app.listen(port, () => {
		console.log(`Listening at port:${port} 🚀🚀🚀`)
	})
}

main().then()