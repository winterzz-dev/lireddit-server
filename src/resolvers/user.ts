import { Arg, Ctx, Field, Mutation, ObjectType, Query, Resolver } from 'type-graphql'
import argon2 from 'argon2'
import { randomUUID } from 'crypto'

import { User } from '../entities'
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from '../constants'
import { MyContext } from '../types'
import { UsernamePasswordInput } from '../types/usernamePasswordInput'
import { validateRegister } from '../utils/validateRegister'
import { sendEmail } from '../utils/sendEmail'

@ObjectType()
class FieldError {
	@Field()
	field: string
	@Field()
	message: string
}

@ObjectType()
class UserResponse {
	@Field(() => [FieldError], {nullable: true})
	errors?: FieldError[]
	@Field(() => User, {nullable: true})
	user?: User
}

@Resolver()
export default class UserResolver {
	@Mutation(() => UserResponse)
	async changePassword(
		@Arg('token') token: string,
		@Arg('newPassword') newPassword: string,
		@Ctx() {redis, em, req}: MyContext
	): Promise<UserResponse> {
		if (newPassword.length <= 3) {
			return {
				errors: [{
					field: 'newPassword',
					message: 'length must be greater than 3'
				}]
			}
		}
		const userId = await redis.get(`${FORGET_PASSWORD_PREFIX}${token}`)
		if (!userId) {
			return {
				errors: [{
					field: 'token',
					message: 'token expired'
				}]
			}
		}
		const user = await em.findOne(User, {id: parseInt(userId)})
		if(!user) {
			return {
				errors: [{
					field: 'token',
					message: 'user no longer exists'
				}]
			}
		}
		user.password = await argon2.hash(newPassword)
		await em.persistAndFlush(user)
		await redis.del(`${FORGET_PASSWORD_PREFIX}${token}`)
		req.session.userId = user.id
		return {user}
	}

	@Mutation(() => Boolean)
	async forgotPassword(
		@Arg('email') email: string,
		@Ctx() {em, redis}: MyContext
	): Promise<boolean> {
		const user = await em.findOne(User, {email})
		if (!user) {
			return true
		}
		const token = randomUUID()
		await redis.set(`${FORGET_PASSWORD_PREFIX}${token}`, user.id, 'ex', 1000 * 60 * 60 * 24 * 3)
		await sendEmail(email, `<a href="http://localhost:3000/change-password/${token}">reset password</a>`)
		return true
	}

	@Query(() => User, {nullable: true})
	async me(@Ctx() {req, em}: MyContext) {
		if (!req.session.userId) {
			return null
		}

		return await em.findOne(User, {id: req.session.userId})
	}

	@Mutation(() => UserResponse)
	async register(
		@Arg('options', () => UsernamePasswordInput) options: UsernamePasswordInput,
		@Ctx() {em, req}: MyContext
	): Promise<UserResponse> {
		const errors = validateRegister(options)
		if (errors) {
			return {errors}
		}
		const hashedPassword = await argon2.hash(options.password)
		const user = em.create(User, {
			username: options.username,
			email: options.email,
			password: hashedPassword
		})
		try {
			await em.persistAndFlush(user)
		} catch (e) {
			if (e.code === '23505' || e.detail.includes('already exists')) {
				return {
					errors: [{
						field: 'username',
						message: 'username already taken'
					}]
				}
			}
		}

		req.session!.userId = user.id

		return {
			user
		}
	}

	@Mutation(() => UserResponse)
	async login(
		@Arg('usernameOrEmail') usernameOrEmail: string,
		@Arg('password') password: string,
		@Ctx() {em, req}: MyContext
	): Promise<UserResponse> {
		const user = await em.findOne(User,
			usernameOrEmail.includes('@') ?
				{email: usernameOrEmail} :
				{username: usernameOrEmail}
		)
		if (!user) {
			return {
				errors: [{
					field: 'usernameOrEmail',
					message: 'that username does not exists'
				}]
			}
		}
		const isValid = await argon2.verify(user.password, password)
		if (!isValid) {
			return {
				errors: [{
					field: 'password',
					message: 'incorrect password'
				}]
			}
		}

		req.session!.userId = user.id

		return {
			user
		}
	}

	@Mutation(() => Boolean)
	logout(
		@Ctx() {req, res}: MyContext
	) {
		return new Promise(resolve => req.session.destroy(err => {
			res.clearCookie(COOKIE_NAME)
			if (err) {
				console.log(err)
				resolve(false)
				return
			}
			resolve(true)
		}))
	}
}