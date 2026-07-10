# Security Policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 0.1.x   | ✅        |
| < 0.1   | ❌        |

## Reporting a vulnerability

Please **do not open a public issue** for security vulnerabilities.

Instead, either:

- Use [GitHub private vulnerability reporting](https://github.com/kiranharidas187/ai-chatbot-kit-ui/security/advisories/new), or
- Email **kiranharidas187@gmail.com** with a description, reproduction steps, and the
  affected version.

You can expect an acknowledgement within a few days. Please allow a reasonable window
for a fix to be released before public disclosure.

## Scope notes

`@kiranharidas/chat-kit` is a UI/client library: it performs no authentication and
stores no secrets. Consumers own auth (tokens/headers passed through transport config)
and should treat anything persisted via the localStorage adapter as non-sensitive.
Markdown rendering does not use `dangerouslySetInnerHTML`; if you find an XSS vector
through message content, that is firmly in scope — please report it.
