import nodemailer from "nodemailer"


export async function verifyMail(email: string, emailToken: string) {

    const transport = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.USER,
            pass: process.env.PASSWORD
        }
    });

    const mailOptions = {
        from: process.env.USER,
        to: email,
        subject: "Trying the Auth Token!",
        text: "Welcome",
        html: `<p>Use the Token: ${emailToken} to confirm the email is yours</p>`
    };

    try {
        await transport.sendMail(mailOptions)
    } catch (error) {
        console.log(error);
    }
}
