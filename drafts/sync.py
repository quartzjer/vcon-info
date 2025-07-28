#!/usr/bin/env python3
import os
import re
import requests
from pathlib import Path
from typing import Dict, List, Tuple

def extract_draft_info(filename: str) -> Tuple[str, int]:
    """Extract draft name and revision number from filename."""
    match = re.match(r'(.*)-(\d+)\.txt$', filename)
    if match:
        return match.group(1), int(match.group(2))
    return None, None

def get_existing_drafts() -> Dict[str, int]:
    """Get all existing drafts and their current revision numbers."""
    drafts = {}
    for file in Path('.').glob('*.txt'):
        name, rev = extract_draft_info(file.name)
        if name and rev is not None:
            # Keep track of highest revision we have
            if name not in drafts or rev > drafts[name]:
                drafts[name] = rev
    return drafts

def check_revision_exists(draft_name: str, revision: int) -> bool:
    """Check if a specific revision exists on the IETF server."""
    url = f"https://www.ietf.org/archive/id/{draft_name}-{revision:02d}.txt"
    try:
        response = requests.head(url, timeout=10)
        return response.status_code == 200
    except requests.RequestException:
        return False

def download_revision(draft_name: str, revision: int) -> bool:
    """Download a specific revision."""
    filename = f"{draft_name}-{revision:02d}.txt"
    url = f"https://www.ietf.org/archive/id/{filename}"
    
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(response.text)
        
        print(f"  ✓ Downloaded {filename}")
        return True
    except requests.RequestException as e:
        print(f"  ✗ Failed to download {filename}: {e}")
        return False

def find_latest_revision(draft_name: str, current_rev: int) -> int:
    """Find the latest available revision for a draft."""
    print(f"Checking {draft_name} (currently have rev {current_rev:02d})...")
    
    # Start checking from current + 1
    check_rev = current_rev + 1
    latest_found = current_rev
    
    while True:
        print(f"  Checking revision {check_rev:02d}...", end=' ')
        if check_revision_exists(draft_name, check_rev):
            print("exists")
            latest_found = check_rev
            check_rev += 1
        else:
            print("not found")
            break
    
    return latest_found

def extract_draft_title(filename: str) -> str:
    """Extract the title from an IETF draft file."""
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Look for the first indented line that follows a whitespace-only line
        lines = content.split('\n')
        for i, line in enumerate(lines):
            # Check if current line has leading whitespace and actual content
            if re.match(r'^\s+\S', line):
                # Check if previous line exists and is whitespace-only
                if i > 0 and re.match(r'^\s*$', lines[i-1]):
                    return line.strip()
                
    except (IOError, UnicodeDecodeError) as e:
        print(f"  ⚠ Could not read {filename}: {e}")
    
    # Fallback to filename-based title
    draft_name = filename.replace('.txt', '').replace('draft-', '')
    return draft_name.replace('-', ' ').title()

def generate_readme(draft_info: Dict[str, int]):
    """Generate README.md with links to all drafts."""
    readme_content = """# VCON Draft Documents

This directory contains the latest revisions of VCON-related IETF drafts.

## Available Drafts

| Draft | Latest Revision | Link |
|-------|----------------|------|
"""
    
    # Sort drafts by name for consistent output
    for draft_name in sorted(draft_info.keys()):
        revision = draft_info[draft_name]
        filename = f"{draft_name}-{revision:02d}.txt"
        ietf_url = f"https://www.ietf.org/archive/id/{filename}"
        
        # Extract actual title from the draft file
        title = extract_draft_title(filename)
        
        readme_content += f"| {title} | {revision:02d} | [{filename}]({ietf_url}) |\n"
    
    readme_content += f"""
## Last Updated

This directory was last synchronized on: {requests.utils.default_headers()['User-Agent']}

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
"""
    
    with open('README.md', 'w', encoding='utf-8') as f:
        f.write(readme_content)
    
    print(f"\n✓ Generated README.md with {len(draft_info)} drafts")

def main():
    """Main sync process."""
    print("🔄 Starting VCON draft synchronization...\n")
    
    # Get existing drafts
    existing_drafts = get_existing_drafts()
    print(f"Found {len(existing_drafts)} existing drafts:")
    
    # Print existing drafts with their titles
    for draft_name, revision in existing_drafts.items():
        filename = f"{draft_name}-{revision:02d}.txt"
        title = extract_draft_title(filename)
        print(f"  • {title} (rev {revision:02d})")
    print()
    
    if not existing_drafts:
        print("No existing drafts found. Please run fetch.sh first or manually add some draft files.")
        return
    
    updated_drafts = {}
    total_updates = 0
    
    # Check each draft for updates
    for draft_name, current_rev in existing_drafts.items():
        filename = f"{draft_name}-{current_rev:02d}.txt"
        title = extract_draft_title(filename)
        print(f"Checking {title}...")
        print(f"  Current revision: {current_rev:02d}")
        
        latest_rev = find_latest_revision(draft_name, current_rev)
        
        if latest_rev > current_rev:
            print(f"  📥 Updating from {current_rev:02d} to {latest_rev:02d}")
            if download_revision(draft_name, latest_rev):
                total_updates += 1
            updated_drafts[draft_name] = latest_rev
        else:
            print(f"  ✓ Already have latest revision ({current_rev:02d})")
            updated_drafts[draft_name] = current_rev
        
        print()  # Empty line for readability
    
    # Generate updated README
    generate_readme(updated_drafts)
    
    # Summary
    print(f"🎉 Synchronization complete!")
    print(f"   • {total_updates} draft(s) updated")
    print(f"   • {len(updated_drafts)} total drafts tracked")
    print(f"   • README.md updated")

if __name__ == "__main__":
    main()
