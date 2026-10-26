# Review record: composer length counter and the too-long notice

- **Piece:** `content/site/composer-limit.ts` -> `COMPOSER_LIMIT_CONTENT`.
- **Strings:**
  - Counter, from 3,200 characters: "{n} characters left" (singular "1 character left"); hint "Please summarise it to a few lines."
  - Over the limit: "{n} characters over"; hint "Too long to send. Please summarise it to a few lines."
  - Screen reader, in steps of 100: "About {n} characters left"; once past the limit "Over the character limit. Sending is off until you shorten the message."; group name "Message length".
  - Notice when the server still refuses a message as too long (HTTP 413): heading "That message is too long."; body "Chat takes up to 4,000 characters at a time. Your text is still in the message box. Please summarise it to a few lines and send it again."
- **Why:** a visitor who pasted a long brief got a 413 that the client did not handle: the chat showed "The reply stopped before it finished." with a "Try again" link that could only fail the same way, and the pasted text was gone from the box. The server cap is 4,000 characters (`server/src/domain/chat_request.rs`, `MAX_MESSAGE_CHARS`) and is not changed by this work. A 4,000-character cap on a public chat also limits how much personal or confidential text a visitor can paste.
- **Claims checked against the system:** the limit is 4,000 characters, counted as Unicode characters, matching the server's `chars().count()`. "Your text is still in the message box" is true unless the visitor has already typed something new, in which case the new text is kept and the old one is not restored (assistant-ui `restoreDraft`; covered by `use-chat-runtime.too-long.test.tsx`). No product, price or capability claim.
- **Voice:** short, calm, no exclamation marks, no hype words; checked by `src/test/brand-copy.test.ts` (module `composer-limit`, including the function outputs).
- **Not pre-reviewed:** the content officer (km-chief-content-officer) has not pre-reviewed this text. It is a draft written by the engineer.
- **Operator approval:** by merge. Merging the pull request that adds this file counts as approval of the text as it stands in that pull request; any later wording change needs a new record.
