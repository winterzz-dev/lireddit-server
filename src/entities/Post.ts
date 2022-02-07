import {
	BaseEntity,
	Column,
	CreateDateColumn,
	Entity,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn
} from 'typeorm'
import { Field, Int, ObjectType } from 'type-graphql'
import User from './User'

@ObjectType()
@Entity()
export default class Post extends BaseEntity {
	@Field(() => Int)
	@PrimaryGeneratedColumn()
	id!: number

	@Field()
	@Column()
	title!: string

	@Field()
	@Column()
	text!: string

	@Field()
	@Column({type: 'integer', default: 0})
	points!: number

	@Field()
	@Column()
	creatorId: number

	@Field()
	@ManyToOne(() => User, user => user.posts)
	creator: User

	@Field(() => String)
	@CreateDateColumn()
	createdAt: Date

	@Field(() => String)
	@UpdateDateColumn()
	updatedAt: Date
}