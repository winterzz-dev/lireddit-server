import { Connection, EntityManager, IDatabaseDriver } from '@mikro-orm/core'
import { Request as ExpressRequest, Response } from 'express'
import { Session } from 'express-session'

export type MyContext = {
	em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>,
	req: Request,
	res: Response
}

export interface Request extends ExpressRequest {
	session: Session & Partial<SessionData>;
}

interface SessionData {
	[key: string]: any;
}
