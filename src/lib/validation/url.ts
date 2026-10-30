export interface UrlValidationResult {
  valid: boolean;
  normalizedUrl?: string;
  domain?: string;
  error?: string;
}

const DISALLOWED_PROTOCOLS = new Set([
  'javascript:',
  'data:',
  'file:',
  'ftp:',
  'mailto:',
  'tel:',
  'ssh:',
  'ws:',
  'wss:',
  'gopher:',
]);

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /\.local$/i,
  /\.internal$/i,
  /\.lan$/i,
  /\.home$/i,
  /\.test$/i,
  /\.invalid$/i,
];

function isPrivateOrLocalIp(hostname: string): boolean {
  // Direct loopback or wildcard
  if (hostname === '127.0.0.1' || hostname === '0.0.0.0' || hostname === '::1' || hostname === '[::1]') {
    return true;
  }

  // IPv4 check
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = hostname.match(ipv4Regex);
  if (match) {
    const octets = [
      parseInt(match[1], 10),
      parseInt(match[2], 10),
      parseInt(match[3], 10),
      parseInt(match[4], 10),
    ];

    // Range checks
    if (octets.some((oct) => oct < 0 || oct > 255)) {
      return true; // malformed IP
    }

    // 0.0.0.0/8
    if (octets[0] === 0) return true;

    // 10.0.0.0/8
    if (octets[0] === 10) return true;

    // 127.0.0.0/8 (Loopback)
    if (octets[0] === 127) return true;

    // 169.254.0.0/16 (Link-local / Cloud metadata service)
    if (octets[0] === 169 && octets[1] === 254) return true;

    // 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
    if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return true;

    // 192.168.0.0/16
    if (octets[0] === 192 && octets[1] === 168) return true;

    // 100.64.0.0/10 (Carrier-grade NAT)
    if (octets[0] === 100 && octets[1] >= 64 && octets[1] <= 127) return true;
  }

  // IPv6 checks
  const cleanIpv6 = hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (
    cleanIpv6.startsWith('fe80:') || // link-local
    cleanIpv6.startsWith('fc00:') || // unique local
    cleanIpv6.startsWith('fd00:') ||
    cleanIpv6 === '::' ||
    cleanIpv6 === '::1'
  ) {
    return true;
  }

  return false;
}

/**
 * Validates and normalizes a public web URL.
 * Protects against SSRF, internal network probing, credential leaking, and malformed inputs.
 */
export function validateAndNormalizeUrl(rawUrl: string): UrlValidationResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, error: 'URL must be a non-empty string.' };
  }

  let input = rawUrl.trim();

  // If no scheme is provided, default to https:// for user convenience
  if (!/^https?:\/\//i.test(input)) {
    // Check if it starts with another protocol like ftp://
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(input)) {
      return { valid: false, error: 'Only HTTP and HTTPS protocols are supported.' };
    }
    input = `https://${input}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    return { valid: false, error: 'Malformed URL. Please provide a valid web address.' };
  }

  const protocol = parsed.protocol.toLowerCase();
  if (protocol !== 'http:' && protocol !== 'https:') {
    return { valid: false, error: `Protocol "${protocol}" is not permitted. Only HTTP and HTTPS are supported.` };
  }

  if (DISALLOWED_PROTOCOLS.has(protocol)) {
    return { valid: false, error: 'Disallowed protocol.' };
  }

  // Disallow user credentials in URL (e.g. https://user:pass@example.com)
  if (parsed.username || parsed.password) {
    return { valid: false, error: 'URLs containing authentication credentials (user/password) are not permitted.' };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!hostname) {
    return { valid: false, error: 'URL is missing a valid hostname.' };
  }

  // Check private hostnames/TLDs
  for (const pattern of PRIVATE_HOST_PATTERNS) {
    if (pattern.test(hostname)) {
      return { valid: false, error: `Local, private, or test destination "${hostname}" is not allowed.` };
    }
  }

  // Check private / reserved IP addresses
  if (isPrivateOrLocalIp(hostname)) {
    return { valid: false, error: `Destination IP "${hostname}" is within a private, loopback, or reserved range.` };
  }

  // Ensure hostname has at least one dot unless it's an IP
  if (!hostname.includes('.') && !hostname.startsWith('[')) {
    return { valid: false, error: `Hostname "${hostname}" is invalid. Please provide a fully qualified public domain.` };
  }

  // Normalization
  // Remove default ports
  let port = parsed.port;
  if ((protocol === 'http:' && port === '80') || (protocol === 'https:' && port === '443')) {
    port = '';
  }

  const hostWithPort = port ? `${hostname}:${port}` : hostname;
  let pathname = parsed.pathname || '/';
  // Ensure pathname starts with /
  if (!pathname.startsWith('/')) {
    pathname = `/${pathname}`;
  }
  // Trim trailing slash if it is just root '/'
  if (pathname === '/' && !parsed.search && !parsed.hash) {
    pathname = '';
  }

  const search = parsed.search || '';
  // Reconstruct clean normalized URL
  const normalizedUrl = `${protocol}//${hostWithPort}${pathname}${search}`;

  return {
    valid: true,
    normalizedUrl,
    domain: hostname,
  };
}
