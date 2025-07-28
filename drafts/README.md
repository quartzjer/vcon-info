# VCON Draft Documents

This directory contains the latest revisions of VCON-related IETF drafts.

## Available Drafts

| Draft | Latest Revision | Link |
|-------|----------------|------|
| Voice Conversation (vCon) Consent Attachment | 00 | [draft-howe-vcon-consent-00.txt](https://www.ietf.org/archive/id/draft-howe-vcon-consent-00.txt) |
| vCon Lifecycle Management using SCITT | 00 | [draft-howe-vcon-lifecycle-00.txt](https://www.ietf.org/archive/id/draft-howe-vcon-lifecycle-00.txt) |
| The JSON vCon - Contact Center Extension | 00 | [draft-ietf-vcon-cc-extension-00.txt](https://www.ietf.org/archive/id/draft-ietf-vcon-cc-extension-00.txt) |
| Privacy Primer for vCon Developers | 00 | [draft-ietf-vcon-privacy-primer-00.txt](https://www.ietf.org/archive/id/draft-ietf-vcon-privacy-primer-00.txt) |
| The JSON format for vCon - Conversation Data Container | 03 | [draft-ietf-vcon-vcon-container-03.txt](https://www.ietf.org/archive/id/draft-ietf-vcon-vcon-container-03.txt) |
| The JSON format for vCon - Conversation Data Container | 00 | [draft-ietf-vcon-vcon-core-00.txt](https://www.ietf.org/archive/id/draft-ietf-vcon-vcon-core-00.txt) |
| VCON for MIMI Messages | 02 | [draft-mahy-vcon-mimi-messages-02.txt](https://www.ietf.org/archive/id/draft-mahy-vcon-mimi-messages-02.txt) |

## Last Updated

This directory was last synchronized on: python-requests/2.32.4

## Usage

To update all drafts to their latest revisions:

```bash
python3 sync.py
```

The sync script will:
- Check for newer revisions of existing drafts
- Download any updates found
- Preserve older revisions
- Update this README with the latest information
