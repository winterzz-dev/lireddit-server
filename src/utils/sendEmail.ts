import nodemailer from 'nodemailer'

export async function sendEmail(to: string, html: string) {
	let testAccount = await nodemailer.createTestAccount()
	console.log({testAccount})
	let transporter = nodemailer.createTransport({
		host: 'smtp.ethereal.email',
		port: 587,
		secure: false,
		auth: {
			user: testAccount.user,
			pass: testAccount.pass
		}
	})

	let info = await transporter.sendMail({
		from: '',
		to: to,
		subject: 'Change password',
		html: html
	})

	console.log(`Message sent: ${info.messageId}`)
	console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`)
}