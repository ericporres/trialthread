#!/usr/bin/env node
/**
 * IndexNow submission — push, instead of waiting to be pulled.
 *
 * WHY THIS EXISTS (2026-08-03)
 *
 * Search Console on 2026-07-23 showed 2 of 5 canonical URLs indexed and 3 in
 * "Discovered - currently not indexed." That status is not a technical defect;
 * it is Googlebot's crawl-budget triage on a domain with almost no inbound
 * links. Google has no push protocol for this — the Indexing API is scoped to
 * JobPosting and BroadcastEvent, and using it for anything else is against
 * their terms.
 *
 * IndexNow is the protocol that does exist. One POST notifies Bing, Yandex,
 * Seznam, Naver, and Yep simultaneously, and they typically crawl within
 * hours instead of weeks. It costs nothing and it is the only lever on this
 * site that converts "we changed a page" into "a crawler knows" without
 * waiting on someone else's schedule.
 *
 * It does NOT reach Google. Google is reached by (a) the sitemap, submitted in
 * Search Console, and (b) inbound links. There is no third option; anyone
 * selling one is selling something.
 *
 * THE KEY IS PUBLIC BY DESIGN. IndexNow's whole authentication model is
 * "prove you control the host by serving this key at a known path." The key
 * file at public/<key>.txt and the constant below are the same value on
 * purpose. It is not a secret, and rotating it accomplishes nothing.
 *
 * Usage:
 *   node scripts/indexnow.mjs              # submit every canonical URL
 *   node scripts/indexnow.mjs /about /faq  # submit specific paths
 */

const HOST = "www.trialthread.org";
const KEY = "7a4191bfd5b7f51e3ef53bcd1bae7439";
const ORIGIN = `https://${HOST}`;

/** Keep in sync with app/sitemap.ts. Five routes; a hand-list is honest here. */
const ALL_PATHS = ["/", "/about", "/faq", "/privacy", "/security"];

const paths = process.argv.slice(2).length ? process.argv.slice(2) : ALL_PATHS;
const urlList = paths.map((p) => new URL(p, ORIGIN).toString());

// Fail loudly if the key file is not actually being served. A submission with
// an unreachable key is silently rejected, which is the worst outcome: it
// looks like it worked.
const keyUrl = `${ORIGIN}/${KEY}.txt`;
const keyCheck = await fetch(keyUrl);
if (!keyCheck.ok) {
  console.error(`✗ Key file not reachable at ${keyUrl} (HTTP ${keyCheck.status}).`);
  console.error("  Deploy first — IndexNow verifies the key before accepting the batch.");
  process.exit(1);
}
const served = (await keyCheck.text()).trim();
if (served !== KEY) {
  console.error(`✗ Key file at ${keyUrl} contains "${served}", expected "${KEY}".`);
  process.exit(1);
}

const res = await fetch("https://api.indexnow.org/IndexNow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: keyUrl,
    urlList,
  }),
});

// 200 = accepted. 202 = accepted, key validation pending. Both are success.
if (res.status === 200 || res.status === 202) {
  console.log(`✓ IndexNow accepted ${urlList.length} URL(s) (HTTP ${res.status})`);
  for (const u of urlList) console.log(`  ${u}`);
} else {
  console.error(`✗ IndexNow returned HTTP ${res.status}: ${await res.text()}`);
  process.exit(1);
}
