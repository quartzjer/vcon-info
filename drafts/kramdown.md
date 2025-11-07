Document skeleton

A kramdown-rfc document is Markdown + a YAML front-matter block and a few document-section markers.

---
title: vCon Zip Bundle
abbrev: vcon-zip-bundle
docname: draft-miller-vcon-zip-bundle-00
category: info
ipr: trust200902
area: ART
wg: vCon
stream: Independent
keyword: [vCon, zip, container, bundle, packaging, conversation]
date: 2025-11-06
author:
  - ins: J. Miller
    name: Jeremie Miller
    email: jeremie.miller@gmail.com
    uri: https://bsky.app/profile/jeremie.com
normative:
  RFC2119:
  RFC8174:
informative:
  RFC9000:
---

Then divide the body with three markers:

--- abstract
(plain paragraphs; no headings)

--- middle
# Introduction
…your main content…
# Security Considerations
…required section…
# IANA Considerations
…required/empty as appropriate…

--- back
# Acknowledgments
(optional)

These markers and metadata are the kramdown-rfc “contract” for shaping Markdown into RFCXML.

⸻

Headings, IDs, and cross-references

Headings

Use normal # / ## / ### Markdown headings for sections and subsections.

Assigning IDs (anchors)

Attach an ID to the next block with an Inline Attribute List (IAL):

# IANA Considerations {#iana}

or on its own line before/after the block:

{: #iana}
# IANA Considerations

IALs are part of core kramdown syntax and work for most blocks.

Cross-reference a local anchor

See {{iana}} for registry actions.

This emits an xml2rfc <xref> to that section.

⸻

Citations and reference lists

You can declare references in YAML and/or infer them inline:

Inline citation of RFCs / I-Ds
	•	Informative: {{?RFC9000}}
	•	Normative: {{!RFC2119}}
	•	Unqualified: {{RFC7252}} (treated per rules; best to qualify)

These auto-populate the references sections; you can skip YAML if you prefer all inline.

Predeclared references (optional)

YAML lets you name explicit anchors or external bibxml keys:

normative:
  RFC2119:
  RFC8174:
informative:
  RFC9000:

Then cite with {{RFC2119}}, etc.

⸻

Lists, paragraphs, emphasis, code

All standard Markdown works (ordered/unordered lists, emphasis, code spans). For fenced code blocks, use backticks or tildes:

~~~~
literal block
~~~~

(kramdown supports both fenced blocks and 4-space indents).

⸻

Figures, artwork, and captions

Monospace “artwork”

Use fenced code; give it an ID and a title via IAL:

~~~~
+-------+
| box   |
+-------+
~~~~
{: #ascii-fig title="Example ASCII diagram"}

The IAL adds <artwork> metadata (anchor/title).

Including external files as artwork

{::include path/to/snippet.txt}
{: #ex-snippet title="Wire format example"}

{::include …} literally includes file content at that point; the trailing IAL gives it identity/caption.

⸻

Tables (with attributes)

Use pipe tables; add attributes (ID, title, column alignment) via IAL:

| Code | Meaning  |
|-----:|----------|
|   00 | Success  |
|   01 | Failure  |
{: #retcodes title="Return Codes" cols="r l"}

cols="r l" hints column alignment to xml2rfc. IDs and titles create labeled, cross-referenceable tables.

Cross-reference the table with {{retcodes}}.

⸻

Links and URIs

Inline Markdown links are fine:

See [Example](https://example.com).

Any mention of an external URI also builds appropriate RFCXML link markup; xml2rfc can create a “URIs” section when needed.

⸻

Requirements language (BCP 14) boilerplate

To insert the BCP 14 boilerplate (2119/8174 “MUST/SHOULD” text) inside a section, kramdown-rfc provides a boilerplate macro:

## Requirements Language
{::boilerplate bcp14-tagged}

This drops in the standard text that references RFC 2119/8174; ensure you also cite those RFCs (e.g., {{!RFC2119}}, {{?RFC8174}}) so the references appear. Variants like bcp14-tagged-bcp exist; they control exact phrasing.

⸻

Attributes cheat-sheet (IAL)

You can attach IALs to most blocks to set:
	•	#id — anchor name
	•	title="..." — caption/title for figures/tables
	•	cols="..." — column alignment hints for tables
	•	other XML-relevant attributes as supported

Placement:

{: #id key="value"}
Block starts here…

or

Block…
{: #id title="My Title"}

IAL is a core kramdown feature used heavily by kramdown-rfc.

⸻

The three big “document parts”

Kramdown-rfc expects your content to be segmented with the section markers:
	•	--- abstract — only plain paragraphs (no headings).
	•	--- middle — all main content (Introduction, body, Security/IANA sections, etc.).
	•	--- back — references are auto-built; you can add Acknowledgments, Change Log, etc.

These markers map your Markdown to RFCXML <front>, <middle>, <back>.

