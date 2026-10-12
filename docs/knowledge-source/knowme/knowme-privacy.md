---
type: Concept
title: KnowMe privacy and data model
description: "How KnowMe is designed to handle a person's data, stated as design intent, and what that design does not yet guarantee."
status: stable
generated:
  by: km-cmo/fable
  at: "2026-10-12T19:00:00+00:00"
tags: [knowme, privacy, sovereignty]
---

# KnowMe privacy and data model

KnowMe is designed so that a person's data stays under their own control. KnowMe is not yet released, so everything on this page is KnowMe AI, LLC's design intent for KnowMe, not a guarantee about shipped software.

## KnowMe runs models on your own device by design

KnowMe is designed to run language models on the person's own hardware, so prompts and model weights need not leave the device. Cloud models are designed to be optional: sending anything to a cloud provider is meant to require the person's explicit approval through KnowMe's policy system, provider by provider.

## KnowMe keeps data local and decentralised by design

KnowMe is designed to store conversations, memory and settings in an encrypted database on the person's device, and to sync between the person's own devices and servers the person runs (BossFang), peer to peer, rather than through a cloud run by KnowMe AI, LLC. KnowMe is designed without a central account and without any training on a person's data.

## KnowMe is designed to depend on no single LLM vendor

KnowMe routes work through the Universal Agent Runtime, which can use local models or any of several model providers for the same tasks. The design goal is that a person is never locked to one vendor's models.

## What KnowMe's privacy design does not yet guarantee

KnowMe has not shipped. Several of the systems that would enforce these commitments across every device and feature, including multi-device sync, the policy system for Hands and the plugin host, are still being built. Until KnowMe is released and documented, treat these statements as design intent rather than as a promise about software you can run today.

## Privacy when you use the KnowMe agent on this site

Your conversations with the KnowMe agent on this site are stored as threads in your own browser, on your device. To answer you, the site sends your message to KnowMe AI, LLC's Universal Agent Runtime, where a language model composes the reply from the site's knowledge base. Nothing is sold on this site.
