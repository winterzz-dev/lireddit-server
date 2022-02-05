import {
	BaseEntity,
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn
} from 'typeorm'
import { Field, Int, ObjectType } from 'type-graphql'
import Post from './Post'

@ObjectType()
@Entity()
export default class User extends BaseEntity {
	@Field(() => Int)
	@PrimaryGeneratedColumn()
	id!: number

	@Field(() => String)
	@Column({unique: true})
	username!: string

	@Field(() => String)
	@Column({unique: true})
	email!: string

	@Field(() => String)
	@Column()
	password!: string

	@OneToMany(() => Post, post => post.creator)
	posts: Post[]

	@Field(() => String)
	@CreateDateColumn()
	createdAt: Date

	@Field(() => String)
	@UpdateDateColumn()
	updatedAt: Date = new Date()
}
