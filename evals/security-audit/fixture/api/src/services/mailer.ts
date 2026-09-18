export async function sendResetEmail(to: string, token: string): Promise<void> {
  await fetch('https://api.mail-provider.example/v1/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.MAIL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to,
      template: 'password-reset',
      data: { link: `https://tienda.example.com/reset?token=${token}` },
    }),
  });
}
