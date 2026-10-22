# Reviews: attribution, aggregates and selection policy

Source: Judge.me. Code: `app/lib/judgeme.ts`; display in `ProductReviewList`, `ReviewQuotes`, `VerifiedReviews`.

## Reviewer names (never invented)

| Input | Shown |
|---|---|
| Two or more words | first word + initial of the last ("Jordan Alvarez" -> "Jordan A.") |
| One word, alphabetic script | as written, up to 30 characters ("Madonna") |
| One word, Chinese/Japanese/Korean script | its first character only ("山田太郎" -> "山.") |
| Missing, blank, an email address, a link, or no letters/digits | "Anonymous" |

- The initial is a whole user-perceived character (accents, combining marks and surrogate pairs stay intact).
- Control characters are stripped. A name is never replaced by a different person's name.
- Review text and rating are shown as Judge.me returns them (valid ratings only).

## Aggregates

- **Product page rating:** the provider's aggregate (the synced `judgeme.badge`) whenever it is valid. It covers every review,
  including star-only ones, and wins on both fast and slow renders, so the numbers do not depend on timing. Only with no valid badge
  is a rating derived from the fetched list, and only if that list is complete.
- **List vs. average:** the list shows written reviews. When it has fewer than the average's count, or is known to be truncated
  (page cap, or a failed page), the page says "Showing N written reviews". Partial lists are shown as partial, never as complete.
- **Validation:** ratings must be above 0 and at most 5; counts must be positive integers; malformed attributes, reviews with an
  out-of-range rating and responses with the wrong shape are dropped, not displayed.
- **Homepage "Rated by the Culture":** the weighted average of the (up to four) products shown, labelled as such. It is not a
  storewide figure.
- **Waiting:** with a valid badge the product page never waits on the review list; without one it waits at most 1.2 s.
- **Fan-out:** at most 5 pages per product (30 reviews per page on the public endpoint), fetched in parallel.

## Homepage quote selection

Quotes are a curated selection and are labelled "A selection of our 5-star reviews". A review qualifies if it is 5 stars, at least
80 characters, not flagged spam, not stock/templated text (known phrases, or the same text on more than one review), and it is the
newest for its product. Authenticity checks beyond that (verified buyer, moderation) are Judge.me's; the owner decides whether
curation should be wider or narrower.

## Caching

Judge.me requests use the Cloudflare edge cache for one hour for successful responses only (`cacheTtlByStatus`); error responses
are never cached, so an outage ends as soon as Judge.me recovers. **Not yet measured:** whether Oxygen serves these from cache.
Verify on a deployed preview (second request faster / `cf-cache-status: HIT`).
