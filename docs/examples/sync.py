#!/usr/bin/env python3
"""
Script to sync .vcon example files from the IETF vcon repository.
Downloads the repo to a temp directory and copies all examples/*.vcon files
to the local working directory.
"""

import json
import os
import shutil
import subprocess
import tempfile
from pathlib import Path

REPO_URL = "https://github.com/ietf-wg-vcon/draft-ietf-vcon-vcon-core"

def main():
    # Get current working directory (already in examples dir)
    current_dir = Path.cwd()
    
    print(f"Syncing .vcon files to: {current_dir}")
    
    # Create temporary directory
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        repo_path = temp_path / "repo"
        
        print(f"Cloning repository to: {repo_path}")
        
        # Clone the repository
        try:
            subprocess.run([
                "git", "clone", "--depth", "1", REPO_URL, str(repo_path)
            ], check=True, capture_output=True, text=True)
        except subprocess.CalledProcessError as e:
            print(f"Error cloning repository: {e}")
            print(f"stderr: {e.stderr}")
            return 1
        
        # Find examples directory in the cloned repo
        repo_examples_dir = repo_path / "examples"
        
        if not repo_examples_dir.exists():
            print(f"No examples directory found in {repo_path}")
            return 1
        
        # Find all .vcon files in the examples directory
        vcon_files = list(repo_examples_dir.glob("*.vcon"))
        
        if not vcon_files:
            print("No .vcon files found in examples directory")
            return 0
        
        print(f"Found {len(vcon_files)} .vcon files")
        
        # Copy each .vcon file to current directory
        synced_files = []
        for vcon_file in vcon_files:
            dest_file = current_dir / vcon_file.name
            shutil.copy2(vcon_file, dest_file)
            synced_files.append(vcon_file.name)
            print(f"Copied: {vcon_file.name}")
        
        # Write list.json with array of synced filenames
        list_file = current_dir / "list.json"
        with open(list_file, 'w') as f:
            json.dump(synced_files, f, indent=2)
        print(f"Created: list.json with {len(synced_files)} files")
        
        print(f"Successfully synced {len(vcon_files)} .vcon files")
        return 0

if __name__ == "__main__":
    exit(main())
