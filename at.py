#!/usr/bin/env python3
"""
IETF Author Tools API Client

Renders kramdown-rfc markdown files to XML, TXT, HTML, and PDF formats
using the IETF Author Tools API.
"""

import argparse
import os
import sys
import time
from pathlib import Path
from typing import Optional, Dict, Any
from urllib.parse import urlparse

try:
    import requests
except ImportError:
    print("Error: requests library not found. Install with: pip install requests")
    sys.exit(1)

try:
    from dotenv import load_dotenv
except ImportError:
    print("Error: python-dotenv library not found. Install with: pip install python-dotenv")
    sys.exit(1)


class IETFAuthorTools:
    """Client for IETF Author Tools API."""

    BASE_URL = "https://author-tools.ietf.org"

    def __init__(self, api_key: Optional[str] = None):
        """Initialize the API client.

        Args:
            api_key: Optional API key for authentication
        """
        self.api_key = api_key
        self.session = requests.Session()
        if api_key:
            self.session.headers['X-API-KEY'] = api_key

    def _make_request(self, endpoint: str, file_path: Path,
                     params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Make a request to the API.

        Args:
            endpoint: API endpoint path
            file_path: Path to the file to upload
            params: Optional query parameters

        Returns:
            Response JSON data

        Raises:
            requests.RequestException: On request failure
        """
        url = f"{self.BASE_URL}{endpoint}"

        with open(file_path, 'rb') as f:
            files = {'file': (file_path.name, f, 'text/markdown')}

            # Add API key to form data if not in headers
            data = {}
            if self.api_key and 'X-API-KEY' not in self.session.headers:
                data['apikey'] = self.api_key

            response = self.session.post(url, files=files, data=data, params=params)
            response.raise_for_status()

        return response.json()

    def render_text(self, file_path: Path) -> Dict[str, Any]:
        """Render to text format.

        Args:
            file_path: Path to the markdown file

        Returns:
            API response with url, errors, and warnings
        """
        return self._make_request('/api/render/text', file_path)

    def render_xml(self, file_path: Path) -> Dict[str, Any]:
        """Render to XML format.

        Args:
            file_path: Path to the markdown file

        Returns:
            API response with url, errors, and warnings
        """
        return self._make_request('/api/render/xml', file_path)

    def render_html(self, file_path: Path) -> Dict[str, Any]:
        """Render to HTML format.

        Args:
            file_path: Path to the markdown file

        Returns:
            API response with url, errors, and warnings
        """
        return self._make_request('/api/render/html', file_path)

    def render_pdf(self, file_path: Path) -> Dict[str, Any]:
        """Render to PDF format.

        Args:
            file_path: Path to the markdown file

        Returns:
            API response with url, errors, and warnings
        """
        return self._make_request('/api/render/pdf', file_path)

    def validate(self, file_path: Path) -> Dict[str, Any]:
        """Validate the document.

        Args:
            file_path: Path to the markdown file

        Returns:
            Validation results with errors, warnings, idnits output
        """
        return self._make_request('/api/validate', file_path)

    def idnits(self, file_path: Path, verbose: int = 0,
               submission: bool = False, year: Optional[str] = None) -> Dict[str, Any]:
        """Run idnits checks on the document.

        Args:
            file_path: Path to the markdown file
            verbose: Verbosity level (0-2)
            submission: Enable submission validation mode
            year: Year for boilerplate checking

        Returns:
            Idnits check results
        """
        params = {'verbose': verbose}
        if submission:
            params['submitcheck'] = 'true'
        if year:
            params['year'] = year

        return self._make_request('/api/idnits', file_path, params=params)

    def download_file(self, url: str, output_path: Path) -> None:
        """Download a file from a URL.

        Args:
            url: URL to download from
            output_path: Path to save the file to
        """
        response = self.session.get(url)
        response.raise_for_status()

        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'wb') as f:
            f.write(response.content)


def extract_docname(file_path: Path) -> str:
    """Extract the document name from the file by reading the YAML front matter.

    Args:
        file_path: Path to the markdown file

    Returns:
        Document name (e.g., draft-miller-vcon-zip-bundle-01)
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            in_yaml = False
            for line in f:
                if line.strip() == '---':
                    if not in_yaml:
                        in_yaml = True
                        continue
                    else:
                        break  # End of YAML front matter

                if in_yaml and line.startswith('docname:'):
                    docname = line.split(':', 1)[1].strip()
                    return docname
    except Exception as e:
        print(f"Warning: Could not extract docname from file: {e}")

    # Fallback to filename without extension
    return file_path.stem


def print_issues(response: Dict[str, Any], verbose: bool = False) -> bool:
    """Print errors and warnings from API response.

    Args:
        response: API response dictionary
        verbose: Print warnings in addition to errors

    Returns:
        True if there were errors, False otherwise
    """
    has_errors = False

    if 'errors' in response and response['errors']:
        has_errors = True
        print("\n❌ Errors:")
        for error in response['errors']:
            print(f"  {error}")

    if verbose and 'warnings' in response and response['warnings']:
        print("\n⚠️  Warnings:")
        for warning in response['warnings']:
            print(f"  {warning}")

    return has_errors


def render_all(client: IETFAuthorTools, file_path: Path, output_dir: Path,
               verbose: bool = False) -> bool:
    """Render to all formats.

    Args:
        client: API client instance
        file_path: Input markdown file
        output_dir: Output directory
        verbose: Print verbose output

    Returns:
        True if successful, False if errors occurred
    """
    docname = extract_docname(file_path)
    formats = [
        ('xml', client.render_xml, f"{docname}.xml"),
        ('txt', client.render_text, f"{docname}.txt"),
        ('html', client.render_html, f"{docname}.html"),
        ('pdf', client.render_pdf, f"{docname}.pdf"),
    ]

    success = True

    for format_name, render_func, output_filename in formats:
        print(f"\n🔄 Rendering to {format_name.upper()}...")

        try:
            response = render_func(file_path)

            if print_issues(response, verbose):
                print(f"❌ {format_name.upper()} rendering had errors")
                success = False
                continue

            if 'url' not in response:
                print(f"❌ No URL returned for {format_name.upper()}")
                success = False
                continue

            # Download the rendered file
            output_path = output_dir / output_filename
            client.download_file(response['url'], output_path)

            print(f"✅ {format_name.upper()} saved to: {output_path}")

        except requests.RequestException as e:
            print(f"❌ Error rendering {format_name.upper()}: {e}")
            success = False
        except Exception as e:
            print(f"❌ Unexpected error rendering {format_name.upper()}: {e}")
            success = False

    return success


def validate_document(client: IETFAuthorTools, file_path: Path, verbose: bool = False) -> bool:
    """Validate the document.

    Args:
        client: API client instance
        file_path: Input markdown file
        verbose: Print verbose output

    Returns:
        True if validation passed, False otherwise
    """
    print("\n🔍 Validating document...")

    try:
        response = client.validate(file_path)

        # Print validation results
        if 'errors' in response and response['errors']:
            print("\n❌ Validation Errors:")
            for error in response['errors']:
                print(f"  {error}")

        if 'warnings' in response and response['warnings']:
            print("\n⚠️  Validation Warnings:")
            for warning in response['warnings']:
                print(f"  {warning}")

        if verbose and 'idnits' in response:
            print("\n📋 Idnits Output:")
            print(response['idnits'])

        has_errors = bool(response.get('errors'))

        if not has_errors:
            print("\n✅ Validation passed!")

        return not has_errors

    except requests.RequestException as e:
        print(f"❌ Validation request failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error during validation: {e}")
        return False


def run_idnits(client: IETFAuthorTools, file_path: Path,
               verbose: int = 0, submission: bool = False) -> bool:
    """Run idnits checks.

    Args:
        client: API client instance
        file_path: Input markdown file
        verbose: Verbosity level (0-2)
        submission: Enable submission validation

    Returns:
        True if checks passed, False otherwise
    """
    print("\n🔍 Running idnits checks...")

    try:
        response = client.idnits(file_path, verbose=verbose, submission=submission)

        if 'output' in response:
            print("\n📋 Idnits Output:")
            print(response['output'])

        # Idnits returns success if there are no errors
        success = not response.get('errors')

        if success:
            print("\n✅ Idnits checks passed!")
        else:
            print("\n❌ Idnits checks found issues")

        return success

    except requests.RequestException as e:
        print(f"❌ Idnits request failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error during idnits: {e}")
        return False


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='IETF Author Tools API Client - Render and validate Internet-Drafts',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Render vconz.md to all formats
  %(prog)s vconz.md

  # Render to specific output directory
  %(prog)s vconz.md -o output/

  # Validate document
  %(prog)s vconz.md --validate

  # Run idnits checks
  %(prog)s vconz.md --idnits

  # Render with verbose output
  %(prog)s vconz.md -v

  # Use custom API key
  %(prog)s vconz.md --api-key YOUR_KEY_HERE
        """
    )

    parser.add_argument('input', type=Path, help='Input markdown file')
    parser.add_argument('-o', '--output', type=Path, default=Path('vconz'),
                       help='Output directory (default: vconz/)')
    parser.add_argument('-k', '--api-key', help='API key (or set IETF_API_KEY in .env)')
    parser.add_argument('-v', '--verbose', action='store_true',
                       help='Verbose output (show warnings)')

    # Action flags
    action_group = parser.add_argument_group('actions')
    action_group.add_argument('--validate', action='store_true',
                             help='Validate document without rendering')
    action_group.add_argument('--idnits', action='store_true',
                             help='Run idnits checks')
    action_group.add_argument('--idnits-verbose', type=int, choices=[0, 1, 2], default=0,
                             help='Idnits verbosity level (0-2)')
    action_group.add_argument('--submission', action='store_true',
                             help='Enable submission validation mode for idnits')
    action_group.add_argument('--xml-only', action='store_true',
                             help='Render XML only')
    action_group.add_argument('--txt-only', action='store_true',
                             help='Render TXT only')
    action_group.add_argument('--html-only', action='store_true',
                             help='Render HTML only')
    action_group.add_argument('--pdf-only', action='store_true',
                             help='Render PDF only')

    args = parser.parse_args()

    # Load environment variables
    load_dotenv()

    # Get API key from args or environment
    api_key = args.api_key or os.getenv('IETF_API_KEY')

    if not api_key:
        print("Warning: No API key provided. Some features may be rate-limited.")
        print("Set IETF_API_KEY in .env or use --api-key option.")

    # Check input file exists
    if not args.input.exists():
        print(f"Error: Input file not found: {args.input}")
        sys.exit(1)

    # Create API client
    client = IETFAuthorTools(api_key)

    # Extract docname for output files
    docname = extract_docname(args.input)
    print(f"📄 Processing: {args.input.name}")
    print(f"📋 Document: {docname}")

    # Handle different actions
    success = True

    if args.validate:
        success = validate_document(client, args.input, args.verbose)

    elif args.idnits:
        success = run_idnits(client, args.input, args.idnits_verbose, args.submission)

    elif args.xml_only:
        print(f"\n🔄 Rendering to XML...")
        try:
            response = client.render_xml(args.input)
            if not print_issues(response, args.verbose) and 'url' in response:
                output_path = args.output / f"{docname}.xml"
                client.download_file(response['url'], output_path)
                print(f"✅ XML saved to: {output_path}")
            else:
                success = False
        except Exception as e:
            print(f"❌ Error: {e}")
            success = False

    elif args.txt_only:
        print(f"\n🔄 Rendering to TXT...")
        try:
            response = client.render_text(args.input)
            if not print_issues(response, args.verbose) and 'url' in response:
                output_path = args.output / f"{docname}.txt"
                client.download_file(response['url'], output_path)
                print(f"✅ TXT saved to: {output_path}")
            else:
                success = False
        except Exception as e:
            print(f"❌ Error: {e}")
            success = False

    elif args.html_only:
        print(f"\n🔄 Rendering to HTML...")
        try:
            response = client.render_html(args.input)
            if not print_issues(response, args.verbose) and 'url' in response:
                output_path = args.output / f"{docname}.html"
                client.download_file(response['url'], output_path)
                print(f"✅ HTML saved to: {output_path}")
            else:
                success = False
        except Exception as e:
            print(f"❌ Error: {e}")
            success = False

    elif args.pdf_only:
        print(f"\n🔄 Rendering to PDF...")
        try:
            response = client.render_pdf(args.input)
            if not print_issues(response, args.verbose) and 'url' in response:
                output_path = args.output / f"{docname}.pdf"
                client.download_file(response['url'], output_path)
                print(f"✅ PDF saved to: {output_path}")
            else:
                success = False
        except Exception as e:
            print(f"❌ Error: {e}")
            success = False

    else:
        # Default: render to all formats
        success = render_all(client, args.input, args.output, args.verbose)

    if success:
        print("\n✅ All operations completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Some operations failed. Check output above.")
        sys.exit(1)


if __name__ == '__main__':
    main()
