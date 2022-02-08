import {
	Arg,
	Ctx,
	Field,
	FieldResolver,
	InputType,
	Int,
	Mutation, ObjectType,
	Query,
	Resolver,
	Root,
	UseMiddleware
} from 'type-graphql'
import { getConnection } from 'typeorm'

import { isAuth } from '../middleware/isAuth'
import { Post, Updoot } from '../entities'
import { MyContext } from '../types'

@InputType()
class PostInput {
	@Field()
	title: string
	@Field()
	text: string
}

@ObjectType()
class PaginatedPosts {
	@Field(() => [Post])
	posts: Post[]
	@Field()
	hasMore: boolean
}

@Resolver(Post)
export default class PostResolver {
	@FieldResolver(() => String)
	textSnippet(
		@Root() root: Post
	) {
		return root.text.slice(0, 300)
	}

	@Mutation(() => Boolean)
	@UseMiddleware(isAuth)
	async vote(
		@Arg('postId', () => Int) postId: number,
		@Arg('value', () => Int) value: number,
		@Ctx() {req}: MyContext
	) {
		const userId = req.session.userId
		const isUpdoot = value !== -1
		const computedValue = isUpdoot ? 1 : -1

		const updoot = await Updoot.findOne({where: {postId, userId}})

		if (updoot && updoot.value !== computedValue) {
			await getConnection().transaction(async tm => {
				await tm.query(`UPDATE updoot
                                SET value = $1
                                WHERE "postId" = $2
                                  AND "userId" = $3`, [computedValue, postId, userId])
				await tm.query(`UPDATE post
                                SET points = points + $1
                                WHERE id = $2`, [2 * computedValue, postId])
			})
		} else if (!updoot) {
			await getConnection().transaction(async tm => {
				await tm.query(`INSERT INTO updoot("userId", "postId", "value")
                                VALUES ($1, $2, $3);`, [userId, postId, computedValue])
				await tm.query(`UPDATE post
                                SET points = points + $1
                                WHERE id = $2`, [computedValue, postId])
			})
		}
		return true
	}

	@Query(() => PaginatedPosts)
	async posts(
		@Arg('limit', () => Int) limit: number,
		@Arg('cursor', () => String, {nullable: true}) cursor: string | null,
		@Ctx() {req}: MyContext
	): Promise<PaginatedPosts> {
		const userId = await req.session.userId
		console.log(req.session)
		const realLimit = Math.min(50, limit) + 1
		const replacements: (number | Date)[] = [realLimit]
		if (cursor) {
			replacements.push(new Date(parseInt(cursor)))
		}
		const posts = await getConnection().query(`
            SELECT p.*,
                   json_build_object(
                           'id', u.id,
                           'username', u.username,
                           'email', u.email,
                           'createdAt', u."createdAt",
                           'updatedAt', u."updatedAt"
                       ) creator,
                   ${userId ? `(SELECT value from updoot WHERE "userId" = ${userId} AND "postId" = p.id) "voteStatus"` : 'NULL AS "voteStatus"'}
            FROM post p
                     INNER JOIN public.user u ON u.id = p."creatorId"
                ${cursor ? `WHERE p."createdAt" < $2` : ''}
            ORDER BY p."createdAt" DESC
                LIMIT $1
		`, replacements)
		return {
			posts: posts.slice(0, realLimit - 1),
			hasMore: posts.length > limit
		}
	}


	@Query(() => Post, {nullable: true})
	post(
		@Arg('id', () => Int)
			id: number
	):
		Promise<Post | undefined> {
		return Post.findOne(id)
	}

	@Mutation(() => Post)
	@UseMiddleware(isAuth)
	async createPost(
		@Arg('input')
			input: PostInput,
		@Ctx() {req}: MyContext
	):
		Promise<Post> {
		return Post.create({
			...input,
			creatorId: req.session.userId
		}).save()
	}

	@Mutation(() => Post, {nullable: true})
	async updatePost(
		@Arg('id', () => Int)
			id: number,
		@Arg('title', () => String, {nullable: true})
			title: string
	):
		Promise<Post | null> {
		const post = await Post.findOne(id)
		if (!
			post
		) {
			return null
		}
		if (title) {
			post.title = title
			await Post.update({id}, {title})
		}
		return post
	}

	@Mutation(() => Boolean)
	async deletePost(
		@Arg('id', () => Int)
			id: number
	):
		Promise<boolean> {
		await Post.delete(id)
		return true
	}
}