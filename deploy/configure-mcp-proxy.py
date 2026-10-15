#!/usr/bin/env python3
"""Allow native MCP/OAuth protocol traffic while preserving first-owner protection.

Run on the existing MyJourney VPS as root after deploying the MCP-enabled build.
This changes only the affiliate virtual host, with a backup and diagnostic checks.
It does not grant an OAuth client access or remove the owner's setup protection.
"""
from pathlib import Path
import datetime
import email
import os
import re
import shutil
import subprocess
import time

VHOST = Path('/www/server/panel/vhost/openlitespeed/detail/affiliate.restupambudi.my.id.conf')
ORIGIN = 'https://affiliate.restupambudi.my.id'
OLD = 'context /_emdash/ {'
PATTERN = r'^/_emdash/(?!(?:api/mcp|api/oauth/(?:register|token(?:/(?:refresh|revoke))?|device/(?:code|token)))$)'
NEW = 'context exp:' + PATTERN + ' {'


def diagnostics():
    result = subprocess.run(['/usr/local/lsws/bin/lshttpd', '-t'], capture_output=True, text=True)
    log = result.stdout + result.stderr
    relevant = sorted(re.sub(r'^.*?\[(?:WARN|ERROR|FATAL)\]\s*\[\d+\]\s*', '', line)
                      for line in log.splitlines() if any('[' + kind + ']' in line for kind in ['WARN', 'ERROR', 'FATAL']))
    if '[ERROR]' in log or '[FATAL]' in log:
        raise RuntimeError('Proxy configuration contains errors; no reload permitted.')
    return result.returncode, relevant


def response(path, method='GET'):
    # Test the local TLS virtual host directly. Cloudflare can reject generic
    # server-side probe user agents before they reach this proxy. The separate
    # Node MCP smoke check tests the public Cloudflare URL after this succeeds.
    command = ['curl', '--silent', '--show-error', '--http1.1', '--max-time', '20',
               '--noproxy', '*', '--resolve', 'affiliate.restupambudi.my.id:443:127.0.0.1',
               '--dump-header', '-', '--output', '/dev/null', '--write-out', '\n%{http_code}',
               '--request', method, '--header', 'Content-Type: application/json',
               '--header', 'Origin: ' + ORIGIN, '--header', 'X-EmDash-Request: 1']
    if method == 'POST':
        command.extend(['--data-binary', '[]'])
    command.append(ORIGIN + path)
    result = subprocess.run(command, capture_output=True, text=True, check=True)
    raw_headers, status = result.stdout.rsplit('\n', 1)
    headers = email.message_from_string(raw_headers.split('\n', 1)[1])
    return int(status), headers


def verify():
    for path in ['/_emdash/admin/setup', '/_emdash/api/setup', '/_emdash/api/setup/admin/verify',
                 '/%5Femdash/admin/setup', '/_emdash%2Fadmin/setup']:
        status, headers = response(path, 'POST' if '/api/' in path else 'GET')
        if status != 401 or not headers.get('WWW-Authenticate', '').startswith('Basic '):
            raise RuntimeError('First-owner protection check failed: ' + path)
    status, headers = response('/_emdash/api/mcp', 'POST')
    if status != 401 or not headers.get('WWW-Authenticate', '').startswith('Bearer '):
        raise RuntimeError('MCP must use native Bearer authentication, not proxy Basic authentication.')
    for path in ['/_emdash/api/mcp/', '/%5Femdash/api/mcp', '/_emdash%2Fapi/mcp']:
        status, headers = response(path, 'POST')
        if status not in (400, 401, 404):
            raise RuntimeError('Noncanonical MCP path was not rejected: ' + path)
    # An array is invalid for every protocol route, including device/code,
    # where an empty object would be a valid request that creates a device code.
    for suffix in ['register', 'token', 'device/code', 'device/token', 'token/refresh', 'token/revoke']:
        status, headers = response('/_emdash/api/oauth/' + suffix, 'POST')
        if status != 400 or 'application/json' not in headers.get('Content-Type', ''):
            raise RuntimeError('Malformed OAuth input did not reach native validation: ' + suffix)


def main():
    if os.geteuid() != 0:
        raise SystemExit('Run as root on the existing MyJourney VPS.')
    protected = re.compile(PATTERN)
    for path in ['/_emdash/admin/setup', '/_emdash/api/setup/admin/verify', '/_emdash/api/auth/register',
                 '/_emdash/oauth/authorize', '/_emdash/api/mcp/', '/_emdash/api/mcp/other', '/_emdash/api/oauth/register/other']:
        assert protected.match(path), 'Protection pattern must cover ' + path
    for path in ['/_emdash/api/mcp', '/_emdash/api/oauth/register', '/_emdash/api/oauth/token',
                 '/_emdash/api/oauth/token/revoke', '/_emdash/api/oauth/device/token']:
        assert not protected.match(path), 'Protocol path must use native auth: ' + path
    before = diagnostics()
    original = VHOST.read_text()
    if NEW in original:
        verify()
        print('MCP proxy routing is already configured and verified.')
        return
    if original.count(OLD) != 1 or 'authName MyJourney setup' not in original:
        raise SystemExit('Unexpected virtual-host configuration; inspect before applying.')
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    directory = Path('/opt/desk-edit/backups/mcp-proxy-' + stamp)
    directory.mkdir(mode=0o700, parents=True, exist_ok=False)
    backup = directory / 'affiliate-vhost.conf'
    shutil.copy2(VHOST, backup)
    changed = original.replace(OLD, '# Native protocol endpoints use EmDash Bearer/PKCE authentication.\n' + NEW)
    try:
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
    print('Native MCP/OAuth routing verified; owner setup and admin remain protected.')
    print('Private proxy backup: ' + str(backup))


if __name__ == '__main__':
    main()
