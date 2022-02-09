import { Request as ExpressRequest, Response } from 'express'
import { Session } from 'express-session'
import { Redis } from 'ioredis'

export type MyContext = {
	req: Request,
	res: Response,
	redis: Redis
}

export interface Request extends ExpressRequest {
	session: Session & Partial<SessionData>;
}

interface SessionData {
	[key: string]: any;
}
