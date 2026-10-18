## ADDED Requirements

### Requirement: Every reply block has a Copy control that copies only that block
The chat client SHALL give each block in a reply (code, Mermaid diagram, SVG, table, display math, image, video, answer card) a Copy control that copies only that block, in the form listed here, and SHALL announce the outcome ("Copied" or "Couldn't copy") in a polite live region.

#### Scenario: Code and diagram sources
- **WHEN** the visitor activates Copy on a code block, a Mermaid diagram or an SVG block
- **THEN** the clipboard holds the raw source of that block, with no language label and at most one trailing newline removed

#### Scenario: Table
- **WHEN** the visitor activates Copy on a table
- **THEN** the clipboard holds the table as GitHub-flavoured Markdown made from the visibly rendered cell text, with words kept apart across line breaks, paragraphs and list items

#### Scenario: Image on a browser that supports ClipboardItem
- **WHEN** the visitor activates Copy on an image
- **THEN** the clipboard write starts inside the tap, with the PNG as a promise, and the status reads "Copied image"
- **AND** if the bytes cannot be read, the image URL is copied and the status reads "Copied image link"

#### Scenario: Clipboard refused
- **WHEN** the clipboard write is rejected
- **THEN** the status reads "Couldn't copy" and nothing is thrown to the page

### Requirement: Copy and export share one definition of a block's text
The client SHALL produce the text of code, Mermaid and SVG blocks from one set of functions that both the Copy controls and the conversation export call, so the two cannot drift.

#### Scenario: Same text from both
- **WHEN** a code, Mermaid or SVG block is copied and the conversation is exported
- **THEN** the copied text and the exported block body are produced by the same function

### Requirement: A reply SVG is shown only as an inert image
The client SHALL render a fenced `svg` block only as an `<img>` whose source is a data URL, never as markup, so no script runs and no external resource is fetched. A source larger than 256 KB SHALL be shown as source only, with Copy and Download kept.

#### Scenario: Preview
- **WHEN** a reply contains a fenced `svg` block under the size cap
- **THEN** the block shows an image with Preview and Source views, and no element from the SVG enters the page DOM

#### Scenario: Saved copy is sanitised
- **WHEN** the visitor activates Download on an SVG block
- **THEN** the saved file has no script, foreignObject, iframe, object, embed, audio, video or canvas element, no event attribute, no reference that is not a same-document fragment and no external `url()` or `@import`
- **AND** a source that is not well-formed XML is saved unchanged

### Requirement: Reply video and images load only from the site's own host
The client SHALL render a reply video or image only when its source is https on exactly the site's own host or a same-origin path; any other source SHALL be shown as text with its destination. A video SHALL be rebuilt from an allowlist of attributes with no autoplay and preload "none".

#### Scenario: Blocked video
- **WHEN** a reply contains a video whose source is on another host
- **THEN** no video element is rendered and the destination is shown as text

#### Scenario: Blocked image
- **WHEN** a reply contains an image from another host
- **THEN** no image is rendered, no Copy button is offered for it, and no request is made to that host
