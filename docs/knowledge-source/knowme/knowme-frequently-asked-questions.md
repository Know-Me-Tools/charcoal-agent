---
type: Concept
title: "KnowMe AI, LLC frequently asked questions"
description: "Visitor questions about KnowMe, The Boss, IPFS Sync for Obsidian and KnowMe AI, LLC, each answered in one self-contained section."
status: stable
generated:
  by: km-cmo/fable
  at: "2026-10-12T19:00:00+00:00"
tags: [faq, knowme, the-boss, ipfs-sync-for-obsidian]
sources:
  - id: boss-site
    resource: https://the-boss.know-me.tools
    title: The Boss download page
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: boss-license
    resource: https://github.com/Prometheus-AGS/the-boss/blob/main/LICENSE
    title: The Boss LICENSE
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: boss-build
    resource: https://github.com/Prometheus-AGS/the-boss/blob/main/build/integration-artifacts.json
    title: The Boss integration artifacts manifest
    last_modified: "2026-10-12T00:00:00+00:00"
---

# Frequently asked questions about KnowMe AI, LLC and its products

Answers to common questions about KnowMe AI, LLC and its products: KnowMe, The Boss and IPFS Sync for Obsidian.

## What is KnowMe?

KnowMe is KnowMe AI, LLC's personal AI platform, designed so that its assistants and agents adapt to the person while the person's data stays under their own control. KnowMe is still in development and has not been publicly released. See the KnowMe overview for what it is designed to do.

## Can I download KnowMe today?

No. KnowMe has not been publicly released, and KnowMe AI, LLC has not announced a download or a release date. The app from KnowMe AI, LLC that you can download today is The Boss, a free, open-source desktop workspace for macOS and Windows.

## Is KnowMe available on my phone?

Not yet. KnowMe's mobile app is being built with Flutter for iOS and Android, and KnowMe AI, LLC has run development builds on an Android phone, but there is no public release for either platform and no published date.

## Does KnowMe send my data to the cloud?

KnowMe is designed to run models on your own device and to require your explicit approval before anything is sent to a cloud model provider. KnowMe has not shipped, and some of the systems that would enforce that everywhere are still being built, so treat this as KnowMe AI, LLC's design intent rather than a guarantee. See KnowMe privacy for more.

## How much does KnowMe cost?

Pricing has not been announced for KnowMe. Nothing is sold on know-me.tools, and The Boss is free. Any paid offering from KnowMe AI, LLC will have its own site.

## What is The Boss from KnowMe AI, LLC?

The Boss is a free, open-source AI desktop workspace from KnowMe AI, LLC for conversations, agents, tools and project work. It is built on Cherry Studio and extended with artifact authoring, context management, skills selection and agent protocols.[^boss-site] See The Boss page for more.

## What platforms does The Boss from KnowMe AI, LLC run on?

The Boss runs on macOS and Windows. The download page currently offers The Boss v2.2.36 for macOS on Apple Silicon and for Windows x64; the Intel Mac and Windows ARM64 downloads are the older v2.2.30 builds, with the v2.2.36 update for those two pending. The macOS builds are notarized; the Windows installers are unsigned, so Windows may show a warning. Linux is not offered.[^boss-site]

## Where do I download The Boss from KnowMe AI, LLC?

From The Boss download page at https://the-boss.know-me.tools, which links to the installers on GitHub releases. It is free and needs no account.[^boss-site]

## Is The Boss from KnowMe AI, LLC free and open source?

Yes. The Boss is free to download, and its source is published under the GNU Affero General Public License v3.0 (AGPL-3.0). It is derived from Cherry Studio, whose licence obligations continue to apply.[^boss-license]

## Does The Boss from KnowMe AI, LLC include the Universal Agent Runtime, BossFang and the Surreal Memory Server?

The Boss installers package the Universal Agent Runtime and BossFang as sidecar programs.[^boss-build] The Surreal Memory Server is not inside the installer: The Boss works with it over MCP as a separate service that The Boss can manage or connect to.

## What is IPFS Sync for Obsidian from KnowMe AI, LLC?

IPFS Sync for Obsidian is an early-preview Obsidian plugin and command-line tool from KnowMe AI, LLC that syncs a vault over IPFS through your own kubo node. It is a pre-release, tested on fixture vaults only.

## Can I use KnowMe AI, LLC's IPFS Sync for Obsidian on my real notes?

Not yet. IPFS Sync for Obsidian's own documentation says not to use it on real notes: it has not shipped encryption, so data on your IPFS node is readable by anyone with the file's address. Wait for an encrypted release.

## Who is KnowMe AI, LLC?

KnowMe AI, LLC is the company behind this site and its products: KnowMe, The Boss and IPFS Sync for Obsidian. It also builds the parts those products run on, including the Universal Agent Runtime, BossFang and the Surreal Memory Server.

## How do I contact KnowMe AI, LLC?

This site does not have a separate contact page yet. The fastest way to ask a question is to ask the KnowMe agent, right here in the chat.

## Is the KnowMe agent on this site a person or an AI?

The KnowMe agent is an AI. It runs on the Universal Agent Runtime, answers from KnowMe AI, LLC's curated knowledge base and cites its sources. It cannot act on your behalf, and your conversation threads are stored in your own browser.
