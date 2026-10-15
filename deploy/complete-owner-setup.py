#!/usr/bin/env python3
"""Retire the temporary proxy login only after a real admin/passkey exists."""
from pathlib import Path
import datetime
import json
import os
import runpy
import shutil
import sqlite3
import subprocess
import time

helpers = runpy.run_path(str(Path(__file__).with_name('configure-mcp-proxy.py')))
VHOST = helpers['VHOST']
response = helpers['response']
diagnostics = helpers['diagnostics']


def owner_ready():
    with sqlite3.connect('file:/var/lib/desk-edit/content.db?mode=ro', uri=True) as db:
        row = db.execute('SELECT value FROM options WHERE name=?', ('emdash:setup_complete',)).fetchone()
        complete = row and json.loads(row[0]) in (True, 'true')
        owners = db.execute('SELECT COUNT(*) FROM credentials c JOIN users u ON u.id=c.user_id WHERE u.role>=50').fetchone()[0]
    if not complete or not owners:
        raise RuntimeError('A completed setup with an administrator passkey is required. No changes applied.')


def remove_block(source, header):
    lines = source.splitlines(keepends=True)
    starts = [index for index, line in enumerate(lines) if line.strip() == header]
    if len(starts) != 1:
        raise RuntimeError('Expected exactly one temporary block; inspect the virtual host.')
    start = starts[0]
    depth = 0
    for end in range(start, len(lines)):
        depth += lines[end].count('{') - lines[end].count('}')
        if depth == 0:
            return ''.join(lines[:start] + lines[end + 1:])
    raise RuntimeError('Temporary block is not balanced.')


def verify():
    status, headers = response('/_emdash/admin/')
    if status not in (302, 303) or '/_emdash/admin/login' not in headers.get('Location', ''):
        raise RuntimeError('Anonymous admin must redirect to native login.')
    status, headers = response('/_emdash/admin/login')
    if status != 200 or 'text/html' not in headers.get('Content-Type', '') or headers.get('WWW-Authenticate'):
        raise RuntimeError('Native login page is not reachable without a proxy password.')
    status, headers = response('/_emdash/api/settings')
    if status != 401 or 'application/json' not in headers.get('Content-Type', ''):
        raise RuntimeError('Native authentication must still protect private settings.')
    for path, expected in [('/_emdash/api/setup', 409), ('/_emdash/api/setup/admin', 400), ('/_emdash/api/setup/admin/verify', 400)]:
        status, _ = response(path, 'POST')
        if status != expected:
            raise RuntimeError('Completed setup must reject reconfiguration: ' + path)
    status, headers = response('/_emdash/api/mcp', 'POST')
    if status != 401 or not headers.get('WWW-Authenticate', '').startswith('Bearer '):
        raise RuntimeError('MCP must retain native Bearer authentication.')
    status, _ = response('/')
    if status != 200:
        raise RuntimeError('Public homepage is unavailable.')


def main():
    if os.geteuid() != 0:
        raise SystemExit('Run as root on the existing MyJourney VPS.')
    owner_ready()
    original = VHOST.read_text()
    if 'realm desk_edit_setup {' not in original:
        if 'realm desk_edit_setup' in original:
            raise RuntimeError('Incomplete temporary realm; inspect before proceeding.')
        verify()
        print('Temporary login already retired; native authentication verified.')
        return
    before = diagnostics()
    changed = remove_block(original, helpers['NEW'])
    changed = remove_block(changed, 'realm desk_edit_setup {')
    for comment in ['# Temporary first-owner protection; remove after owner passkey is registered.\n',
                    '# Native protocol endpoints use EmDash Bearer/PKCE authentication.\n']:
        changed = changed.replace(comment, '')
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    directory = Path('/opt/desk-edit/backups/owner-setup-complete-' + stamp)
    directory.mkdir(mode=0o700, parents=True, exist_ok=False)
    backup = directory / 'affiliate-vhost.conf'
    shutil.copy2(VHOST, backup)
    try:
        owner_ready()
        VHOST.write_text(changed)
        if diagnostics() != before:
            raise RuntimeError('Proxy diagnostics changed.')
        subprocess.run(['systemctl', 'reload', 'lsws'], check=True)
        for attempt in range(5):
            try:
                verify()
                break
            except (RuntimeError, subprocess.CalledProcessError):
                if attempt == 4:
                    raise
                time.sleep(1)
    except Exception:
        shutil.copy2(backup, VHOST)
        subprocess.run(['systemctl', 'reload', 'lsws'], check=True)
        raise
    print('Temporary proxy password retired. Native passkey login, private API auth, and MCP Bearer auth verified.')
    print('Private proxy backup: ' + str(backup))


if __name__ == '__main__':
    main()
