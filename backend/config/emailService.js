import nodemailer from 'nodemailer';

/**
 * Cria o transporter de email usando Gmail SMTP com App Password.
 * Configure as variáveis de ambiente no Render:
 *   GMAIL_USER  = seuemail@gmail.com
 *   GMAIL_PASS  = xxxx xxxx xxxx xxxx  (App Password do Google, não a senha normal)
 */
const createTransporter = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

/**
 * Envia o email de redefinição de senha com template HTML profissional.
 * @param {string} toEmail  - Endereço do destinatário
 * @param {string} resetLink - Link gerado pelo Firebase Admin SDK
 */
export const sendPasswordResetEmail = async (toEmail, resetLink) => {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;

  if (!user || !pass) {
    console.error('❌ ERRO CRÍTICO: GMAIL_USER ou GMAIL_PASS não definidos no arquivo .env');
    throw new Error('Configuração de e-mail ausente.');
  }

  console.log(`📧 Tentando enviar e-mail de reset para: ${toEmail}...`);

  const transporter = createTransporter();

  // ... (html code ...)
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Redefinição de Senha — Nexo-Hub</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0f1e;font-family:Arial,Helvetica,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0f1e;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#111827;border-radius:16px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e1b4b 0%,#0c1a35 100%);padding:40px 48px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
              <img
                src="https://cellhub-henrique-dev.web.app/nexo-logo.jpeg"
                alt="Nexo-Hub"
                width="100"
                style="display:block;margin:0 auto 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);"
              />
              <p style="margin:0;font-size:12px;color:#64748b;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;">Plataforma de Gestão de Células</p>
            </td>
          </tr>

          <!-- Ícone + título -->
          <tr>
            <td align="center" style="padding:40px 48px 0;">
              <div style="width:72px;height:72px;background:rgba(79,70,229,0.12);border:1px solid rgba(79,70,229,0.25);border-radius:50%;display:inline-block;text-align:center;line-height:72px;margin-bottom:24px;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h1 style="margin:0 0 12px;font-size:24px;font-weight:800;color:#f1f5f9;letter-spacing:-0.5px;">Redefinição de Senha</h1>
              <p style="margin:0;font-size:15px;color:#94a3b8;line-height:1.7;">
                Recebemos uma solicitação para redefinir a senha da sua conta no <strong style="color:#c7d2fe;">Nexo-Hub</strong>.
              </p>
            </td>
          </tr>

          <!-- Corpo -->
          <tr>
            <td style="padding:32px 48px;">

              <!-- Email vinculado -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(79,70,229,0.08);border:1px solid rgba(79,70,229,0.2);border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">Conta vinculada</p>
                    <p style="margin:4px 0 0;font-size:15px;color:#a5b4fc;font-weight:600;">${toEmail}</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 28px;font-size:15px;color:#94a3b8;line-height:1.75;">
                Clique no botão abaixo para criar uma nova senha. O link é válido por <strong style="color:#e2e8f0;">1 hora</strong> — depois disso, você precisará solicitar um novo.
              </p>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${resetLink}"
                       style="display:inline-block;padding:15px 40px;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.02em;">
                      Redefinir minha senha
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divisor -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0;">
                <tr><td style="border-top:1px solid rgba(255,255,255,0.06);"></td></tr>
              </table>

              <!-- Link alternativo -->
              <p style="margin:0 0 8px;font-size:13px;color:#64748b;">Se o botão não funcionar, copie e cole este link no navegador:</p>
              <p style="margin:0;font-size:12px;word-break:break-all;color:#4f46e5;">${resetLink}</p>

              <!-- Divisor -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr><td style="border-top:1px solid rgba(255,255,255,0.06);"></td></tr>
              </table>

              <!-- Aviso de segurança -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.15);border-radius:10px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <p style="margin:0 0 4px;font-size:13px;color:#fbbf24;font-weight:700;">⚠️ Não solicitou isso?</p>
                    <p style="margin:0;font-size:13px;color:#78716c;line-height:1.6;">
                      Se você não pediu redefinição de senha, ignore este e-mail. Sua senha permanece a mesma e nenhuma alteração foi feita.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0d1117;padding:24px 48px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;color:#475569;">Este e-mail foi enviado automaticamente pelo <strong style="color:#64748b;">Nexo-Hub</strong>.<br/>Por favor, não responda a este e-mail.</p>
              <p style="margin:0;font-size:12px;color:#334155;">&copy; ${new Date().getFullYear()} Nexo-Hub &bull; Plataforma de Gestão de Células</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;

  try {
    const info = await transporter.sendMail({
      from: `"Nexo-Hub" <${user}>`,
      to: toEmail,
      subject: 'Redefinição de senha — Nexo-Hub',
      html,
    });

    console.log(`✅ E-mail enviado com sucesso! MessageId: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ FALHA ao enviar e-mail via Nodemailer:', error);
    throw error;
  }
};
