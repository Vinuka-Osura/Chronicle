# Deployment — what it costs, what you need to buy, what you need to do

Written so you can research before committing to anything. Nothing here is decided;
every recommendation says *why*, so you can disagree with the reasoning rather than just
the conclusion.

**The headline: this can run for about £9 a year, and all of it is the domain.**
Everything else has a genuine permanently-free tier — not a trial, not credits that run
out. Where "free" comes with a catch, the catch is named.

---

## 0. The one rule

**Nothing may auto-scale into a bill.** A portfolio that costs £0.00 in month one and
£40 in month seven because a crawler hammered it is worse than no portfolio. Every
option below either cannot bill you or has a hard cap you set.

That rules out, permanently:

- **Anything with usage-based pricing and no spend cap.** AWS, GCP and Azure
  pay-as-you-go all qualify. A misconfigured loop is a real bill.
- **Anything that sleeps.** Render's and Railway's free tiers spin down after ~15
  minutes idle and take **~50 seconds** to wake. A portfolio's entire job is to be up
  the one time someone finally clicks the link. A recruiter will not wait 50 seconds.
- **Supabase's free database.** Pauses after 7 days of inactivity and needs a
  **manual** unpause from the dashboard. A portfolio is idle by nature.

---

## 1. The short version — what I recommend

| Piece | Where | Cost | Card needed? |
|---|---|---|---|
| Public site (Next.js) | **Vercel Hobby** | £0 | No |
| API + CMS (.NET) | **Oracle Cloud Always Free** VM | £0 | Yes — identity only |
| PostgreSQL | **on that same VM** | £0 | — |
| Images | **Cloudflare R2**, or the same VM's disk | £0 | R2: yes |
| Contact email | **Resend** | £0 | No |
| Domain | **Cloudflare Registrar** | ~£9/year | Yes |
| TLS certificate | Let's Encrypt / Cloudflare | £0 | No |

**Total: ~£9/year.**

If Oracle turns out to be a fight (see §3), the fallback is a **Hetzner CX22 at
~€3.79/month** — about £39/year all in. Not free, but it is a real machine that never
sleeps and never surprises you, and it is the cheapest honest option that exists.

---

## 2. The domain

**This is the only thing genuinely worth paying for, and you do not need it to launch.**
Vercel gives you `something.vercel.app` free, with working HTTPS. You can ship on that
and add the domain later without redeploying anything.

### Where to buy

| Registrar | Verdict |
|---|---|
| **Cloudflare Registrar** | **Recommended.** Sells at wholesale cost with no markup, no first-year-cheap-then-triple trick, free WHOIS privacy. Requires moving DNS to Cloudflare, which you want anyway. |
| **Porkbun** | Good. Cheap, honest pricing, free WHOIS privacy. |
| **Namecheap** | Fine. Slightly pricier renewals. |
| **GoDaddy** | **Avoid.** £1 first year, then £25 renewal, and a checkout designed to sell you five things you do not need. |

### What to buy

| TLD | ~Cost/year | Notes |
|---|---|---|
| `.com` | £9–11 | Boring and correct. Nobody has ever been penalised for a `.com`. |
| `.dev` | £11–14 | Fine, and reads well for an engineer. Google-run; **HTTPS is mandatory** (the whole TLD is HSTS-preloaded), which is not a problem here since you would use HTTPS anyway. |
| `.me` | £18–25 | Works for `firstname.me`. Renewals creep up. |
| `.io` | £35–60 | Expensive, and the "tech startup" association is dated. Skip. |

**Suggestion:** `vinukaosura.com` or `vinuka.dev`. Short, spellable over the phone,
obviously yours.

### What to avoid

- **Freenom** (`.tk`, `.ml`, `.ga`) — effectively dead, and domains were routinely
  reclaimed without notice. Never use one for anything you care about.
- **`.eu.org`** — genuinely free but approval takes weeks and it looks like a
  subdomain, because it is one.

---

## 3. The .NET server — the hard part

Everything else on this page is easy. An always-on .NET backend for £0 is not.

### Oracle Cloud Always Free — recommended, with a caveat

| | |
|---|---|
| **What you get** | 4 ARM cores + 24 GB RAM (Ampere A1), or 2 small AMD VMs. 200 GB block storage. 10 TB/month egress. |
| **Cost** | £0, permanently. Not a trial. |
| **Card** | Required for identity verification. **Always Free resources cannot exceed their limits, so there is nothing to bill.** |
| **Sleeps?** | No. |

That spec is absurd for a portfolio — it comfortably runs the .NET server, PostgreSQL,
nginx and your media on one box.

**The caveats, honestly:**

1. **ARM capacity is frequently unavailable** in popular regions. "Out of host capacity"
   on signup is a well-known Oracle frustration. Pick a less busy region, and be
   prepared to retry over a few days. This is the single most likely thing to annoy you.
2. **Idle Always Free instances can be reclaimed.** Oracle reclaims instances in
   accounts that stay idle. Upgrading to "Pay As You Go" stops the reclamation *and*
   keeps Always Free resources free — you are still not charged, because Always Free
   shapes cost nothing. Slightly counterintuitive, worth doing.
3. **You are the sysadmin.** Patching, firewall, TLS renewal, backups. That is real
   work, though it is also a genuine skill worth having on a CV.

### The alternatives, ranked

| Option | Cost | Verdict |
|---|---|---|
| **Hetzner CX22** | ~€3.79/mo | **Best paid option.** 2 vCPU, 4 GB RAM, 40 GB SSD, 20 TB traffic. Reliable, no surprises, EU-based. If Oracle frustrates you, stop fighting and pay this. |
| **Azure App Service F1** | £0 | Free forever, but **60 CPU-minutes/day**, 1 GB RAM, and **no TLS on a custom domain**. You can front it with Cloudflare for TLS. The CPU quota is the real problem — exceed it and the app returns 403 until midnight. |
| **Fly.io** | ~$5/mo+ | No longer meaningfully free; the old allowance became usage credits. |
| **Render / Railway free** | £0 | **Ruled out.** ~50s cold start after idle. |

### What the box actually runs

```
                    ┌──────────────────────────────────┐
  Vercel ──HTTPS──▶ │  nginx  (TLS, reverse proxy)     │
  (public site)     │    │                             │
                    │    ├─▶ Chronicle.Portfolio.Server│
                    │    │      /api/*   /admin/*      │
                    │    │                             │
                    │    └─▶ PostgreSQL 18             │
                    │                                  │
                    │    /var/chronicle/media          │
                    └──────────────────────────────────┘
```

I will write the `Dockerfile`, the `docker-compose.yml` (or systemd unit), the nginx
config with Let's Encrypt, and the GitHub Actions workflow that deploys on push to
`main`. You provide the machine and its SSH key.

---

## 4. The public site

**Vercel Hobby.** Free, no card, custom domain free, HTTPS free, no cold starts,
built by the people who build Next.js. Deploys on push.

One thing to know: **the Hobby plan is non-commercial.** A personal portfolio qualifies.
If you ever put a paid product on it, that is a Pro plan.

**Alternative: Cloudflare Pages.** Also free with unlimited bandwidth, and arguably
better if you are already using Cloudflare for DNS. But Next.js 16 with Cache Components
runs there through an adapter (`@opennextjs/cloudflare`) rather than natively, which is
a source of subtle differences. Vercel is the path of least resistance for this stack.

---

## 5. The database

If the server is on a VM, **run PostgreSQL on the same box.** Free, no network hop, no
third party, and backups are a cron job with `pg_dump`.

If the server ends up somewhere without a disk:

| Option | Free tier | Card? | Catch |
|---|---|---|---|
| **Neon** | 0.5 GB | No | Scales to zero, but wakes in well under a second — not a Render-style stall |
| **Aiven** | 5 GB, 1 GB RAM | No | Free plan is genuinely free, single node, no backups |
| **Supabase** | 0.5 GB | No | **Pauses after 7 days idle, manual unpause.** Ruled out. |

**Whatever you pick, back it up.** A portfolio's database is small enough that a nightly
`pg_dump` to R2 or to your own machine costs nothing. I will write it.

---

## 6. Images and files

You already chose **Cloudflare R2**, and it is a good choice.

| | |
|---|---|
| **Free tier** | 10 GB storage, 1M writes/month, 10M reads/month, **zero egress fees** |
| **Card** | Required to enable R2, even on the free tier |
| **Realistic usage** | A portfolio with 40 screenshots and a few diagrams: well under 100 MB. That is **under 1%** of the free tier. |

Zero egress is R2's real advantage — S3 charges for every byte served, which is exactly
the cost that surprises people.

**The admin storage gauge** you asked for is being built: `/admin` will show bytes used
against the free-tier ceiling, so you can see the margin without opening Cloudflare.

**The alternative, now worth reconsidering:** if the server lands on a VM with a
persistent disk, local disk costs nothing and needs no card. I am building both adapters
behind one interface, so this is a one-line config change at deploy time rather than a
decision you have to make now. R2 still wins on not tying your media to that server's
lifetime — if you ever move hosts, the images do not move with you.

---

## 7. Email for the contact form

The form sends mail via SMTP. Do not use your personal Gmail directly.

| Option | Free tier | Card? | Verdict |
|---|---|---|---|
| **Resend** | 3,000/month, 100/day | No | **Recommended.** Built for this, clean SMTP, good deliverability, generous. |
| **Brevo** | 300/day | No | Fine. Busier interface. |
| **Gmail app password** | ~500/day | No | Works, but ties your personal account to the site and deliverability suffers. |

A portfolio contact form receives single-digit messages per month. 3,000 is not a limit
you will meet.

**Note on how it works:** the visitor's address goes in `Reply-To`, never `From`.
Sending mail that claims to come from someone else's domain fails SPF and lands in spam
— yours, not theirs.

---

## 8. What I will need from you, and when

**Nothing yet.** All of this is a config change at deploy time. Development continues
against local PostgreSQL and local disk.

When we deploy, in this order:

### Now-ish, if you want to research

- [ ] Decide on a domain name and buy it (§2). ~£9.
- [ ] Create a Cloudflare account. Free, and you need it for DNS anyway.

### Before the R2 work lands (tomorrow, per your message)

- [ ] Cloudflare → R2 → add a payment method → create bucket `chronicle-media`
- [ ] Note the **Account ID** (visible in the R2 dashboard URL)
- [ ] R2 → Manage API Tokens → create a token with **Object Read & Write** on that bucket
- [ ] Note the **Access Key ID** and **Secret Access Key** — the secret is shown once

### Before deploying

- [ ] Oracle Cloud account + an Always Free VM (or a Hetzner box), and its SSH details
- [ ] A Resend account and an SMTP API key
- [ ] Point the domain's DNS at Cloudflare
- [ ] Choose the admin email and a strong password for the CMS

### What you give me, and what you do not

**Give me:** the domain name, the VM's IP and SSH access, and the R2 bucket name and
account ID.

**Do not send me:** the R2 secret key, the Resend key, the admin password, or the
database password. You put those into deployment secrets yourself. I will tell you
exactly which key goes where; I never need to see the values, and a secret that passes
through a chat log is a secret you have to rotate.

---

## 9. Every secret, and where it lives

The repository is public. `appsettings.json` holds empty placeholders that document the
key names and nothing else.

| Key | What it is | Local | Production |
|---|---|---|---|
| `ConnectionStrings:chronicledb` | Database | user-secrets | Deployment secret |
| `Admin:Email` / `Admin:Password` | The one CMS account | user-secrets | Deployment secret |
| `GitHub:Username` | Public | `appsettings.json` | same |
| `GitHub:Pat` | Read-only token for the contribution graph | user-secrets | Deployment secret |
| `Smtp:Host` / `Port` / `Username` / `Password` | Resend SMTP | user-secrets | Deployment secret |
| `Smtp:ToAddress` | Where contact mail lands | user-secrets | Deployment secret |
| `R2:AccountId` / `AccessKeyId` / `SecretAccessKey` / `Bucket` | Media storage | user-secrets | Deployment secret |
| `Cors:AllowedOrigins` | The public site's URL | AppHost sets it | Deployment config |
| `NEXT_PUBLIC_API_BASE_URL` | Where the client finds the API | AppHost sets it | Vercel env var |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for sitemap, OG tags, JSON-LD | defaults to localhost | Vercel env var |

**One outstanding item:** the local PostgreSQL password `#compaq123` was typed into our
conversation early on. Rotate it before anything is public. Nothing containing it is
committed.

---

## 10. The deploy process, once decided

Roughly a day's work, most of it one-time setup.

1. **Provision** the VM, lock down SSH, open only 80 and 443.
2. **Install** Docker and PostgreSQL; create the database and a non-superuser role.
3. **Containerise** the server — multi-stage `Dockerfile`, published as a trimmed
   release build.
4. **nginx + Let's Encrypt** in front, with auto-renewal.
5. **Secrets** onto the box as environment variables, never in the image.
6. **Migrations** run on startup — already wired, already idempotent.
7. **GitHub Actions**: on push to `main`, build, test, publish the image, deploy over
   SSH. The workflow that already builds and tests gains a deploy job.
8. **Vercel**: connect the repo, set the root to the client directory, set the two
   `NEXT_PUBLIC_*` variables, attach the domain.
9. **DNS**: `yourdomain.com` → Vercel, `api.yourdomain.com` → the VM.
10. **Verify**: HTTPS on both, `/scalar/v1` reachable, a CMS save visible on the public
    site immediately, contact form delivering, and the analytics page pulling real
    GitHub data.
11. **Backups**: nightly `pg_dump` to R2, with a restore actually tested. A backup you
    have never restored is a hope, not a backup.

---

## 11. Running costs, honestly

| | Year 1 | Year 2+ |
|---|---|---|
| Domain (`.com`, Cloudflare) | ~£9 | ~£9 |
| Everything else, recommended stack | £0 | £0 |
| **Total** | **~£9** | **~£9** |

If Oracle does not work out and you move to Hetzner: **+£39/year**.

### What could actually generate a bill

Only two things, and both are avoidable:

1. **Adding a payment method to a service with usage pricing and no cap.** R2's free
   tier cannot be exceeded silently — Cloudflare stops at the limit unless you have
   explicitly enabled paid usage. Do not enable it.
2. **Oracle, if you provision something outside the Always Free shapes.** The console
   marks Always Free resources clearly. Only pick those.

**Set a billing alert at £1 on every account anyway.** It costs nothing and it is the
difference between noticing in a day and noticing in a month.
