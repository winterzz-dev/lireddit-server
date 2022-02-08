import {
	BaseEntity, Column,
	Entity,
	ManyToOne, PrimaryColumn
} from 'typeorm'
import { Post, User } from './index'

@Entity()
export default class Updoot extends BaseEntity {
	@Column({type: 'int'})
	value: number

	@PrimaryColumn()
	userId: number

	@ManyToOne(() => User, user => user.updoots)
	user: User

	@PrimaryColumn()
	postId: number

	@ManyToOne(() => Post, post => post.updoots)
	post: Post
}