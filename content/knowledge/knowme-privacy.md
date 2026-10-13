# KnowMe privacy and data model

KnowMe is designed so that a person's data stays under their own control. KnowMe is not yet released, so the KnowMe sections of this page are KnowMe AI, LLC's design intent for KnowMe, not a guarantee about shipped software. The last section describes what this website does with a message you type, which is different.

## KnowMe runs models on your own device by design

KnowMe is designed to run language models on the person's own hardware, so prompts and model weights need not leave the device. Cloud models are designed to be optional: sending anything to a cloud provider is meant to require the person's explicit approval through KnowMe's policy system, provider by provider.

## KnowMe keeps data local and decentralised by design

KnowMe is designed to store conversations, memory and settings in an encrypted local database on the person's device, and to sync between the person's own devices and servers the person runs (BossFang), peer to peer, rather than through a cloud run by KnowMe AI, LLC. KnowMe is designed without a central account and without training on a person's data.

## KnowMe is designed to depend on no single LLM vendor

KnowMe routes work through the Universal Agent Runtime, which can use local models or any of several model providers for the same tasks. The design goal is that a person is never locked to one vendor's models.

## What KnowMe's privacy design does not yet guarantee

KnowMe has not shipped. Several of the systems that would enforce these commitments across every device and feature, including multi-device sync, the policy system for Hands and the plugin host, are still being built. Until KnowMe is released and documented, treat these statements as design intent rather than as a promise about software you can run today.

## What happens to a message you type on this site (KnowMe)

When you send a message to the KnowMe agent on this site, it leaves your device. The site runs on KnowMe AI, LLC's Universal Agent Runtime, which stores the conversation's session state in its own database (SurrealDB) on the server. The reply is composed by a cloud language model, Qwen (qwen3.8-max), served through Alibaba Cloud's model service, and the search that finds knowledge-base passages uses Alibaba Cloud's embedding service. A copy of each thread is also kept in your browser. KnowMe AI, LLC has not published how long the site keeps conversation state. KnowMe the app is designed differently, with models on the person's own device; this website agent is not the KnowMe app.
