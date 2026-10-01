# Security Policy

## Supported versions

Atmos is a static, client-side application with no server component, no
database and no authentication. The most recent tagged release receives security
fixes.

| Version | Supported |
| --- | --- |
| `0.0.x` (current) | ✅ |
| < `0.0.x` | ❌ |

## Reporting a vulnerability

**Please do not open a public issue for a security problem.**

Report vulnerabilities privately via GitHub's
[private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)
on this repository, or by email to **shubhayanbagchi.work@gmail.com**.

Please include:

- a description of the issue and its impact,
- steps to reproduce, ideally with a proof of concept,
- the affected commit, file or URL, if known,
- your suggested remediation, if you have one.

You can expect an acknowledgement within **7 days**. We will keep you updated
as the issue is investigated and will credit you in the advisory unless you
prefer to remain anonymous.

Please give us a reasonable amount of time to release a fix before disclosing
the issue publicly.

## Threat model

Because Atmos is entirely static, most of the usual web-application attack
surface does not apply. There is no session to hijack, no credential to steal,
no server to compromise and no write path into a database.

The realistic attack surface is:

- **Third-party API responses.** All data comes from Open-Meteo over HTTPS and
  is validated with Zod at the boundary, so a malformed or hostile payload
  fails parsing rather than reaching the UI. If you find a response shape that
  slips past the schemas in `src/schemas/`, that is a genuine finding.
- **Supply chain.** Vulnerabilities in `package.json` dependencies,
  particularly the build-time toolchain.
- **Client-side rendering of remote data.** Map popups and geocoding results
  render strings from remote services; a sanitisation bypass would be
  reportable.
- **URL parameter and `localStorage` handling.** Values from `?lat=`, `?lon=`
  and `?name=` are parsed on load.

Note that because the app is client-side only, **the browser is the trust
boundary**: anything visible in the UI is present in the shipped JavaScript
bundle. Do not report "the AQI value can be seen in devtools" or similar as a
vulnerability.

## Hardening notes for contributors

- Never add an API key, token or secret to the repository. The application is
  designed to need none, and anything committed to a static bundle is public.
- Keep runtime validation in `src/schemas/` when adding API fields.
- Escape or avoid rendering untrusted strings as HTML.
