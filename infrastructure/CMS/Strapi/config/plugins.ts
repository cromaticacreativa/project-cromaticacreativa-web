import type { Core } from '@strapi/strapi';

const allowedMediaTypes = [
  'image/*',
  'video/*',
  'audio/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.*',
  'text/plain',
  'text/csv',
];

const deniedExecutableTypes = [
  'application/vnd.microsoft.portable-executable',
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-executable',
  'application/x-dosexec',
  'application/x-sh',
  'text/x-shellscript',
  'application/x-mach-binary',
];

const config = ({
  env,
}: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
  'users-permissions': {
    config: {
      jwtManagement: 'refresh',
      sessions: {
        httpOnly: true,
      },
    },
  },

  upload: {
    config: {
      security: {
        allowedTypes: allowedMediaTypes,
        deniedTypes: deniedExecutableTypes,
      },
    },
  },

  email: {
    config: {
      provider: 'nodemailer',

      providerOptions: {
        host: env('SMTP_HOST'),
        port: env.int('SMTP_PORT', 465),
        secure: env.bool('SMTP_SECURE', true),

        auth: {
          user: env('SMTP_USERNAME'),
          pass: env('SMTP_PASSWORD'),
        },
      },

      settings: {
        defaultFrom: env(
          'SMTP_DEFAULT_FROM',
          'no-reply@cromaticacreativa.com',
        ),

        defaultReplyTo: env(
          'SMTP_DEFAULT_REPLY_TO',
          'no-reply@cromaticacreativa.com',
        ),
      },
    },
  },
});

export default config;